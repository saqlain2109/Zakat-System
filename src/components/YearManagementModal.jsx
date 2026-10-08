import React, { useState } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Lock,
  Archive,
  ArrowRight,
  X,
  Sparkles,
  ShieldAlert,
  History,
  Trash2
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const YearManagementModal = ({ isOpen, onClose }) => {
  const {
    zakatYears,
    financialYear,
    setFinancialYear,
    createZakatYear,
    deleteZakatYear,
    distributions,
    plannedAnnualBudget,
    setCustomAnnualBudget
  } = useZakat();

  const { currentUser } = useAuth();

  const [newYearInput, setNewYearInput] = useState(financialYear + 1);
  const [newYearNotes, setNewYearNotes] = useState('');
  const [targetBudgetInput, setTargetBudgetInput] = useState(plannedAnnualBudget || 4000000);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [yearToDelete, setYearToDelete] = useState(null);

  if (!isOpen) return null;

  const handleCreateYear = (e) => {
    e.preventDefault();
    if (!newYearInput) return;
    const success = createZakatYear(Number(newYearInput), newYearNotes, currentUser?.name || 'Admin');
    if (success) {
      if (Number(targetBudgetInput) > 0) {
        setCustomAnnualBudget(Number(targetBudgetInput));
      }
      setActiveTab('list');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Zakat Financial Year Management</h3>
              <p className="text-xs text-slate-500">Audit cycles, annual rollovers & planned budgets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            All Years ({zakatYears.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Assessment Year</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  Currently Viewing Assessment Year:{' '}
                  <strong className="text-blue-700 font-bold">{financialYear}</strong>
                </span>
                <span className="text-[11px] text-slate-500">
                  Target Pool: {formatINR(plannedAnnualBudget)}
                </span>
              </div>

              <div className="space-y-2.5">
                {zakatYears.map((yr) => {
                  const isCurrent = yr.year === financialYear;
                  return (
                    <div
                      key={yr.id || yr.year}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-blue-50/60 border-blue-200 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {yr.year}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">FY {yr.year}</span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                yr.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : yr.status === 'closed'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {yr.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {yr.notes || `Zakat Financial Assessment Cycle`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setFinancialYear(yr.year);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Switch To</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Year Button (Safe to Recycle Bin) */}
                        {zakatYears.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const yrTxns = distributions.filter(d => d.financialYear === yr.year);
                              const totalAmt = yrTxns.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);
                              setYearToDelete({
                                ...yr,
                                count: yrTxns.length,
                                amount: formatINR(totalAmt)
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title={`Delete Assessment Year ${yr.year}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Adjust Target Budget for active year */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Adjust Target Budget for FY {financialYear}
                </h4>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={targetBudgetInput}
                      onChange={(e) => setTargetBudgetInput(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (Number(targetBudgetInput) > 0) {
                        setCustomAnnualBudget(Number(targetBudgetInput));
                        alert(`Target budget for FY ${financialYear} updated to ${formatINR(targetBudgetInput)}`);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Safe Financial Rollover Architecture</span>
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  Creating a new year automatically carries forward the master directory of all 54+ verified
                  beneficiaries and organizations. Historical disbursements from prior years (2020–2026) are
                  strictly preserved and will never be overwritten.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Assessment Year
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  required
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Planned Target Zakat Pool (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    value={targetBudgetInput}
                    onChange={(e) => setTargetBudgetInput(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Default target pool for budgeting categories</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notes / Audit Cycle Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. FY 2027 Annual Ramadan Cycle"
                  value={newYearNotes}
                  onChange={(e) => setNewYearNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Year & Rollover</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal for Deleting Year */}
      <ConfirmDeleteModal
        isOpen={!!yearToDelete}
        title={`Delete Assessment Year ${yearToDelete?.year}`}
        subtitle="This assessment year and its transaction history will be safely moved to the Recycle Bin."
        warningDetails={
          yearToDelete
            ? { count: yearToDelete.count, amount: yearToDelete.amount }
            : null
        }
        confirmText="Move Year to Recycle Bin"
        onConfirm={() => {
          if (yearToDelete) {
            deleteZakatYear(yearToDelete.year, currentUser?.name || 'Admin');
            setYearToDelete(null);
          }
        }}
        onCancel={() => setYearToDelete(null)}
      />
    </div>
  );
};
