import React, { useState, useMemo } from 'react';
import { useChurch } from '../context/ChurchContext';
import { History, Search, Filter, ShieldCheck, Clock } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useChurch();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const actionMatch = log.action.toLowerCase().includes(q);
        const entityMatch = log.entity_type.toLowerCase().includes(q);
        const actorMatch = log.actor?.full_name?.toLowerCase().includes(q) || false;
        return actionMatch || entityMatch || actorMatch;
      }

      return true;
    });
  }, [auditLogs, actionFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            System Compliance
          </span>
          <h3 className="text-base font-extrabold text-[#0B2345]">
            Security Audit Trail ({filteredLogs.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all administrative actions and attendance updates.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, staff name, or entity..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="REGISTER_MEMBER">Member Registered</option>
            <option value="UPDATE_MEMBER">Member Updated</option>
            <option value="RECORD_ATTENDANCE">Attendance Recorded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit events found. All church operations are logged automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-[#123B70] bg-blue-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {log.entity_type} ({log.entity_id.slice(0, 8)}...)
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-[#0B2345]">
                      {log.actor?.full_name || 'System / Admin'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.new_values ? JSON.stringify(log.new_values) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
