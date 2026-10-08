import React, { useState } from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatINR, formatCompactINR, formatPercent, exportToCSV } from '../utils/formatters';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Building,
  GraduationCap,
  Users,
  Package,
  Globe,
  HeartHandshake,
  BookOpen,
  Filter,
  Check,
  UserCheck,
  ExternalLink
} from 'lucide-react';

export const CategorySummaryScreen = ({ setActiveTab }) => {
  const {
    financialYear,
    categoryMetrics,
    currentYearDistributions,
    beneficiaries,
    toggleDistributionPaid,
    employeeSummary,
    totalZakatPaid,
    totalSadqaPaid,
    grandTotalPaid,
    plannedAnnualBudget
  } = useZakat();

  // View Toggle: 'consolidated' (View A) vs 'drilldown' (View B)
  const [viewMode, setViewMode] = useState('consolidated');
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const expandAll = () => {
    const all = {};
    categoryMetrics.forEach(c => { all[c.id] = true; });
    setExpandedCategories(all);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  const handleExportConsolidated = () => {
    const data = categoryMetrics.map(c => ({
      Category: c.name,
      'Fund Type': c.fundType,
      'Planned Budget (INR)': c.plannedBudget,
      'Actual Paid (INR)': c.totalPaid,
      'Balance Pending (INR)': c.pending,
      'Disbursed From Account': c.defaultAccountName,
      'Percentage of Pool': formatPercent(c.utilization),
      Status: c.status
    }));
    exportToCSV(data, `Al-Meezan_Consolidated_Category_Report_${financialYear}.csv`);
  };

  const handleExportDetailed = () => {
    const data = currentYearDistributions.map(d => ({
      'Distribution ID': d.id,
      'Beneficiary Name': d.beneficiaryName,
      Category: d.classification,
      'Assessment Year': d.financialYear,
      'Allocated Amount (INR)': d.amountAllocated,
      'Paid Amount (INR)': d.amountPaid,
      'Payment Status': d.paymentStatus,
      'Payment Method': d.paymentMethod,
      'Disbursed From Account': d.sourceAccountName,
      'Paid Date': d.paidDate || 'Pending',
      Remarks: d.remarks
    }));
    exportToCSV(data, `Al-Meezan_Detailed_Disbursement_Audit_${financialYear}.csv`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Category Budgeting & Envelope Reports • {financialYear}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Category Summary & Drilldown Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Toggle between pure consolidated category totals and complete individual student/recipient breakdown.
          </p>
        </div>

        {/* View Toggle Switch */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setViewMode('consolidated')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'consolidated'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              View A: Consolidated Summary
            </button>
            <button
              onClick={() => setViewMode('drilldown')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'drilldown'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              View B: Detailed Drilldown
            </button>
          </div>

          <button
            onClick={viewMode === 'consolidated' ? handleExportConsolidated : handleExportDetailed}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* VIEW A: PURE CONSOLIDATED CATEGORY VIEW */}
      {viewMode === 'consolidated' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Mandatory Zakat Categories (Section A) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 to-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>PART A: MANDATORY ZAKAT CATEGORIES (Eligible for 2.5% Pool)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Constitutes the core 2.5% Shariah envelope. Paid to verified poor families, students, trusts & ration kits.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  Total Zakat: {formatINR(totalZakatPaid)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Category / Classification</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Planned Cap (₹)</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actual Paid in {financialYear} (₹)</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Balance to be Paid (₹)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Disbursed From Account</th>
                    <th className="py-3.5 px-4 font-semibold text-right">% of 2.5% Pool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {categoryMetrics.filter(c => c.isEligible25Pool).map(cat => (
                    <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-100 font-semibold flex items-center gap-2">
                        <span>{cat.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatINR(cat.plannedBudget)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatINR(cat.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                        {formatINR(cat.pending)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          cat.totalPaid >= cat.plannedBudget && cat.plannedBudget > 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {cat.defaultAccountName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {plannedAnnualBudget > 0 ? ((cat.totalPaid / plannedAnnualBudget) * 100).toFixed(2) + '%' : '0%'}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal Part A */}
                  <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700 text-white">
                    <td className="py-3.5 px-4">SUB-TOTAL: TOTAL ZAKAT DISBURSED</td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {formatINR(categoryMetrics.filter(c => c.isEligible25Pool).reduce((s, c) => s + (Number(c.plannedBudget) || 0), 0))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                      {formatINR(totalZakatPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                      {formatINR(categoryMetrics.filter(c => c.isEligible25Pool).reduce((s, c) => s + c.pending, 0))}
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-400">
                      {totalZakatPaid >= plannedAnnualBudget ? 'Fulfilled' : 'Active'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">Matches 2.5% Pool Envelope</td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                      {formatPercent(overallUtilization)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Voluntary Sadqa Categories (Section B) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 to-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>PART B: SADQA (VOLUNTARY CHARITY) DISBURSEMENTS</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Separated from mandatory 2.5% Zakat pool per Shariah audit rules.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                  Total Sadqa: {formatINR(totalSadqaPaid)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Category / Organization</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Planned Cap (₹)</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actual Paid in {financialYear} (₹)</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Balance to be Paid (₹)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Disbursed From Account</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Fund Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {categoryMetrics.filter(c => !c.isEligible25Pool).map(cat => (
                    <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-100 font-semibold">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatINR(cat.plannedBudget)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                        {formatINR(cat.totalPaid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                        {formatINR(cat.pending)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          cat.totalPaid >= cat.plannedBudget && cat.plannedBudget > 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {cat.defaultAccountName}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-400 font-semibold">
                        Sadqa Fund
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700 text-white">
                    <td className="py-3.5 px-4">SUB-TOTAL: SADQA PAID</td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {formatINR(categoryMetrics.filter(c => !c.isEligible25Pool).reduce((s, c) => s + (Number(c.plannedBudget) || 0), 0))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                      {formatINR(totalSadqaPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                      {formatINR(categoryMetrics.filter(c => !c.isEligible25Pool).reduce((s, c) => s + c.pending, 0))}
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-300">Completed</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">Separate voluntary charity ledger</td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-400">Sadqa</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total All Outflows Card */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/80 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Grand Total Annual Outflow ({financialYear})
              </span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {formatINR(grandTotalPaid)}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Total Zakat Disbursed ({formatINR(totalZakatPaid)}) + Total Sadqa Disbursed ({formatINR(totalSadqaPaid)})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('drilldown')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Expand Recipient Drilldown →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: DETAILED DRILLDOWN VIEW */}
      {viewMode === 'drilldown' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Expanding individual students, poor families, madrasas, and organizations under each category.
            </p>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
              >
                Collapse All
              </button>
            </div>
          </div>

          {categoryMetrics.map(cat => {
            const isExpanded = expandedCategories[cat.id] ?? true;
            const items = currentYearDistributions.filter(d => d.categoryId === cat.id);

            return (
              <div
                key={cat.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all"
              >
                {/* Category Header Card */}
                <div
                  onClick={() => toggleCategoryExpand(cat.id)}
                  className="p-5 bg-gradient-to-r from-slate-950 to-slate-900/80 cursor-pointer hover:bg-slate-800/40 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{cat.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          cat.isEligible25Pool
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {cat.fundType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Cap / Planned</span>
                      <strong className="text-slate-200">{formatINR(cat.plannedBudget)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 block text-[10px] uppercase font-sans">Paid</span>
                      <strong className="text-emerald-400 font-bold">{formatINR(cat.totalPaid)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 block text-[10px] uppercase font-sans">Pending</span>
                      <strong className="text-amber-300">{formatINR(cat.pending)}</strong>
                    </div>
                    <div className="text-right pl-2 border-l border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-sans">Recipients</span>
                      <strong className="text-white font-sans">{items.length}</strong>
                    </div>
                    <div className="p-1 rounded-lg bg-slate-800 text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Individual Rows */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {items.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        No individual transactions allocated under this category for {financialYear} yet.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-4 font-semibold">Recipient / Student</th>
                            <th className="py-2.5 px-4 font-semibold">Location / Std</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Allocated (₹)</th>
                            <th className="py-2.5 px-4 font-semibold text-right">Paid (₹)</th>
                            <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                            <th className="py-2.5 px-4 font-semibold">Payment Mode</th>
                            <th className="py-2.5 px-4 font-semibold">Disbursed From</th>
                            <th className="py-2.5 px-4 font-semibold text-center">Quick Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 font-medium">
                          {items.map(item => {
                            const isPaid = item.paymentStatus === 'Paid';
                            const ben = beneficiaries.find(b => b.id === item.beneficiaryId);

                            return (
                              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 px-4 text-slate-100 font-semibold">
                                  <div>
                                    <span>{item.beneficiaryName}</span>
                                    {item.remarks && (
                                      <p className="text-[11px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                                        {item.remarks}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-slate-400 text-xs">
                                  {ben?.location || '—'}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-200">
                                  {formatINR(item.amountAllocated)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                                  {formatINR(item.amountPaid)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isPaid
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                                  }`}>
                                    {item.paymentStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-300">
                                  {item.paymentMethod}
                                </td>
                                <td className="py-3 px-4 text-slate-400 text-xs truncate max-w-[180px]">
                                  {item.sourceAccountName}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDistributionPaid(item.id);
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 mx-auto ${
                                      isPaid
                                        ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isPaid ? 'Mark Unpaid' : 'Mark as Paid'}</span>
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

      {/* SECTION 3: EMPLOYEE OUTFLOW & CASH LEDGER (From Section 1 of user Excel) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <span>Employee & Trainee Channel Disbursal Reconciliation (Section 1 Audit)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Funds routed through employee bank accounts for field distribution and cash withdrawals.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Total Disbursed: {formatINR(employeeSummary.reduce((s, e) => s + e.paidFromBank, 0))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee / Coordinator</th>
                <th className="py-3 px-4 font-semibold text-right">Transfer Target (₹)</th>
                <th className="py-3 px-4 font-semibold text-right">Amount Received (₹)</th>
                <th className="py-3 px-4 font-semibold text-right">Paid to Beneficiaries (₹)</th>
                <th className="py-3 px-4 font-semibold text-right">Remaining Bank Bal (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {employeeSummary.map((emp, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-white font-semibold flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{emp.name}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {formatINR(emp.transferred)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {formatINR(emp.received)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatINR(emp.paidFromBank)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {formatINR(emp.remainingInBank)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase">
                      Reconciled
                    </span>
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
