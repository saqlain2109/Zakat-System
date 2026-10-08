import React from 'react';
import { useZakat } from '../context/ZakatContext';
import {
  History,
  X,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const VersionHistoryModal = ({ recordId, recordTitle, onClose }) => {
  const { getRecordHistory } = useZakat();

  if (!recordId) return null;

  const historyLogs = getRecordHistory(recordId);

  const formatLogDate = (isoStr) => {
    if (!isoStr) return 'Just now';
    const date = new Date(isoStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Version History & Audit Log</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-mono font-bold">
                  {recordId}
                </span>
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-sm">
                {recordTitle || 'Record timeline and modifications'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {historyLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="font-semibold text-slate-600">No modification logs yet</p>
              <p className="text-[11px] max-w-xs mx-auto text-slate-400">
                This record was initialized from the master database. Any future status toggles or edits will be recorded here with exact timestamps.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {historyLogs.map((log) => {
                const isStatusChange = log.actionType.includes('STATUS');
                const isUpdate = log.actionType.includes('UPDATE');
                const isCreate = log.actionType.includes('CREATE');

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                      isStatusChange
                        ? 'bg-emerald-500'
                        : isUpdate
                        ? 'bg-blue-600'
                        : 'bg-indigo-600'
                    }`} />

                    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                      {/* Top Bar: Timestamp and User */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.userName || 'Admin'}</span>
                          <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isStatusChange
                              ? 'bg-emerald-100 text-emerald-800'
                              : isUpdate
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {log.actionType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{formatLogDate(log.timestamp)}</span>
                        </div>
                      </div>

                      {/* Description Text */}
                      <p className="text-xs text-slate-700 font-medium">
                        {log.description}
                      </p>

                      {/* Diff Box: Before & After */}
                      {log.changedFields && log.changedFields.length > 0 && (
                        <div className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            Modified Fields & Values
                          </div>
                          <div className="divide-y divide-slate-100">
                            {log.changedFields.map((fieldDiff, idx) => (
                              <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                <span className="font-bold text-slate-700 min-w-[120px]">
                                  {fieldDiff.field}:
                                </span>
                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded line-through">
                                    {String(fieldDiff.from)}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                                    {String(fieldDiff.to)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Audited tamper-evident version history</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
