import React, { useState, useMemo } from 'react';
import { useChurch } from '../context/ChurchContext';
import { Member, AttendanceSession } from '../types/database';
import { CameraScanner } from '../components/CameraScanner';
import {
  QrCode,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Radio,
  Clock,
  Wifi,
  WifiOff,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface ScannerPageProps {
  onNavigate: (tab: NavTab) => void;
}

class ScannerErrorBoundary extends React.Component<
  { children: React.ReactNode; onFallbackToManual: () => void },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode; onFallbackToManual: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.warn('Scanner error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Camera Scanner Unavailable</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Camera is not supported or accessible on this browser. You can still record attendance using Manual Search.
          </p>
          <button
            type="button"
            onClick={this.props.onFallbackToManual}
            className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Switch to Manual Search
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ScannerPage: React.FC<ScannerPageProps> = ({ onNavigate }) => {
  const {
    sessions,
    activeSession,
    setActiveSession,
    members,
    recordAttendance,
    attendanceRecords,
    registerVisitor,
    isOnline,
    offlineQueueCount,
  } = useChurch();

  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'visitor'>('camera');
  const [manualSearch, setManualSearch] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorType, setVisitorType] = useState<'first_timer' | 'returning_visitor' | 'walk_in'>('first_timer');
  const [isRecording, setIsRecording] = useState(false);
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Active or selected session
  const targetSession = activeSession || (sessions.find((s) => s.status === 'active') || null);

  // Present members count for this session
  const currentSessionRecords = useMemo(() => {
    if (!targetSession) return [];
    return attendanceRecords.filter((r) => r.session_id === targetSession.id);
  }, [attendanceRecords, targetSession]);

  const presentMemberIds = useMemo(() => {
    return new Set(currentSessionRecords.map((r) => r.member_id).filter(Boolean));
  }, [currentSessionRecords]);

  // Filtered members for manual search
  const manualFilteredMembers = useMemo(() => {
    const q = manualSearch.toLowerCase().trim();
    if (!q) return members.slice(0, 8);
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.membership_number.toLowerCase().includes(q) ||
        m.telephone.includes(q)
    );
  }, [members, manualSearch]);

  // Camera scan success handler
  const handleCameraScanSuccess = async (member: Member, arrivalTime: string) => {
    if (!targetSession) {
      setActionNotice({
        type: 'error',
        title: 'No Active Session',
        message: 'Please activate or select an attendance session before scanning.',
      });
      return;
    }

    const result = await recordAttendance({
      sessionId: targetSession.id,
      memberId: member.id,
      method: 'QR Scan',
    });

    if (result.alreadyRecorded) {
      setActionNotice({
        type: 'duplicate',
        title: 'Already Checked In',
        message: `${member.full_name} (${member.membership_number}) was already recorded at ${new Date(
          result.recordedAt || arrivalTime
        ).toLocaleTimeString('en-GB')}.`,
      });
    } else if (result.success) {
      setActionNotice({
        type: 'success',
        title: 'Attendance Recorded',
        message: `${member.full_name} (${member.membership_number}) check-in recorded successfully${
          result.isOffline ? ' (Saved to offline queue)' : ''
        }.`,
      });
    } else {
      setActionNotice({
        type: 'error',
        title: 'Attendance Error',
        message: result.error || 'Failed to record attendance',
      });
    }
  };

  // Manual mark present handler
  const handleManualMarkPresent = async (member: Member) => {
    if (!targetSession) return;
    setIsRecording(true);
    setActionNotice(null);

    const result = await recordAttendance({
      sessionId: targetSession.id,
      memberId: member.id,
      method: 'Manual Member Search',
    });

    if (result.alreadyRecorded) {
      setActionNotice({
        type: 'duplicate',
        title: 'Already Recorded',
        message: `${member.full_name} already checked in.`,
      });
    } else if (result.success) {
      setActionNotice({
        type: 'success',
        title: 'Marked Present',
        message: `Attendance marked manually for ${member.full_name}.`,
      });
    } else {
      setActionNotice({
        type: 'error',
        title: 'Error',
        message: result.error || 'Failed to record manual attendance',
      });
    }
    setIsRecording(false);
  };

  // Visitor check-in handler
  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSession) return;
    setIsRecording(true);
    setActionNotice(null);

    const result = await registerVisitor({
      full_name: visitorName.trim(),
      telephone: visitorPhone.trim() || undefined,
      session_id: targetSession.id,
      visitor_type: visitorType,
    });

    if (result.success) {
      setActionNotice({
        type: 'success',
        title: 'Visitor Registered',
        message: `Guest ${visitorName} checked in successfully.`,
      });
      setVisitorName('');
      setVisitorPhone('');
      setActiveTab('camera');
    } else {
      setActionNotice({
        type: 'error',
        title: 'Visitor Error',
        message: result.error || 'Failed to record visitor attendance',
      });
    }
    setIsRecording(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Active Session & Offline Status Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-[#123B70] uppercase">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              Scanning Meeting
            </span>
            {isOnline ? (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline Mode
              </span>
            )}
          </div>

          {targetSession ? (
            <div>
              <h3 className="text-base font-extrabold text-[#0B2345] truncate">
                {targetSession.session_name}
              </h3>
              <p className="text-xs text-slate-500">
                {targetSession.activity_type} • {targetSession.meeting_date}
              </p>
            </div>
          ) : (
            <div className="text-rose-600 text-xs font-bold">
              No active attendance session selected.
            </div>
          )}
        </div>

        {/* Live Attendance Counter Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-[#EAF6FF] border border-[#38BDF8]/40 px-3.5 py-1.5 rounded-xl text-center">
            <span className="text-[9.5px] font-bold uppercase text-slate-500 block leading-tight">
              Present Today
            </span>
            <span className="text-lg font-black text-[#0B2345] leading-none">
              {currentSessionRecords.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('attendance_sessions')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            title="Switch Session"
          >
            Change
          </button>
        </div>
      </div>

      {/* Mode Tabs: Camera Scanner, Manual Search, Visitor Registration */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'camera'
              ? 'bg-[#123B70] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Camera Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'manual'
              ? 'bg-[#123B70] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Manual Search</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visitor')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'visitor'
              ? 'bg-[#123B70] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Visitor / Guest</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : actionNotice.type === 'duplicate'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <h5 className="font-extrabold uppercase tracking-wide">{actionNotice.title}</h5>
            <p className="mt-0.5 font-medium leading-relaxed">{actionNotice.message}</p>
          </div>
        </div>
      )}

      {/* Main View According to Active Tab */}
      {activeTab === 'camera' && (
        targetSession ? (
          <ScannerErrorBoundary onFallbackToManual={() => setActiveTab('manual')}>
            <CameraScanner
              session={targetSession}
              members={members}
              onAttendanceSuccess={handleCameraScanSuccess}
            />
          </ScannerErrorBoundary>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Active Session</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Please activate a church meeting before opening the camera scanner.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('attendance_sessions')}
              className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl"
            >
              Go to Sessions
            </button>
          </div>
        )
      )}

      {/* Manual Search Mode */}
      {activeTab === 'manual' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2345]">
              Manual Attendance Check-In
            </h4>
            <p className="text-xs text-slate-500">
              For members who forgot or misplaced their physical membership card.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              placeholder="Search by full name, ID (MYC-000001), or telephone..."
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {manualFilteredMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching church members found.
              </div>
            ) : (
              manualFilteredMembers.map((member) => {
                const isAlreadyPresent = presentMemberIds.has(member.id);

                return (
                  <div
                    key={member.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors px-1"
                  >
                    <div className="min-w-0 pr-2">
                      <h5 className="text-xs font-bold text-[#0B2345] truncate">
                        {member.full_name}
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-mono font-bold text-[#123B70]">
                          {member.membership_number}
                        </span>
                        <span>•</span>
                        <span>{member.telephone}</span>
                      </div>
                    </div>

                    {isAlreadyPresent ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200 flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Present</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleManualMarkPresent(member)}
                        disabled={isRecording}
                        className="px-3.5 py-1.5 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Mark Present</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Visitor / Guest Registration Mode */}
      {activeTab === 'visitor' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2345]">
              Visitor & Walk-in Registration
            </h4>
            <p className="text-xs text-slate-500">
              Record first-time visitors, returning guests, or walk-ins without enrolling as permanent members yet.
            </p>
          </div>

          <form onSubmit={handleRegisterVisitor} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Guest / Visitor Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="e.g. Sister Grace Mensah"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Telephone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="e.g. 024 123 4567"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Visitor Category
              </label>
              <select
                value={visitorType}
                onChange={(e) => setVisitorType(e.target.value as typeof visitorType)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#123B70]"
              >
                <option value="first_timer">First-Time Church Visitor</option>
                <option value="returning_visitor">Returning Visitor</option>
                <option value="walk_in">Walk-in Attendee</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isRecording}
              className="w-full py-2.5 px-4 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{isRecording ? 'Recording...' : 'Record Visitor Attendance'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
