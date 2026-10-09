import React, { useState } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatCompactINR, formatPercent, exportToCSV } from '../utils/formatters';
import {
  Wallet,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Building,
  Calendar,
  Settings,
  CalendarDays,
  FileSpreadsheet,
  FilePlus2,
  Receipt,
  Users2,
  Settings2
} from 'lucide-react';

export const DashboardScreen = ({ setActiveTab, onOpenYearModal }) => {
  const {
    financialYear,
    totalZakatableAssets,
    calculated25Pool,
    plannedAnnualBudget,
    customAnnualBudget,
    setCustomAnnualBudget,
    totalZakatPlanned,
    totalZakatPaid,
    totalSadqaPaid,
    grandTotalPaid,
    totalPendingZakat,
    overallUtilization,
    isBudgetExceeded,
    isAllocationExceeded,
    categoryMetrics,
    currentYearDistributions,
    beneficiaries,
    toggleDistributionPaid,
    multiYearArchive
  } = useZakat();

  const { isAuditor, isReadOnly } = useAuth();

  const [viewMode, setViewMode] = useState('consolidated'); // 'consolidated' or 'drilldown'
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideInput, setOverrideInput] = useState(plannedAnnualBudget);

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const val = Number(overrideInput);
    if (!isNaN(val) && val > 0) {
      setCustomAnnualBudget(val);
      setShowOverrideModal(false);
    }
  };

  const handleResetToPool = () => {
    setCustomAnnualBudget(null);
    setShowOverrideModal(false);
  };

  const handleExportCSV = () => {
    const exportData = categoryMetrics.map(c => ({
      Category: c.name,
      'Fund Type': c.fundType,
      'Planned Budget (INR)': c.plannedBudget,
      'Paid to Date (INR)': c.totalPaid,
      'Pending Amount (INR)': c.pending,
      'Utilization %': c.utilization.toFixed(1) + '%',
      Status: c.status,
      'Default Account': c.defaultAccountName,
      'Recipient Count': c.recipientCount
    }));
    exportToCSV(exportData, `Zakat_Budget_Summary_${financialYear}.csv`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Financial Overview & Budget Envelopes
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time tracking of FY {financialYear} planned funds, actual paid amounts, and remaining balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenYearModal && (
            <button
              onClick={onOpenYearModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Years & Rollover</span>
            </button>
          )}
          {!isAuditor && !isReadOnly && (
            <button
              onClick={() => {
                setOverrideInput(plannedAnnualBudget);
                setShowOverrideModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-amber-600" />
              <span>Target Budget</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          {!isAuditor && !isReadOnly && (
            <button
              onClick={() => setActiveTab('entry-form')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Payout</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {isAllocationExceeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Notice: Total category allocations ({formatINR(totalZakatPlanned)}) exceed the Planned Annual Budget ({formatINR(plannedAnnualBudget)}).
          </span>
        </div>
      )}

      {isBudgetExceeded && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Attention: Total paid disbursements ({formatINR(totalZakatPaid)}) have exceeded the annual budget envelope.
          </span>
        </div>
      )}

      {/* TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Annual Budget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500">Annual Target Budget</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatINR(plannedAnnualBudget)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
              {customAnnualBudget ? 'Custom Cap' : '2.5% Pool'}
            </span>
            <span>•</span>
            <span>{formatCompactINR(plannedAnnualBudget)}</span>
          </div>
        </div>

        {/* KPI 2: Total Paid */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-emerald-700">Total Actually Paid</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {formatINR(totalZakatPaid)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <strong className="text-emerald-700 font-semibold">{formatPercent(overallUtilization)}</strong> utilized of budget
          </div>
        </div>

        {/* KPI 3: Total Pending */}
        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-amber-700">Pending Amount</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {formatINR(totalPendingZakat)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {totalPendingZakat === 0 ? '100% Target Completed' : 'Remaining balance to disburse'}
          </div>
        </div>

        {/* KPI 4: Beneficiaries & Payouts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500">Recipients & Allocations</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {beneficiaries.length} Recipients
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Total: <strong className="text-slate-800 font-semibold">{currentYearDistributions.length}</strong></span>
            <span>Paid: <strong className="text-emerald-700 font-semibold">{currentYearDistributions.filter(d => d.paymentStatus === 'Paid').length}</strong></span>
            <span>Pending: <strong className="text-amber-700 font-semibold">{currentYearDistributions.filter(d => d.paymentStatus !== 'Paid').length}</strong></span>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-center text-xs mb-2.5">
          <span className="font-bold text-slate-800">Annual Budget Pool Consumption</span>
          <span className="font-bold text-blue-700 font-mono text-sm">
            {formatINR(totalZakatPaid)} / {formatINR(plannedAnnualBudget)} ({formatPercent(overallUtilization)})
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(1, overallUtilization || 0))}%` }}
          />
        </div>
      </div>

      {/* CATEGORY TABLE WITH CONSOLIDATED / DRILLDOWN VIEW TOGGLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Category-Wise Budget Allocations</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of Planned, Paid, and Pending amounts per envelope.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewMode('consolidated')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'consolidated'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode('drilldown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'drilldown'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed Drilldown
            </button>
          </div>
        </div>

        {/* View A: Summary Table */}
        {viewMode === 'consolidated' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Fund Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Planned (₹)</th>
                  <th className="py-3 px-4 font-semibold text-right">Paid (₹)</th>
                  <th className="py-3 px-4 font-semibold text-right">Pending (₹)</th>
                  <th className="py-3 px-4 font-semibold w-32">Utilization</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Source Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {categoryMetrics.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-900 font-bold">{cat.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        cat.isEligible25Pool
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {cat.isEligible25Pool ? 'Zakat' : 'Sadqa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 font-semibold">
                      {formatINR(cat.plannedBudget)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatINR(cat.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700 font-semibold">
                      {formatINR(cat.pending)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(1, cat.utilization))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-600 w-8 text-right font-semibold">
                          {formatPercent(cat.utilization)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cat.totalPaid >= cat.plannedBudget && cat.plannedBudget > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs truncate max-w-xs">
                      {cat.defaultAccountName}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                  <td className="py-3.5 px-4" colSpan={2}>GRAND TOTAL DISBURSED</td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    {formatINR(categoryMetrics.reduce((s, c) => s + (Number(c.plannedBudget) || 0), 0))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-bold">
                    {formatINR(grandTotalPaid)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-700 font-bold">
                    {formatINR(categoryMetrics.reduce((s, c) => s + c.pending, 0))}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-right text-slate-600" colSpan={3}>
                    Zakat: {formatINR(totalZakatPaid)} | Sadqa: {formatINR(totalSadqaPaid)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* View B: Drilldown View */}
        {viewMode === 'drilldown' && (
          <div className="divide-y divide-slate-100">
            {categoryMetrics.map(cat => {
              const isExpanded = expandedCategories[cat.id] ?? true;
              const items = currentYearDistributions.filter(d => d.categoryId === cat.id);

              return (
                <div key={cat.id} className="p-4 space-y-3">
                  <div
                    onClick={() => toggleCategoryExpand(cat.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 p-2.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <strong className="text-slate-900 text-sm">{cat.name}</strong>
                      <span className="text-xs text-slate-500">({items.length} records)</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>Planned: <strong>{formatINR(cat.plannedBudget)}</strong></span>
                      <span className="text-emerald-700 font-bold">Paid: {formatINR(cat.totalPaid)}</span>
                      <span className="text-amber-700 font-bold">Pending: {formatINR(cat.pending)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="overflow-x-auto bg-slate-50 rounded-xl border border-slate-200">
                      {items.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">
                          No transactions recorded under this category yet.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="text-slate-600 uppercase text-[9px] border-b border-slate-200 bg-white">
                            <tr>
                              <th className="py-2.5 px-3">Beneficiary</th>
                              <th className="py-2.5 px-3 text-right">Allocated (₹)</th>
                              <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                              <th className="py-2.5 px-3">Method</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 font-medium">
                            {items.map(item => {
                              const isPaid = item.paymentStatus === 'Paid';
                              return (
                                <tr key={item.id} className="hover:bg-white/80">
                                  <td className="py-2.5 px-3 text-slate-900 font-semibold">
                                    {item.beneficiaryName}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                    {formatINR(item.amountAllocated)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                                    {formatINR(item.amountPaid)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {item.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600">{item.paymentMethod}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <button
                                      onClick={() => toggleDistributionPaid(item.id)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 mx-auto transition-colors ${
                                        isPaid
                                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                      }`}
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>{isPaid ? 'Unmark' : 'Mark Paid'}</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK WELFARE PROGRAM JUMP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('entry-form')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 group-hover:scale-105 transition-transform">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                New Payout
              </h4>
              <p className="text-[11px] text-slate-500">
                Record new disbursement
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">→</span>
        </div>

        <div
          onClick={() => setActiveTab('ledger')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Disbursement Ledger
              </h4>
              <p className="text-[11px] text-slate-500">
                1-click status & history
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">→</span>
        </div>

        <div
          onClick={() => setActiveTab('beneficiaries')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 group-hover:scale-105 transition-transform">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Beneficiary Directory
              </h4>
              <p className="text-[11px] text-slate-500">
                54+ recipient profiles
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">→</span>
        </div>

        <div
          onClick={() => setActiveTab('masters')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 group-hover:scale-105 transition-transform">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Master Settings
              </h4>
              <p className="text-[11px] text-slate-500">
                Categories & bank accounts
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600">→</span>
        </div>
      </div>

      {/* MULTI-YEAR HISTORICAL SUMMARY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Multi-Year Zakat & Sadqa History (2020 – 2026)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Historical archive preserved from original Excel workbook sheets.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Year</th>
                <th className="py-2.5 px-3 font-semibold text-right">Zakat (India)</th>
                <th className="py-2.5 px-3 font-semibold text-right">Zakat (Dubai)</th>
                <th className="py-2.5 px-3 font-semibold text-right font-bold text-blue-700">Total Zakat</th>
                <th className="py-2.5 px-3 font-semibold text-right">Sadqa</th>
                <th className="py-2.5 px-3 font-semibold text-right font-bold text-slate-900">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {multiYearArchive.map(row => (
                <tr key={row.year} className={`hover:bg-slate-50 ${row.year === financialYear ? 'bg-blue-50/50 font-bold' : ''}`}>
                  <td className="py-2.5 px-3 text-slate-900">
                    {row.year} {row.year === financialYear ? '★ (Active)' : ''}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatINR(row.zakatIndia)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{row.zakatDubai ? formatINR(row.zakatDubai) : '—'}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-bold">{formatINR(row.grandTotalZakat)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatINR(row.sadqaIndia + row.sadqaDubai)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-bold">{formatINR(row.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TARGET BUDGET CONFIGURATION MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Configure Annual Zakat Target</h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToPool}
                  className="text-slate-500 hover:text-slate-700 underline text-[11px]"
                >
                  Use Auto 2.5% Pool ({formatINR(calculated25Pool)})
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOverrideModal(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
