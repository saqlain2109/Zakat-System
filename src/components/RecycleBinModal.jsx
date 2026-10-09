import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import {
  Trash2,
  X,
  RotateCcw,
  Calendar,
  Receipt,
  Users2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Layers,
  ShieldCheck
} from 'lucide-react';

export const RecycleBinModal = ({ isOpen, onClose }) => {
  const {
    recycleBin,
    restoreFromRecycleBin,
    permanentlyDeleteFromRecycleBin,
    emptyRecycleBin
  } = useZakat();

  const { isAuditor, isReadOnly } = useAuth();

  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'year', 'distribution', 'beneficiary'
  const [actionNotice, setActionNotice] = useState('');

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const filteredItems = useMemo(() => {
    if (filterType === 'ALL') return recycleBin;
    return recycleBin.filter(item => item.itemType === filterType);
  }, [recycleBin, filterType]);

  if (!isOpen) return null;

  const handleRestore = (item) => {
    restoreFromRecycleBin(item.id);
    showNotice(`Successfully restored "${item.title}" back to active database!`);
  };

  const handlePermanentDelete = (item) => {
    if (window.confirm(`Permanently purge "${item.title}"? This cannot be undone.`)) {
      permanentlyDeleteFromRecycleBin(item.id);
      showNotice(`Permanently deleted "${item.title}".`);
    }
  };

  const handleEmptyAll = () => {
    if (window.confirm('Are you sure you want to permanently empty the entire Recycle Bin?')) {
      emptyRecycleBin();
      showNotice('Recycle Bin emptied.');
    }
  };

  const getItemIcon = (type) => {
    if (type === 'year') return <Calendar className="w-5 h-5 text-amber-600" />;
    if (type === 'distribution') return <Receipt className="w-5 h-5 text-blue-600" />;
    return <Users2 className="w-5 h-5 text-purple-600" />;
  };

  const formatDeletedDate = (isoStr) => {
    if (!isoStr) return 'Recently';
    const date = new Date(isoStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>System Recycle Bin</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full font-bold">
                  {recycleBin.length} {recycleBin.length === 1 ? 'item' : 'items'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Deleted records remain safely stored here for 30 days before permanent removal.
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

        {/* Action Notice */}
        {actionNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Filter Tabs & Empty All Button */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({recycleBin.length})
            </button>
            <button
              onClick={() => setFilterType('year')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                filterType === 'year'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Years ({recycleBin.filter(i => i.itemType === 'year').length})
            </button>
            <button
              onClick={() => setFilterType('distribution')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                filterType === 'distribution'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Payments ({recycleBin.filter(i => i.itemType === 'distribution').length})
            </button>
            <button
              onClick={() => setFilterType('beneficiary')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                filterType === 'beneficiary'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Beneficiaries ({recycleBin.filter(i => i.itemType === 'beneficiary').length})
            </button>
          </div>

          {recycleBin.length > 0 && !(isAuditor || isReadOnly) && (
            <button
              onClick={handleEmptyAll}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Bin</span>
            </button>
          )}
        </div>

        {/* Item List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-700">Recycle Bin is Empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                When you delete assessment years, payments, or beneficiaries, they will appear here and can be restored within 30 days.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getItemIcon(item.itemType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.title}
                      </h4>
                      <span className="px-2 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-bold uppercase">
                        {item.itemType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {item.subtitle}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Deleted {formatDeletedDate(item.deletedAt)}
                      </span>
                      <span>•</span>
                      <span className="text-amber-700 font-medium">
                        30 days recovery remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Restore & Purge Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!(isAuditor || isReadOnly) ? (
                    <>
                      <button
                        onClick={() => handleRestore(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                        title="Restore record to active database"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Permanently Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      Audit Inspection Only
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Accidental data loss protection active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
