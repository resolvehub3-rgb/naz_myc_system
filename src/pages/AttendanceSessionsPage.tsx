import React, { useState } from 'react';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { AttendanceSession, ActivityType } from '../types/database';
import {
  CalendarDays,
  Plus,
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  QrCode,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface AttendanceSessionsPageProps {
  onNavigate: (tab: NavTab) => void;
}

const ACTIVITY_TYPES: ActivityType[] = [
  'Sunday Service',
  'MYC Meeting',
  'Youth Fellowship',
  'Bible Study',
  'Prayer Meeting',
  'Choir Rehearsal',
  'Church Committee Meeting',
  'Special Church Events',
];

export const AttendanceSessionsPage: React.FC<AttendanceSessionsPageProps> = ({ onNavigate }) => {
  const { sessions, activeSession, setActiveSession, createSession, updateSessionStatus, attendanceRecords } = useChurch();
  const { isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('Sunday Service');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await createSession({
        session_name: sessionName.trim(),
        activity_type: activityType,
        meeting_date: meetingDate,
        start_time: startTime,
        end_time: endTime || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create attendance session');
      } else {
        setIsModalOpen(false);
        setSessionName('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (session: AttendanceSession) => {
    await updateSessionStatus(session.id, 'active');
    setActiveSession(session);
  };

  const handleComplete = async (session: AttendanceSession) => {
    await updateSessionStatus(session.id, 'completed');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Create Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            Session Management
          </span>
          <h3 className="text-base font-extrabold text-[#0B2345]">Church Attendance Sessions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create and open meetings for QR attendance scanning.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-[#38BDF8]" />
            <span>New Attendance Session</span>
          </button>
        )}
      </div>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No attendance sessions created yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create an attendance session (e.g. Sunday Service or MYC Meeting) to begin recording church attendance.
          </p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl"
            >
              Create First Session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const isActive = session.status === 'active';
            const count = attendanceRecords.filter((r) => r.session_id === session.id).length;

            return (
              <div
                key={session.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between ${
                  isActive
                    ? 'border-[#123B70] ring-2 ring-[#38BDF8]/20 bg-gradient-to-br from-white to-[#F4F9FF]'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : session.status === 'completed'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isActive && <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />}
                      {session.status}
                    </span>

                    <span className="text-[11px] font-bold text-slate-400">
                      {session.activity_type}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-[#0B2345] mb-2 leading-snug">
                    {session.session_name}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#123B70]" />
                      <span>{session.meeting_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#123B70]" />
                      <span>
                        {session.start_time} {session.end_time ? `– ${session.end_time}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    <span className="text-base text-[#123B70]">{count}</span> Attendees
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSession(session);
                            onNavigate('qr_scanner');
                          }}
                          className="px-3 py-1.5 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Scan</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleComplete(session)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                            title="Mark Completed"
                          >
                            <Check className="w-4 h-4 text-emerald-600" />
                          </button>
                        )}
                      </>
                    ) : (
                      isAdmin && session.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleActivate(session)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Activate</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#38BDF8] bg-[#0B2345] px-2 py-0.5 rounded">
                  New Session
                </span>
                <h3 className="text-base font-extrabold text-[#0B2345] mt-1">
                  Create Attendance Session
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
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Session / Meeting Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Sunday Youth Divine Service, MYC General Meeting"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Activity Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                >
                  {ACTIVITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Meeting Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  End Time <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
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
                  {isSubmitting ? 'Creating...' : 'Create & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
