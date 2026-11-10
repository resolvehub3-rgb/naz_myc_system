import React, { useState, useMemo } from 'react';
import { useChurch } from '../context/ChurchContext';
import { generateAttendancePdfReport, exportAttendanceToExcel } from '../lib/reports';
import {
  ClipboardList,
  Search,
  Filter,
  FileBarChart,
  FileSpreadsheet,
  Calendar,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';

export const AttendanceRecordsPage: React.FC = () => {
  const { attendanceRecords, sessions, members } = useChurch();

  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      // Session filter
      if (selectedSessionId !== 'all' && record.session_id !== selectedSessionId) {
        return false;
      }

      // Method filter
      if (methodFilter !== 'all' && record.attendance_method !== methodFilter) {
        return false;
      }

      // Date filter
      if (dateFilter) {
        const recordDate = new Date(record.arrival_timestamp).toISOString().split('T')[0];
        if (recordDate !== dateFilter) return false;
      }

      // Search query (member name, ID, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const memberName = record.member?.full_name?.toLowerCase() || '';
        const visitorName = record.visitor?.full_name?.toLowerCase() || '';
        const memberId = record.member?.membership_number?.toLowerCase() || '';
        const phone = (record.member?.telephone || record.visitor?.telephone || '').toLowerCase();

        return (
          memberName.includes(q) ||
          visitorName.includes(q) ||
          memberId.includes(q) ||
          phone.includes(q)
        );
      }

      return true;
    });
  }, [attendanceRecords, selectedSessionId, methodFilter, dateFilter, searchQuery]);

  // Export handlers
  const handleExportPdf = () => {
    const targetSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
    if (!targetSession) {
      alert('Please select a specific meeting session to generate its attendance PDF.');
      return;
    }

    generateAttendancePdfReport({
      session: targetSession,
      records: filteredRecords,
      totalMembersCount: members.length,
    });
  };

  const handleExportExcel = () => {
    const targetSession = sessions.find((s) => s.id === selectedSessionId);
    exportAttendanceToExcel({
      sessionName: targetSession?.session_name,
      records: filteredRecords,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Export Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
              Attendance Archives
            </span>
            <h3 className="text-base font-extrabold text-[#0B2345]">
              Church Attendance Records ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500">
              Complete historical record of all member, visitor and walk-in check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3.5 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileBarChart className="w-4 h-4 text-[#38BDF8]" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member name or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
            />
          </div>

          {/* Session Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none truncate"
            >
              <option value="all">All Meeting Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_name} ({s.meeting_date})
                </option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Check-in Methods</option>
              <option value="QR Scan">QR Code Scan</option>
              <option value="Manual Member Search">Manual Member Search</option>
              <option value="Walk-in Registration">Walk-in Registration</option>
              <option value="Visitor Registration">Visitor Registration</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No attendance records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || dateFilter || selectedSessionId !== 'all'
                ? 'Try clearing search filters to see all recorded attendance.'
                : 'Attendance records will appear here as members scan their QR cards.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Attendee Name</th>
                  <th className="py-3 px-4">Membership ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Arrival Date & Time</th>
                  <th className="py-3 px-4">Recording Method</th>
                  <th className="py-3 px-4">Telephone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => {
                  const isMember = Boolean(record.member_id);
                  const name = record.member?.full_name || record.visitor?.full_name || 'Attendee';
                  const id = record.member?.membership_number || '—';
                  const category = isMember
                    ? 'Registered Member'
                    : record.visitor?.visitor_type === 'walk_in'
                    ? 'Walk-in'
                    : 'Church Visitor';
                  const phone = record.member?.telephone || record.visitor?.telephone || '—';

                  const dateFormatted = new Date(record.arrival_timestamp).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeFormatted = new Date(record.arrival_timestamp).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#0B2345]">
                        {name}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isMember
                              ? 'bg-blue-50 text-[#123B70] border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {dateFormatted} at <strong className="text-[#0B2345]">{timeFormatted}</strong>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            record.attendance_method === 'QR Scan'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {record.attendance_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {phone}
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
  );
};
