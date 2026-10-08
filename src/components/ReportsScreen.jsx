import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatINR, formatCompactINR, formatPercent, exportToCSV, exportToExcel, printReport } from '../utils/formatters';
import {
  BarChart3,
  Layers,
  Calendar,
  Building,
  GraduationCap,
  Download,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Filter,
  FileSpreadsheet,
  RotateCcw,
  Printer,
  ChevronDown
} from 'lucide-react';

export const ReportsScreen = ({ setActiveTab }) => {
  const {
    financialYear,
    categories,
    distributions,
    beneficiaries,
    fundingAccounts,
    multiYearArchive,
    zakatYears
  } = useZakat();

  // Active Report Tab
  const [activeReportTab, setActiveReportTab] = useState('category'); // 'category', 'multi-year', 'accounts', 'school'

  // Filters
  const [selectedYear, setSelectedYear] = useState(financialYear);
  const [fundTypeFilter, setFundTypeFilter] = useState('ALL');
  const [drilldownCategory, setDrilldownCategory] = useState(null); // Category object or null
  const [drilldownSearch, setDrilldownSearch] = useState('');

  // Dynamic available years
  const availableYears = useMemo(() => {
    return Array.from(new Set([
      ...((zakatYears || []).map(y => y.year)),
      ...(distributions.map(d => d.financialYear)),
      Number(financialYear)
    ])).filter(Boolean).sort((a, b) => b - a);
  }, [zakatYears, distributions, financialYear]);

  // Distributions for selected assessment year
  const yearDistributions = useMemo(() => {
    return distributions.filter(d =>
      selectedYear === 'ALL' || d.financialYear === Number(selectedYear)
    );
  }, [distributions, selectedYear]);

  // 1. CATEGORY REPORT AGGREGATES
  const categoryReportData = useMemo(() => {
    return categories
      .filter(cat => {
        if (fundTypeFilter === 'ZAKAT') return cat.isEligible25Pool;
        if (fundTypeFilter === 'SADQA') return !cat.isEligible25Pool;
        return true;
      })
      .map(cat => {
        const catDistributions = yearDistributions.filter(d =>
          d.categoryId === cat.id || d.classification === cat.name
        );
        const totalAllocated = catDistributions.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);
        const totalPaid = catDistributions.reduce((sum, d) => sum + (Number(d.amountPaid) || 0), 0);
        const planned = Number(cat.plannedBudget) || 0;
        const pending = Math.max(0, planned - totalPaid);
        const utilization = planned > 0 ? (totalPaid / planned) * 100 : 0;
        const paidCount = catDistributions.filter(d => d.paymentStatus === 'Paid').length;
        const pendingCount = catDistributions.filter(d => d.paymentStatus !== 'Paid').length;

        return {
          ...cat,
          totalAllocated,
          totalPaid,
          pending,
          utilization,
          recipientCount: catDistributions.length,
          paidCount,
          pendingCount
        };
      });
  }, [categories, yearDistributions, fundTypeFilter]);

  // Totals for Category Report
  const categoryReportTotals = useMemo(() => {
    const planned = categoryReportData.reduce((sum, c) => sum + (Number(c.plannedBudget) || 0), 0);
    const paid = categoryReportData.reduce((sum, c) => sum + (Number(c.totalPaid) || 0), 0);
    const pending = Math.max(0, planned - paid);
    const count = categoryReportData.reduce((sum, c) => sum + c.recipientCount, 0);
    const utilization = planned > 0 ? (paid / planned) * 100 : 0;
    return { planned, paid, pending, count, utilization };
  }, [categoryReportData]);

  // DRILLDOWN RECIPIENTS for selected category
  const drilldownRecipients = useMemo(() => {
    if (!drilldownCategory) return [];
    return yearDistributions
      .filter(d => d.categoryId === drilldownCategory.id || d.classification === drilldownCategory.name)
      .map(d => {
        const ben = beneficiaries.find(b => b.id === d.beneficiaryId);
        return {
          ...d,
          standard: ben?.standard || '',
          guardianName: ben?.guardianName || '',
          schoolName: ben?.schoolName || '',
          phone: ben?.phone || '',
          location: ben?.location || ''
        };
      })
      .filter(d => {
        if (!drilldownSearch.trim()) return true;
        const q = drilldownSearch.toLowerCase();
        return (
          d.beneficiaryName.toLowerCase().includes(q) ||
          (d.remarks && d.remarks.toLowerCase().includes(q)) ||
          (d.schoolName && d.schoolName.toLowerCase().includes(q)) ||
          (d.guardianName && d.guardianName.toLowerCase().includes(q))
        );
      });
  }, [drilldownCategory, yearDistributions, beneficiaries, drilldownSearch]);

  // 2. SCHOOL & EDUCATION REPORT AGGREGATES
  const schoolReportData = useMemo(() => {
    const schoolDistributions = yearDistributions.filter(d => {
      const name = (d.classification || '').toLowerCase();
      return name.includes('school') || name.includes('education') || d.categoryId === 'CAT-07';
    });

    // Group by school name or institution
    const schoolMap = {};
    schoolDistributions.forEach(d => {
      const ben = beneficiaries.find(b => b.id === d.beneficiaryId);
      const schoolKey = ben?.schoolName || (d.remarks && d.remarks.includes('School') ? d.remarks.split(' ')[0] : 'General School Assistance');

      if (!schoolMap[schoolKey]) {
        schoolMap[schoolKey] = {
          schoolName: schoolKey,
          students: [],
          totalAllocated: 0,
          totalPaid: 0,
          paidCount: 0,
          pendingCount: 0
        };
      }
      schoolMap[schoolKey].students.push({ ...d, ben });
      schoolMap[schoolKey].totalAllocated += Number(d.amountAllocated) || 0;
      schoolMap[schoolKey].totalPaid += Number(d.amountPaid) || 0;
      if (d.paymentStatus === 'Paid') schoolMap[schoolKey].paidCount++;
      else schoolMap[schoolKey].pendingCount++;
    });

    return Object.values(schoolMap);
  }, [yearDistributions, beneficiaries]);

  // 3. BANK ACCOUNT OUTFLOW REPORT
  const accountReportData = useMemo(() => {
    return fundingAccounts.map(acc => {
      const accDistributions = yearDistributions.filter(d =>
        d.sourceAccountId === acc.id || d.sourceAccountName === acc.name
      );
      const totalPaid = accDistributions
        .filter(d => d.paymentStatus === 'Paid')
        .reduce((sum, d) => sum + (Number(d.amountPaid) || 0), 0);
      const totalPending = accDistributions
        .filter(d => d.paymentStatus !== 'Paid')
        .reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);

      return {
        ...acc,
        totalPaid,
        totalPending,
        txnCount: accDistributions.length
      };
    });
  }, [fundingAccounts, yearDistributions]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDrilldownExportMenu, setShowDrilldownExportMenu] = useState(false);

  // Clean Structured Data Extractors for Export & Print
  const getCategoryExportData = () => {
    return categoryReportData.map(c => ({
      Category: c.name,
      'Fund Type': c.fundType,
      'Planned Budget (INR)': c.plannedBudget,
      'Total Paid (INR)': c.totalPaid,
      'Pending Balance (INR)': c.pending,
      'Utilization (%)': c.utilization.toFixed(1) + '%',
      'Recipients Count': c.recipientCount,
      'Paid Count': c.paidCount
    }));
  };

  const getDrilldownExportData = () => {
    if (!drilldownCategory) return [];
    return drilldownRecipients.map(d => ({
      ID: d.id,
      Recipient: d.beneficiaryName,
      Category: drilldownCategory.name,
      'Standard / Class': d.standard || '—',
      'Parent / Guardian': d.guardianName || '—',
      'School / Institute': d.schoolName || '—',
      'Amount Allocated (INR)': d.amountAllocated,
      'Amount Paid (INR)': d.amountPaid,
      Status: d.paymentStatus,
      'Payment Method': d.paymentMethod,
      'Source Account': d.sourceAccountName,
      'Payment Date': d.paidDate || 'Pending',
      Remarks: d.remarks || ''
    }));
  };

  const getSchoolExportData = () => {
    return schoolReportData.map(s => ({
      'School / Institute': s.schoolName,
      'Sponsored Students': s.students.length,
      'Total Allocated (INR)': s.totalAllocated,
      'Total Paid (INR)': s.totalPaid,
      'Pending (INR)': s.totalAllocated - s.totalPaid,
      'Paid Count': s.paidCount,
      'Pending Count': s.pendingCount
    }));
  };

  const getMultiYearExportData = () => {
    return (multiYearArchive || []).map(m => ({
      Year: `FY ${m.year}`,
      'India Zakat': m.zakatIndia,
      'Gulf / Dubai Zakat': m.zakatDubai,
      'Total Zakat': m.grandTotalZakat,
      'Sadqa Welfare': m.sadqaIndia,
      'Grand Total Outflow': m.grandTotal
    }));
  };

  // Multi-Format Export Handlers
  const exportCategorySummaryCSV = () => {
    exportToCSV(getCategoryExportData(), `Zakat_Category_Report_FY${selectedYear}.csv`);
  };

  const exportCategorySummaryExcel = () => {
    exportToExcel(getCategoryExportData(), `Zakat_Category_Report_FY${selectedYear}.xls`);
  };

  const exportCategorySummaryPrint = () => {
    printReport(
      getCategoryExportData(),
      `Audited Category Budget & Outflow Report (FY ${selectedYear})`,
      `Assessment Cycle: FY ${selectedYear} • Fund Filter: ${fundTypeFilter} • Total Records: ${categoryReportData.length}`
    );
  };

  const exportDrilldownCSV = () => {
    if (!drilldownCategory) return;
    exportToCSV(getDrilldownExportData(), `Drilldown_${drilldownCategory.name}_FY${selectedYear}.csv`);
  };

  const exportDrilldownExcel = () => {
    if (!drilldownCategory) return;
    exportToExcel(getDrilldownExportData(), `Drilldown_${drilldownCategory.name}_FY${selectedYear}.xls`);
  };

  const exportDrilldownPrint = () => {
    if (!drilldownCategory) return;
    printReport(
      getDrilldownExportData(),
      `Beneficiary Drilldown: ${drilldownCategory.name} (FY ${selectedYear})`,
      `Cap: ₹${Number(drilldownCategory.plannedBudget).toLocaleString('en-IN')} • Disbursed: ₹${Number(drilldownCategory.totalPaid).toLocaleString('en-IN')} • Recipients: ${drilldownRecipients.length}`
    );
  };

  const exportMultiYearCSV = () => {
    exportToCSV(getMultiYearExportData(), 'Multi_Year_Historical_Report_2020_2026.csv');
  };

  const exportMultiYearExcel = () => {
    exportToExcel(getMultiYearExportData(), 'Multi_Year_Historical_Report_2020_2026.xls');
  };

  const exportMultiYearPrint = () => {
    printReport(
      getMultiYearExportData(),
      'Multi-Year Historical Outflow Summary (2020 - 2026)',
      'Consolidated All-India & Dubai Zakat and Sadqa Disbursements'
    );
  };

  const exportSchoolReportCSV = () => {
    exportToCSV(getSchoolExportData(), `School_Education_Report_FY${selectedYear}.csv`);
  };

  const exportSchoolReportExcel = () => {
    exportToExcel(getSchoolExportData(), `School_Education_Report_FY${selectedYear}.xls`);
  };

  const exportSchoolReportPrint = () => {
    printReport(
      getSchoolExportData(),
      `School & Education Grants Summary (FY ${selectedYear})`,
      `Sponsored Institutions: ${schoolReportData.length} • Cycle: FY ${selectedYear}`
    );
  };

  const handleExportFormat = (format) => {
    setShowExportMenu(false);
    if (activeReportTab === 'category') {
      if (format === 'excel') exportCategorySummaryExcel();
      else if (format === 'csv') exportCategorySummaryCSV();
      else exportCategorySummaryPrint();
    } else if (activeReportTab === 'school') {
      if (format === 'excel') exportSchoolReportExcel();
      else if (format === 'csv') exportSchoolReportCSV();
      else exportSchoolReportPrint();
    } else if (activeReportTab === 'multi-year') {
      if (format === 'excel') exportMultiYearExcel();
      else if (format === 'csv') exportMultiYearCSV();
      else exportMultiYearPrint();
    } else {
      if (format === 'excel') exportCategorySummaryExcel();
      else if (format === 'csv') exportCategorySummaryCSV();
      else exportCategorySummaryPrint();
    }
  };

  const resetFilters = () => {
    setSelectedYear(financialYear);
    setFundTypeFilter('ALL');
    setDrilldownCategory(null);
    setDrilldownSearch('');
  };

  const hasActiveFilters = selectedYear !== financialYear || fundTypeFilter !== 'ALL' || drilldownSearch !== '';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Audited Financial Reports & Analytics</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Category envelopes, interactive student/ration drilldowns, multi-year trends, and bank reconciliation.
          </p>
        </div>

        {/* Global Report Filter, Export & Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none"
          >
            <option value="ALL">All Financial Years</option>
            {availableYears.map(y => (
              <option key={y} value={y}>FY {y} {y === Number(financialYear) ? '(Active)' : ''}</option>
            ))}
          </select>

          {/* Multi-Format Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
              title="Export report in Excel, CSV or PDF"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Report</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1.5 text-xs animate-fadeIn">
                <button
                  onClick={() => handleExportFormat('excel')}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel Spreadsheet (.xls)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('csv')}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>CSV File (.csv)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('print')}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
                >
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
              title="Clear all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'category', label: 'Category & Drilldown Report', icon: Layers },
          { id: 'school', label: 'School & Education Grants', icon: GraduationCap },
          { id: 'multi-year', label: 'Multi-Year Archive (2020-2026)', icon: Calendar },
          { id: 'accounts', label: 'Bank & Funding Outflows', icon: Building },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveReportTab(tab.id);
                setDrilldownCategory(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATEGORY REPORT & DRILLDOWN */}
      {activeReportTab === 'category' && (
        <div className="space-y-4 animate-fadeIn">
          {/* If NOT in drilldown view: Show Category Master Summary */}
          {!drilldownCategory ? (
            <>
              {/* Category Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Fund Filter:</span>
                  {['ALL', 'ZAKAT', 'SADQA'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFundTypeFilter(type)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        fundTypeFilter === type
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'ALL' ? 'All Funds' : type === 'ZAKAT' ? 'Zakat (2.5%)' : 'Sadqa / Nafila'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={exportCategorySummaryCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export Category Report</span>
                </button>
              </div>

              {/* KPI Header Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Planned Budget</span>
                  <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                    {formatINR(categoryReportTotals.planned)}
                  </div>
                </div>
                <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Total Actually Paid</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
                    {formatINR(categoryReportTotals.paid)}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {formatPercent(categoryReportTotals.utilization)} utilized
                  </span>
                </div>
                <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-amber-700 block">Remaining Pending</span>
                  <div className="text-xl font-bold text-amber-700 mt-1 font-mono">
                    {formatINR(categoryReportTotals.pending)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 block">Active Disbursements</span>
                  <div className="text-xl font-bold text-slate-800 mt-1">
                    {categoryReportTotals.count} Recipients
                  </div>
                </div>
              </div>

              {/* Category Summary Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 font-semibold">Category Name</th>
                      <th className="py-3 px-3.5 font-semibold">Fund Type</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Planned Cap (₹)</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Paid Amount (₹)</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Pending (₹)</th>
                      <th className="py-3 px-3.5 font-semibold text-center">Utilization</th>
                      <th className="py-3 px-3.5 font-semibold text-center">Recipients</th>
                      <th className="py-3 px-3.5 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {categoryReportData.map(cat => (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900 block">{cat.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">[{cat.id}]</span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            cat.isEligible25Pool
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {cat.fundType}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                          {formatINR(cat.plannedBudget)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                          {formatINR(cat.totalPaid)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-700">
                          {formatINR(cat.pending)}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-bold text-slate-800">
                              {formatPercent(cat.utilization)}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, cat.utilization))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="font-bold text-slate-800">{cat.recipientCount}</span>
                          <span className="text-[10px] text-slate-400 block">({cat.paidCount} Paid)</span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => setDrilldownCategory(cat)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-2xs"
                          >
                            <span>Drilldown</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* DRILLDOWN VIEW: Detailed Recipient Table for Chosen Category */
            <div className="space-y-4 animate-fadeIn">
              {/* Drilldown Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDrilldownCategory(null)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Back to Category Overview"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{drilldownCategory.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                        {drilldownCategory.id}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Planned Cap: <strong>{formatINR(drilldownCategory.plannedBudget)}</strong> • Disbursed: <strong className="text-emerald-700">{formatINR(drilldownCategory.totalPaid)}</strong> • Remaining: <strong className="text-amber-700">{formatINR(drilldownCategory.pending)}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={drilldownSearch}
                      onChange={(e) => setDrilldownSearch(e.target.value)}
                      placeholder="Search recipient or school..."
                      className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowDrilldownExportMenu(!showDrilldownExportMenu)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Export ({drilldownRecipients.length})</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showDrilldownExportMenu && (
                      <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1.5 text-xs animate-fadeIn">
                        <button
                          onClick={() => {
                            setShowDrilldownExportMenu(false);
                            exportDrilldownExcel();
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Excel Sheet (.xls)</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDrilldownExportMenu(false);
                            exportDrilldownCSV();
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                        >
                          <Download className="w-4 h-4 text-blue-600" />
                          <span>CSV File (.csv)</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDrilldownExportMenu(false);
                            exportDrilldownPrint();
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
                        >
                          <Printer className="w-4 h-4 text-purple-600" />
                          <span>Print / Save PDF</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drilldown Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 font-semibold w-16">Txn</th>
                      <th className="py-3 px-3.5 font-semibold">Beneficiary Name</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Allocated (₹)</th>
                      <th className="py-3 px-3.5 font-semibold text-right">Paid (₹)</th>
                      <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                      <th className="py-3 px-3.5 font-semibold">Payment Channel & Account</th>
                      <th className="py-3 px-3.5 font-semibold">Date</th>
                      <th className="py-3 px-3.5 font-semibold">Notes / Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {drilldownRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                          No recipient records found under {drilldownCategory.name} for FY {selectedYear}.
                        </td>
                      </tr>
                    ) : (
                      drilldownRecipients.map(row => {
                        const isPaid = row.paymentStatus === 'Paid';
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{row.id}</td>
                            <td className="py-3 px-3.5">
                              <span className="font-bold text-slate-900 block">{row.beneficiaryName}</span>
                              {(row.standard || row.guardianName || row.schoolName) && (
                                <div className="text-[11px] text-blue-700 flex flex-wrap gap-1.5 mt-0.5">
                                  {row.standard && <span className="bg-blue-50 px-1 rounded font-semibold">{row.standard}</span>}
                                  {row.guardianName && <span>Parent: {row.guardianName}</span>}
                                  {row.schoolName && <span className="text-slate-500">({row.schoolName})</span>}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                              {formatINR(row.amountAllocated)}
                            </td>
                            <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                              {formatINR(row.amountPaid)}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {row.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="block text-slate-900 font-medium">{row.paymentMethod}</span>
                              <span className="text-[11px] text-slate-400">{row.sourceAccountName}</span>
                            </td>
                            <td className="py-3 px-3.5 font-mono text-slate-600">
                              {row.paidDate || <span className="text-slate-400 italic">Pending</span>}
                            </td>
                            <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate">
                              {row.remarks || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHOOL & EDUCATION GRANTS REPORT */}
      {activeReportTab === 'school' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-600 font-medium">
              School fee grants grouped by Educational Institution for FY {selectedYear}
            </span>
            <button
              onClick={exportSchoolReportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export School Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolReportData.map((sch, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{sch.schoolName}</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {sch.students.length} Sponsored Students
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sch.paidCount} Paid
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Fees</span>
                    <strong className="text-slate-900 font-bold">{formatINR(sch.totalAllocated)}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Disbursed</span>
                    <strong className="text-emerald-700 font-bold">{formatINR(sch.totalPaid)}</strong>
                  </div>
                </div>

                {/* Enrolled Students Quick List */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Students:</span>
                  <div className="max-h-28 overflow-y-auto divide-y divide-slate-100">
                    {sch.students.map((st, sIdx) => (
                      <div key={sIdx} className="py-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-800 font-medium truncate pr-2">{st.beneficiaryName}</span>
                        <span className="font-mono text-slate-600 shrink-0">{formatINR(st.amountAllocated)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-YEAR HISTORICAL COMPARISON */}
      {activeReportTab === 'multi-year' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-600 font-medium">
              Year-over-Year audited comparison from 2020 to 2026 (From Official Audit Master Sheet)
            </span>
            <button
              onClick={exportMultiYearCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Multi-Year CSV</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">Assessment Year</th>
                  <th className="py-3 px-3.5 font-semibold text-right">India Zakat (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Gulf / Dubai Zakat (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Total Zakat (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Sadqa Welfare (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Grand Total Outflow (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(multiYearArchive || []).map(m => (
                  <tr key={m.year} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900 font-mono">
                      FY {m.year} {m.year === 2026 ? <span className="text-blue-600 font-sans text-[10px]">(Current)</span> : ''}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                      {formatINR(m.zakatIndia)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-slate-700">
                      {formatINR(m.zakatDubai)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">
                      {formatINR(m.grandTotalZakat)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-700">
                      {formatINR(m.sadqaIndia)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                      {formatINR(m.grandTotal)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.year === 2026 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.year === 2026 ? 'In Progress' : 'Closed & Audited'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BANK ACCOUNT OUTFLOWS */}
      {activeReportTab === 'accounts' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-semibold w-16">Code</th>
                  <th className="py-3 px-3.5 font-semibold">Account Display Name</th>
                  <th className="py-3 px-3.5 font-semibold">Managed By / Holder</th>
                  <th className="py-3 px-3.5 font-semibold">Bank Name</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Paid Out in FY (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Current Balance (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Active Txns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {accountReportData.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{acc.id}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-3.5 text-slate-700">{acc.accountHolder}</td>
                    <td className="py-3 px-3.5 text-slate-500">{acc.bankName}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatINR(acc.totalPaid)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      {formatINR(acc.balance)}
                    </td>
                    <td className="py-3 px-3.5 text-center font-bold text-slate-800">
                      {acc.txnCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
