import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { exportToCSV } from '../utils/formatters';
import {
  ShieldCheck,
  Search,
  Download,
  Clock,
  User,
  Activity,
  Calendar
} from 'lucide-react';

export const AuditLogScreen = () => {
  const { auditLogs } = useZakat();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.description.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.entityName.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q);

      const matchesAction = actionFilter === 'ALL' || log.actionType === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.actionType))).filter(Boolean);
  }, [auditLogs]);

  const handleExportCSV = () => {
    const data = filteredLogs.map(l => ({
      ID: l.id,
      User: l.userName,
      'Action Type': l.actionType,
      Entity: l.entityName,
      'Record ID': l.recordId,
      Description: l.description,
      Timestamp: l.timestamp
    }));
    exportToCSV(data, 'Zakat_System_Audit_Log.csv');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Compliance & Financial Audit Trail</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Chronological audit log tracking financial payouts, status transitions, profile edits, and budget updates.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 shadow-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, user, record ID..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Action Types ({auditLogs.length} total events)</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Timestamp</th>
                <th className="py-3 px-3.5 font-semibold">User</th>
                <th className="py-3 px-3.5 font-semibold">Action Type</th>
                <th className="py-3 px-3.5 font-semibold">Entity / ID</th>
                <th className="py-3 px-3.5 font-semibold">Change Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{log.userName}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px]">
                    <span className="text-slate-400">{log.entityName}</span>: <strong className="text-slate-800">{log.recordId}</strong>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-800">
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
