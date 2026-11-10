import React from 'react';
import {
  Users,
  CheckCircle,
  UserCheck,
  Footprints,
  CalendarDays,
  QrCode,
  UserPlus,
  CreditCard,
  FileBarChart,
  ArrowUpRight,
  Clock,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    members,
    sessions,
    activeSession,
    attendanceRecords,
    visitors,
    isLoading,
    setActiveSession,
  } = useChurch();

  // Calculate real metrics from Supabase data
  const totalRegistered = members.length;

  // Filter records for active session or latest session
  const targetSession = activeSession || (sessions.length > 0 ? sessions[0] : null);
  const sessionRecords = targetSession
    ? attendanceRecords.filter((r) => r.session_id === targetSession.id)
    : [];

  const sessionPresentMembers = sessionRecords.filter((r) => r.member_id).length;
  const sessionVisitors = visitors.filter((v) => targetSession && v.session_id === targetSession.id).length;
  const sessionWalkIns = sessionRecords.filter((r) => r.attendance_method === 'Walk-in Registration').length;
  const totalSessionAttendance = sessionRecords.length;

  const attendanceRate = totalRegistered > 0
    ? Math.round((sessionPresentMembers / totalRegistered) * 100)
    : 0;

  // Recent attendance (top 8)
  const recentRecords = attendanceRecords.slice(0, 8);

  // Recent members (top 5)
  const recentMembers = members.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Active Session Highlight Banner */}
      {targetSession ? (
        <div className="bg-gradient-to-r from-[#0B2345] to-[#123B70] text-white p-4 sm:p-6 rounded-2xl shadow-sm border border-[#38BDF8]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                {targetSession.status === 'active' ? 'Active Meeting' : `${targetSession.status} Session`}
              </span>
              <span className="text-xs text-slate-300">{targetSession.activity_type}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold truncate text-white">
              {targetSession.session_name}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Meeting Date: <span className="font-semibold text-white">{targetSession.meeting_date}</span> | Start Time: <span className="font-semibold text-white">{targetSession.start_time}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('qr_scanner')}
              className="px-4 py-2.5 bg-[#38BDF8] hover:bg-sky-300 text-[#0B2345] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch QR Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('attendance_sessions')}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all"
            >
              Switch Meeting
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#EAF6FF] border border-[#38BDF8]/40 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B2345]">No Active Attendance Session</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Create or select a church service or MYC meeting session to start scanning attendance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('attendance_sessions')}
            className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl hover:bg-[#0B2345] shadow-xs"
          >
            Create Session
          </button>
        </div>
      )}

      {/* 4 Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Registered Members */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Registered Members
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF6FF] text-[#123B70] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2345]">
            {isLoading ? '—' : totalRegistered}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total youth roster</p>
        </div>

        {/* Card 2: Attendance for Selected Meeting */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Session Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2345]">
            {isLoading ? '—' : totalSessionAttendance}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Members Present: {sessionPresentMembers}</span>
            <span className="font-bold text-emerald-600">{attendanceRate}%</span>
          </div>
        </div>

        {/* Card 3: Total Visitors */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Visitors
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2345]">
            {isLoading ? '—' : sessionVisitors}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Guest attendees for session</p>
        </div>

        {/* Card 4: Total Walk-In Attendees */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Walk-in Attendees
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2345]">
            {isLoading ? '—' : sessionWalkIns}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded walk-ins</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            type="button"
            onClick={() => onNavigate('add_member')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-[#EAF6FF] text-[#0B2345] transition-all border border-slate-100 group"
          >
            <UserPlus className="w-5 h-5 text-[#123B70] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">Add Member</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('membership_cards')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-[#EAF6FF] text-[#0B2345] transition-all border border-slate-100 group"
          >
            <CreditCard className="w-5 h-5 text-[#123B70] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">ID Cards</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('attendance_sessions')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-[#EAF6FF] text-[#0B2345] transition-all border border-slate-100 group"
          >
            <CalendarDays className="w-5 h-5 text-[#123B70] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">New Session</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('qr_scanner')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#0B2345] text-white hover:bg-[#123B70] transition-all border border-[#0B2345] shadow-xs group"
          >
            <QrCode className="w-5 h-5 text-[#38BDF8] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">QR Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('visitors')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-[#EAF6FF] text-[#0B2345] transition-all border border-slate-100 group"
          >
            <UserCheck className="w-5 h-5 text-[#123B70] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">Visitors</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('attendance_records')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-[#EAF6FF] text-[#0B2345] transition-all border border-slate-100 group"
          >
            <Clock className="w-5 h-5 text-[#123B70] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">Records</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reports')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-[#EAF6FF] text-[#0B2345] transition-all border border-slate-100 group"
          >
            <FileBarChart className="w-5 h-5 text-[#123B70] group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-[11px] font-bold text-center leading-tight">Reports</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Section: Recent Attendance Table & Recent Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Attendance Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0B2345]">Recent Attendance Check-Ins</h3>
              <p className="text-xs text-slate-500">Live stream of recorded church members and visitors</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('attendance_records')}
              className="text-xs font-bold text-[#123B70] hover:text-[#38BDF8] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRecords.length === 0 ? (
            <div className="p-10 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h5 className="text-sm font-bold text-slate-700">No attendance records yet</h5>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                Open the QR scanner or register a member present to begin recording church attendance.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('qr_scanner')}
                className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Open QR Scanner
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Member / Attendee</th>
                    <th className="py-2.5 px-3">ID / Category</th>
                    <th className="py-2.5 px-3">Arrival Time</th>
                    <th className="py-2.5 px-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRecords.map((record) => {
                    const name = record.member?.full_name || record.visitor?.full_name || 'Attendee';
                    const id = record.member?.membership_number || (record.visitor ? 'Visitor' : 'Walk-in');
                    const time = new Date(record.arrival_timestamp).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#0B2345]">
                          {name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {id}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">
                          {time}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              record.attendance_method === 'QR Scan'
                                ? 'bg-sky-50 text-[#123B70] border border-sky-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {record.attendance_method}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Recent Members Roster */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0B2345]">Recent Members</h3>
              <p className="text-xs text-slate-500">Newly enrolled youth club members</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('members')}
              className="text-xs font-bold text-[#123B70] hover:text-[#38BDF8] flex items-center gap-1"
            >
              <span>Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentMembers.length === 0 ? (
            <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
              <Users className="w-8 h-8 text-slate-300 mb-2" />
              <h5 className="text-xs font-bold text-slate-700">No members registered yet</h5>
              <p className="text-[11px] text-slate-500 mt-1 mb-3">
                Register your first church member to start generating ID cards.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('add_member')}
                className="px-3.5 py-1.5 bg-[#123B70] text-white text-xs font-bold rounded-xl"
              >
                Add Member
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 flex-1">
              {recentMembers.map((member) => (
                <div key={member.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-[#0B2345] truncate">
                      {member.full_name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span className="font-mono font-semibold text-slate-700">
                        {member.membership_number}
                      </span>
                      <span>•</span>
                      <span>{member.telephone}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('membership_cards')}
                    className="p-1.5 rounded-lg text-[#123B70] hover:bg-[#EAF6FF] transition-colors"
                    title="View Membership Card"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
