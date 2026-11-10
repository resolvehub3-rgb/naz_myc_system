import React, { useState, useMemo } from 'react';
import { useChurch } from '../context/ChurchContext';
import { generateAttendancePdfReport, exportAttendanceToExcel } from '../lib/reports';
import {
  FileBarChart,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Users,
  UserCheck,
  Footprints,
  Printer,
  Download,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { sessions, attendanceRecords, members } = useChurch();

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions.length > 0 ? sessions[0].id : ''
  );

  const selectedSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || (sessions.length > 0 ? sessions[0] : null);
  }, [sessions, selectedSessionId]);

  const sessionRecords = useMemo(() => {
    if (!selectedSession) return [];
    return attendanceRecords.filter((r) => r.session_id === selectedSession.id);
  }, [attendanceRecords, selectedSession]);

  const memberRecords = sessionRecords.filter((r) => r.member_id);
  const visitorRecords = sessionRecords.filter((r) => r.visitor_id);
  const walkInRecords = sessionRecords.filter((r) => r.attendance_method === 'Walk-in Registration');

  const attendanceRate = members.length > 0
    ? Math.round((memberRecords.length / members.length) * 100)
    : 0;

  const handleDownloadPdf = () => {
    if (!selectedSession) {
      alert('Please select an attendance session first.');
      return;
    }
    generateAttendancePdfReport({
      session: selectedSession,
      records: sessionRecords,
      totalMembersCount: members.length,
    });
  };

  const handleExportExcel = () => {
    if (!selectedSession) return;
    exportAttendanceToExcel({
      sessionName: selectedSession.session_name,
      records: sessionRecords,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Session Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            Official Church Reporting
          </span>
          <h3 className="text-base font-extrabold text-[#0B2345]">
            Attendance Reports & Analytics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate printable PDF attendance sheets and export structured Excel files for church records.
          </p>
        </div>

        {/* Meeting Session Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-[#123B70]" />
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_name} ({s.meeting_date})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!selectedSession}
            className="px-4 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Generate PDF Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={!selectedSession}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {selectedSession ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Roster
              </span>
              <div className="text-2xl font-black text-[#0B2345]">{members.length}</div>
              <span className="text-[11px] text-slate-400">Registered youth members</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Members Present
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {memberRecords.length}
                <span className="text-sm font-bold text-slate-500 ml-1.5">
                  ({attendanceRate}%)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Scanned & verified members</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Visitors & Guests
              </span>
              <div className="text-2xl font-black text-sky-600">
                {visitorRecords.length + walkInRecords.length}
              </div>
              <span className="text-[11px] text-slate-400">First-timers & walk-ins</span>
            </div>

            <div className="bg-[#0B2345] text-white p-4 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold text-[#38BDF8] uppercase tracking-wider block mb-1">
                Total Service Attendance
              </span>
              <div className="text-2xl font-black text-white">{sessionRecords.length}</div>
              <span className="text-[11px] text-slate-300">Total counted in service</span>
            </div>
          </div>

          {/* Report Preview Document */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-base font-extrabold text-[#0B2345]">
                  {selectedSession.session_name} – Attendance Sheet
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Activity Type: {selectedSession.activity_type} • Date: {selectedSession.meeting_date}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Report Timestamp</span>
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {new Date().toLocaleString('en-GB')}
                </span>
              </div>
            </div>

            {sessionRecords.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No attendance recorded for this session yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Attendee Name</th>
                      <th className="py-2.5 px-3">Membership ID</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Telephone</th>
                      <th className="py-2.5 px-3">Arrival Time</th>
                      <th className="py-2.5 px-3">Check-in Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionRecords.map((rec, index) => {
                      const isMember = Boolean(rec.member_id);
                      const name = rec.member?.full_name || rec.visitor?.full_name || 'Attendee';
                      const id = rec.member?.membership_number || '—';
                      const phone = rec.member?.telephone || rec.visitor?.telephone || '—';
                      const time = new Date(rec.arrival_timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-400 font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0B2345]">{name}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{id}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                isMember
                                  ? 'bg-blue-50 text-[#123B70]'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {isMember ? 'Member' : 'Guest'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{phone}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#0B2345]">{time}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {rec.attendance_method}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No attendance sessions found. Please create a session first.
        </div>
      )}
    </div>
  );
};
