import React, { useState, useMemo } from 'react';
import { useChurch } from '../context/ChurchContext';
import { Visitor, VisitorType } from '../types/database';
import {
  UserCheck,
  UserPlus,
  Footprints,
  Search,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface VisitorsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const VisitorsPage: React.FC<VisitorsPageProps> = ({ onNavigate }) => {
  const { visitors, sessions, activeSession, registerVisitor, registerMember } = useChurch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState<string>(activeSession?.id || (sessions[0]?.id ?? ''));
  const [visitorType, setVisitorType] = useState<VisitorType>('first_timer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [convertingVisitor, setConvertingVisitor] = useState<Visitor | null>(null);

  const filteredVisitors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return visitors;
    return visitors.filter(
      (v) =>
        v.full_name.toLowerCase().includes(q) ||
        (v.telephone && v.telephone.includes(q))
    );
  }, [visitors, searchQuery]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setErrorMsg('Please select a meeting session');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await registerVisitor({
        full_name: fullName.trim(),
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        session_id: sessionId,
        visitor_type: visitorType,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to record visitor attendance');
      } else {
        setIsModalOpen(false);
        setFullName('');
        setTelephone('');
        setEmail('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToMember = async (visitor: Visitor) => {
    if (!visitor.telephone) {
      alert('A valid phone number is required to enroll this visitor as a full church member. Please edit or add phone.');
      return;
    }

    const res = await registerMember({
      full_name: visitor.full_name,
      telephone: visitor.telephone,
      email: visitor.email || undefined,
      notes: `Converted from ${visitor.visitor_type} registered on ${new Date(visitor.arrival_timestamp).toLocaleDateString('en-GB')}`,
    });

    if (res.success) {
      alert(`Successfully enrolled ${visitor.full_name} as permanent member with ID ${res.member?.membership_number}!`);
      onNavigate('membership_cards');
    } else {
      alert(res.error || 'Failed to enroll member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            Guest Attendance
          </span>
          <h3 className="text-base font-extrabold text-[#0B2345]">
            Visitors & Walk-in Attendees ({visitors.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Keep track of all first-timers, visiting members, and unregistered walk-ins.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4 text-[#38BDF8]" />
          <span>Register Visitor / Walk-in</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visitor name or phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
            />
          </div>
        </div>

        {filteredVisitors.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No visitors recorded yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Visitors recorded during services and meetings will be listed here.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl"
            >
              Record First Visitor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Visitor Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Telephone</th>
                  <th className="py-3 px-4">Check-in Date & Time</th>
                  <th className="py-3 px-4 text-right">Convert to Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisitors.map((vis) => {
                  const arrivalFormatted = new Date(vis.arrival_timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={vis.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0B2345]">
                        {vis.full_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            vis.visitor_type === 'first_timer'
                              ? 'bg-emerald-100 text-emerald-800'
                              : vis.visitor_type === 'walk_in'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {vis.visitor_type === 'first_timer'
                            ? 'First-Time Guest'
                            : vis.visitor_type === 'walk_in'
                            ? 'Walk-in Attendee'
                            : 'Returning Visitor'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {vis.telephone || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {arrivalFormatted}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleConvertToMember(vis)}
                          className="px-3 py-1 bg-[#123B70] hover:bg-[#0B2345] text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all inline-flex items-center gap-1"
                        >
                          <span>Enroll Member</span>
                          <ArrowRight className="w-3 h-3 text-[#38BDF8]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visitor Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#38BDF8] bg-[#0B2345] px-2 py-0.5 rounded">
                  Guest Registration
                </span>
                <h3 className="text-base font-extrabold text-[#0B2345] mt-1">
                  Register Visitor or Walk-in
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Bro. Emmanuel Osei"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Telephone Number
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="e.g. 024 123 4567"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="emmanuel@gmail.com"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meeting Session <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.session_name} ({s.meeting_date})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Visitor Classification
                </label>
                <select
                  value={visitorType}
                  onChange={(e) => setVisitorType(e.target.value as VisitorType)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                >
                  <option value="first_timer">First-Time Church Visitor</option>
                  <option value="returning_visitor">Returning Guest</option>
                  <option value="walk_in">Walk-in Attendee</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#123B70] text-white font-bold rounded-xl shadow-xs hover:bg-[#0B2345] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Register Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
