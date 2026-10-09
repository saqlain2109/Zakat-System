import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, exportToCSV, exportToExcel, printReport } from '../utils/formatters';
import {
  Receipt,
  Search,
  Download,
  Plus,
  Check,
  Trash2,
  Edit2,
  SlidersHorizontal,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  X,
  History,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  AlertCircle
} from 'lucide-react';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const DEFAULT_LEDGER_COLUMNS = [
  { id: 'id', label: 'Txn ID', visible: true, width: 'w-24' },
  { id: 'beneficiaryName', label: 'Beneficiary Name', visible: true, width: '' },
  { id: 'classification', label: 'Category', visible: true, width: '' },
  { id: 'financialYear', label: 'Year', visible: true, width: 'w-20' },
  { id: 'amountAllocated', label: 'Allocated (₹)', visible: true, width: 'text-right' },
  { id: 'amountPaid', label: 'Paid (₹)', visible: true, width: 'text-right' },
  { id: 'approvalStatus', label: 'CTO Authorization', visible: true, width: 'text-center' },
  { id: 'paymentStatus', label: 'Payment Status', visible: true, width: 'text-center' },
  { id: 'paymentMethod', label: 'Method', visible: true, width: '' },
  { id: 'sourceAccountName', label: 'Source Account', visible: false, width: '' },
  { id: 'paidDate', label: 'Payment Date', visible: false, width: '' },
  { id: 'remarks', label: 'Remarks / Notes', visible: true, width: '' },
  { id: 'actions', label: 'Quick Action', visible: true, width: 'text-center min-w-[170px]' }
];

export const DistributionLedgerScreen = ({ setActiveTab }) => {
  const {
    financialYear,
    distributions,
    toggleDistributionPaid,
    approveDistribution,
    rejectDistribution,
    deleteDistribution,
    updateDistribution,
    categories,
    fundingAccounts,
    zakatYears,
    pendingApprovalCount
  } = useZakat();

  const { currentUser, isCTO, isAdmin, isFinance, permissions } = useAuth();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState(financialYear);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');

  // Column Customizer State
  const [columns, setColumns] = useState(DEFAULT_LEDGER_COLUMNS);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);

  // Version History & Safe Delete State
  const [historyRecord, setHistoryRecord] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Check if any filter is active
  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedYear !== financialYear ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    approvalFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedYear(financialYear);
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setApprovalFilter('ALL');
  };

  // Filtered Ledger Rows
  const filteredLedger = useMemo(() => {
    return distributions.filter(item => {
      const matchesYear = selectedYear === 'ALL' || item.financialYear === Number(selectedYear);
      const matchesCat = categoryFilter === 'ALL' || item.classification === categoryFilter || item.categoryId === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || item.paymentStatus === statusFilter;
      const currentApproval = item.approvalStatus || 'Approved';
      const matchesApproval = approvalFilter === 'ALL' || currentApproval === approvalFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.beneficiaryName.toLowerCase().includes(q) ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        (item.sourceAccountName && item.sourceAccountName.toLowerCase().includes(q));

      return matchesYear && matchesCat && matchesStatus && matchesApproval && matchesSearch;
    });
  }, [distributions, selectedYear, categoryFilter, statusFilter, approvalFilter, searchQuery]);

  // Aggregate Totals
  const viewTotals = useMemo(() => {
    const totalAllocated = filteredLedger.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);
    const totalPaid = filteredLedger.reduce((sum, d) => sum + (Number(d.amountPaid) || 0), 0);
    const pending = totalAllocated - totalPaid;
    const paidCount = filteredLedger.filter(d => d.paymentStatus === 'Paid').length;
    return { totalAllocated, totalPaid, pending, paidCount };
  }, [filteredLedger]);

  // Multi-Format Export Helpers
  const getExportData = () => {
    return filteredLedger.map(d => ({
      'Transaction ID': d.id,
      'Beneficiary Name': d.beneficiaryName,
      Category: d.classification,
      'Assessment Year': d.financialYear,
      'Amount Allocated (INR)': d.amountAllocated,
      'Amount Paid (INR)': d.amountPaid,
      'CTO Authorization': d.approvalStatus || 'Approved',
      'Authorized By': d.approvedBy || (d.approvalStatus === 'Approved' ? 'Akbar Hussain (CTO)' : '—'),
      'Payment Status': d.paymentStatus,
      'Payment Method': d.paymentMethod,
      'Source Account': d.sourceAccountName,
      'Payment Date': d.paidDate || 'Pending',
      Remarks: d.remarks || ''
    }));
  };

  const handleExportCSV = () => {
    exportToCSV(getExportData(), `Zakat_Ledger_${selectedYear}.csv`);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    exportToExcel(getExportData(), `Zakat_Ledger_${selectedYear}.xls`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    setShowExportMenu(false);
    printReport(
      getExportData(),
      `Disbursement Ledger (FY ${selectedYear})`,
      `Assessment Cycle: FY ${selectedYear} • Filtered Records: ${filteredLedger.length} • Total Paid: ${formatINR(viewTotals.totalPaid)}`
    );
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    updateDistribution(editingItem);
    setEditingItem(null);
  };

  // Column reordering & visibility functions
  const toggleColumnVisibility = (colId) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, visible: !c.visible } : c));
  };

  const moveColumn = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const newCols = [...columns];
    const temp = newCols[index];
    newCols[index] = newCols[targetIndex];
    newCols[targetIndex] = temp;
    setColumns(newCols);
  };

  const resetColumns = () => {
    setColumns(DEFAULT_LEDGER_COLUMNS);
  };

  const visibleColumns = useMemo(() => {
    return columns.filter(c => c.visible);
  }, [columns]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>Disbursement Ledger</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Full audit log of individual disbursements with 1-click status updates and customizable columns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Customize Columns Button */}
          <button
            onClick={() => setShowColumnModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
            title="Show, hide or reorder columns"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Columns ({visibleColumns.length})</span>
          </button>

          {/* Multi-Format Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
              title="Download or print filtered records"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export ({filteredLedger.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-1.5 text-xs animate-fadeIn">
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel Sheet (.xls)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>CSV File (.csv)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
                >
                  <Printer className="w-4 h-4 text-purple-600" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('entry-form')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Payout</span>
          </button>
        </div>
      </div>

      {/* KPI Ticker Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Filtered Records</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {filteredLedger.length} <span className="text-xs font-normal text-slate-500">({viewTotals.paidCount} Paid)</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Allocated Total</span>
          <div className="text-xl font-bold text-slate-800 font-mono mt-1">
            {formatINR(viewTotals.totalAllocated)}
          </div>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Actually Paid</span>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {formatINR(viewTotals.totalPaid)}
          </div>
        </div>
        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block">Pending Balance</span>
          <div className="text-xl font-bold text-amber-700 font-mono mt-1">
            {formatINR(viewTotals.pending)}
          </div>
        </div>
      </div>

      {/* CTO PENDING APPROVAL QUEUE BANNER */}
      {pendingApprovalCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                {pendingApprovalCount} Disbursement Request{pendingApprovalCount > 1 ? 's' : ''} Awaiting CTO Authorization
              </h4>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Submitted by Finance team. Requires Akbar Hussain (CTO) review & approval before payments can be released.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setApprovalFilter('Pending Approval')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                approvalFilter === 'Pending Approval'
                  ? 'bg-amber-600 text-white shadow-amber-900/20'
                  : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              Filter Awaiting CTO ({pendingApprovalCount})
            </button>
            {approvalFilter === 'Pending Approval' && (
              <button
                onClick={() => setApprovalFilter('ALL')}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                View All
              </button>
            )}
          </div>
        </div>
      )}

      {/* FILTER CONTROLS & CLEAR FILTER BUTTON */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 shadow-xs items-center">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, remarks or source account..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Year Filter (Dynamic) */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Assessment Years</option>
          {Array.from(new Set([
            ...((zakatYears || []).map(y => y.year)),
            ...(distributions.map(d => d.financialYear)),
            Number(financialYear)
          ])).filter(Boolean).sort((a, b) => b - a).map(y => (
            <option key={y} value={y}>FY {y} {y === Number(financialYear) ? '(Active)' : ''}</option>
          ))}
        </select>

        {/* Category Filter (Dynamic) */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* CTO Authorization Filter */}
        <select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className={`bg-slate-50 border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none ${
            approvalFilter === 'Pending Approval'
              ? 'border-amber-400 text-amber-800 bg-amber-50/60'
              : 'border-slate-300 text-slate-800'
          }`}
        >
          <option value="ALL">All Approvals</option>
          <option value="Approved">✓ Authorized</option>
          <option value="Pending Approval">⏳ Awaiting CTO ({pendingApprovalCount})</option>
          <option value="Rejected">✕ Declined</option>
        </select>

        {/* Status Filter & Clear Button */}
        <div className="flex items-center gap-1.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Not Paid">Not Paid</option>
          </select>

          {isFilterActive && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs"
              title="Clear all active filters"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* LEDGER TABLE WITH CUSTOMIZABLE COLUMNS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                {visibleColumns.map(col => (
                  <th key={col.id} className={`py-3 px-3.5 font-semibold ${col.width}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-slate-400 text-xs">
                    No transactions matching active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map(item => {
                  const isPaid = item.paymentStatus === 'Paid';
                  const currentApp = item.approvalStatus || 'Approved';
                  const isApproved = currentApp === 'Approved';
                  const isPending = currentApp === 'Pending Approval';
                  const isRejected = currentApp === 'Rejected';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {visibleColumns.map(col => {
                        if (col.id === 'id') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 font-mono text-slate-400 font-bold">
                              {item.id}
                            </td>
                          );
                        }
                        if (col.id === 'beneficiaryName') {
                          return (
                            <td key={col.id} className="py-3 px-3.5">
                              <span className="font-bold text-slate-900 block">{item.beneficiaryName}</span>
                              <span className="text-[11px] text-slate-400 font-mono">[{item.beneficiaryId}]</span>
                            </td>
                          );
                        }
                        if (col.id === 'classification') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 font-medium text-slate-800">
                              {item.classification}
                            </td>
                          );
                        }
                        if (col.id === 'financialYear') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 font-mono font-bold text-slate-700">
                              FY {item.financialYear}
                            </td>
                          );
                        }
                        if (col.id === 'amountAllocated') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                              {formatINR(item.amountAllocated)}
                            </td>
                          );
                        }
                        if (col.id === 'amountPaid') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                              {formatINR(item.amountPaid)}
                            </td>
                          );
                        }
                        if (col.id === 'approvalStatus') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-center">
                              <div className="flex flex-col items-center gap-0.5">
                                {isApproved && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Authorized</span>
                                  </span>
                                )}
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Awaiting CTO</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={item.rejectionReason || 'Declined'}>
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    <span>Declined</span>
                                  </span>
                                )}
                                {item.approvedBy && (
                                  <span className="text-[9px] text-slate-400 font-mono" title={`Authorized by ${item.approvedBy}`}>
                                    {item.approvedBy.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        }
                        if (col.id === 'paymentStatus') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {item.paymentStatus}
                              </span>
                            </td>
                          );
                        }
                        if (col.id === 'paymentMethod') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-slate-600">
                              {item.paymentMethod}
                            </td>
                          );
                        }
                        if (col.id === 'sourceAccountName') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-slate-700">
                              {item.sourceAccountName || '—'}
                            </td>
                          );
                        }
                        if (col.id === 'paidDate') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 font-mono text-slate-600">
                              {item.paidDate || <span className="text-slate-400 italic">Pending</span>}
                            </td>
                          );
                        }
                        if (col.id === 'remarks') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-slate-500 max-w-xs truncate" title={item.remarks}>
                              {item.remarks || '—'}
                            </td>
                          );
                        }
                        if (col.id === 'actions') {
                          return (
                            <td key={col.id} className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* CTO / Admin Direct Authorization for Pending Requests */}
                                {isPending && permissions.canApprovePayouts ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => approveDistribution(item.id, currentUser?.name, currentUser?.role)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 shadow-2xs"
                                      title="Authorize this disbursement request as CTO"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Authorize</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = window.prompt(`Reason for declining payout for ${item.beneficiaryName}:`, 'Requires trustee revision');
                                        if (reason) {
                                          rejectDistribution(item.id, reason, currentUser?.name, currentUser?.role);
                                        }
                                      }}
                                      className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                      title="Decline this payout request"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : isPending && isFinance ? (
                                  /* Finance user cannot pay until authorized by CTO */
                                  <button
                                    disabled
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed flex items-center gap-1 shadow-2xs"
                                    title="Awaiting CTO (Akbar Hussain) authorization before payment can be executed"
                                  >
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>CTO Pending</span>
                                  </button>
                                ) : isRejected ? (
                                  permissions.canApprovePayouts ? (
                                    <button
                                      onClick={() => approveDistribution(item.id, currentUser?.name, currentUser?.role)}
                                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                                      title="Re-authorize declined request"
                                    >
                                      Re-Authorize
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-rose-500 font-semibold italic">Declined</span>
                                  )
                                ) : (
                                  /* Approved payouts - 1-Click Pay/Unmark */
                                  <button
                                    onClick={() => toggleDistributionPaid(item.id, currentUser?.name, currentUser?.role)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs ${
                                      isPaid
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                                    title={isPaid ? "Mark as Not Paid" : "Mark as Paid"}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isPaid ? 'Unmark' : 'Mark Paid'}</span>
                                  </button>
                                )}

                                {/* Audit Log / Version History */}
                                <button
                                  onClick={() => setHistoryRecord({ id: item.id, title: `${item.beneficiaryName} (${item.classification})` })}
                                  className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
                                  title="View Version History & Audit Log"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => setEditingItem({ ...item })}
                                  className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                                  title="Edit Transaction"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setItemToDelete(item)}
                                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                  title="Move to Recycle Bin"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          );
                        }
                        return null;
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CUSTOMIZE & REORDER COLUMNS */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Customize Table Columns & Alignment</span>
              </h3>
              <button onClick={() => setShowColumnModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-[11px] text-slate-500">
              Toggle checkboxes to show or hide columns, or use <strong>▲ / ▼</strong> buttons to rearrange their display order:
            </p>

            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {columns.map((col, index) => (
                <div
                  key={col.id}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-colors ${
                    col.visible ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-60'
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => toggleColumnVisibility(col.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>{col.label}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                      className="p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-slate-600"
                      title="Move Up (Appear Earlier)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === columns.length - 1}
                      onClick={() => moveColumn(index, 1)}
                      className="p-1 rounded bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 text-slate-600"
                      title="Move Down (Appear Later)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={resetColumns}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold"
              >
                Reset to Default
              </button>
              <button
                type="button"
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
              >
                Apply Columns
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TRANSACTION */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Edit Transaction ({editingItem.id})</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recipient Name</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.beneficiaryName}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Allocated (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingItem.amountAllocated}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingItem({
                        ...editingItem,
                        amountAllocated: val,
                        amountPaid: editingItem.paymentStatus === 'Paid' ? val : editingItem.amountPaid
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
                  <select
                    value={editingItem.paymentStatus}
                    onChange={(e) => {
                      const st = e.target.value;
                      setEditingItem({
                        ...editingItem,
                        paymentStatus: st,
                        amountPaid: st === 'Paid' ? editingItem.amountAllocated : 0,
                        paidDate: st === 'Paid' ? (editingItem.paidDate || new Date().toISOString().split('T')[0]) : null
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Not Paid">Not Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={editingItem.paymentMethod}
                    onChange={(e) => setEditingItem({ ...editingItem, paymentMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online / Bank Transfer">Online / Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Direct to School / Madrasa">Direct to School / Madrasa</option>
                    <option value="Bank Transfer from gulf">Bank Transfer from gulf</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Source Account</label>
                  <select
                    value={editingItem.sourceAccountName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, sourceAccountName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    {fundingAccounts.map(acc => (
                      <option key={acc.id} value={acc.name}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
                <input
                  type="date"
                  value={editingItem.paidDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, paidDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks / Voucher Reference</label>
                <input
                  type="text"
                  value={editingItem.remarks || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                  placeholder="Receipt or notes"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {historyRecord && (
        <VersionHistoryModal
          recordId={historyRecord.id}
          recordTitle={historyRecord.title}
          onClose={() => setHistoryRecord(null)}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <ConfirmDeleteModal
          isOpen={!!itemToDelete}
          title={`Delete Payment for ${itemToDelete.beneficiaryName}`}
          subtitle={`This transaction of ${formatINR(itemToDelete.amountAllocated)} will be moved to the Recycle Bin.`}
          warningDetails={{ count: 1, amount: formatINR(itemToDelete.amountAllocated) }}
          confirmText="Move to Recycle Bin"
          onConfirm={() => {
            deleteDistribution(itemToDelete.id);
            setItemToDelete(null);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
};
