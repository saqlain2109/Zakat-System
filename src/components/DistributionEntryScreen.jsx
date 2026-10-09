import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import {
  FilePlus2,
  Search,
  User,
  ShieldCheck,
  AlertTriangle,
  History,
  Calendar,
  Wallet,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  Info,
  ChevronDown,
  GraduationCap,
  Building2,
  Check,
  X
} from 'lucide-react';

export const DistributionEntryScreen = ({ setActiveTab }) => {
  const {
    financialYear,
    beneficiaries,
    fundingAccounts,
    distributions,
    zakatYears,
    categories,
    addDistribution
  } = useZakat();

  const { currentUser, isFinance, isCTO, isAdmin } = useAuth();

  // Selected beneficiary & search state (defaults to blank so user explicitly selects)
  const [selectedBenId, setSelectedBenId] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');
  const comboboxRef = useRef(null);

  // Form Fields
  const [entryYear, setEntryYear] = useState(financialYear);
  const [amountAllocated, setAmountAllocated] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Not Paid'); // PRD Default: "Not Paid"
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [sourceAccountId, setSourceAccountId] = useState(fundingAccounts[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setIsComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected Beneficiary Data (null when blank)
  const selectedBeneficiary = useMemo(() => {
    if (!selectedBenId) return null;
    return beneficiaries.find(b => b.id === selectedBenId) || null;
  }, [beneficiaries, selectedBenId]);

  // Check if this beneficiary has an existing disbursement in the selected entryYear
  const existingYearDistribution = useMemo(() => {
    if (!selectedBeneficiary) return null;
    return distributions.find(d =>
      d.beneficiaryId === selectedBeneficiary.id &&
      Number(d.financialYear) === Number(entryYear)
    );
  }, [distributions, selectedBeneficiary, entryYear]);

  const isAlreadyPaidInYear = existingYearDistribution?.paymentStatus === 'Paid';

  // Dynamic assessment years
  const availableYears = useMemo(() => {
    const list = Array.from(new Set([
      ...((zakatYears || []).map(y => y.year)),
      ...(distributions.map(d => d.financialYear)),
      Number(financialYear)
    ])).filter(Boolean).sort((a, b) => b - a);
    return list;
  }, [zakatYears, distributions, financialYear]);

  // Filtered beneficiaries for search dropdown
  const filteredBeneficiaries = useMemo(() => {
    if (!comboboxSearch.trim()) return beneficiaries;
    const q = comboboxSearch.toLowerCase().trim();
    return beneficiaries.filter(b =>
      b.fullName.toLowerCase().includes(q) ||
      (b.classification && b.classification.toLowerCase().includes(q)) ||
      (b.subCategory && b.subCategory.toLowerCase().includes(q)) ||
      (b.location && b.location.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q))
    );
  }, [beneficiaries, comboboxSearch]);

  // Selected Account
  const selectedAccount = useMemo(() => {
    return fundingAccounts.find(a => a.id === sourceAccountId) || fundingAccounts[0];
  }, [fundingAccounts, sourceAccountId]);

  // Is this recipient a student / school fees case?
  const isSchoolFeeCase = useMemo(() => {
    if (!selectedBeneficiary) return false;
    const catName = (selectedBeneficiary.classification || '').toLowerCase();
    const catId = (selectedBeneficiary.categoryId || '').toLowerCase();
    return catName.includes('school') || catName.includes('education') || catId === 'cat-07';
  }, [selectedBeneficiary]);

  // Save handler - Direct payout
  const handleSave = (instantPaid = false) => {
    if (!selectedBeneficiary) {
      alert('Please select a recipient from the beneficiary directory first.');
      return;
    }

    const numAmount = Number(amountAllocated);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount (e.g. ₹ 10,000)');
      return;
    }

    // Finance users cannot mark as Paid directly; only CTO/Admin can authorize payout
    const finalStatus = (isFinance ? false : instantPaid) ? 'Paid' : 'Not Paid';
    const newEntry = {
      beneficiaryId: selectedBeneficiary.id,
      beneficiaryName: selectedBeneficiary.fullName,
      classification: selectedBeneficiary.classification,
      categoryId: selectedBeneficiary.categoryId || 'CAT-05',
      financialYear: Number(entryYear),
      amountAllocated: numAmount,
      amountPaid: finalStatus === 'Paid' ? numAmount : 0,
      paymentStatus: finalStatus,
      paymentMethod,
      sourceAccountId: selectedAccount.id,
      sourceAccountName: selectedAccount.name,
      paidDate: finalStatus === 'Paid' ? paymentDate : null,
      remarks: remarks.trim() || `FY ${entryYear} allocation`,
      auditNotes: selectedBeneficiary.auditNotes
    };

    addDistribution(newEntry, currentUser?.name || 'Admin', currentUser?.role || 'admin');

    // Reset form fields
    setSelectedBenId('');
    setAmountAllocated('');
    setRemarks('');
    setPaymentStatus('Not Paid');

    // Immediately redirect to the distribution ledger list screen as requested
    if (setActiveTab) {
      setActiveTab('ledger');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Record New Disbursement
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Select a recipient from the master directory, review past disbursements, and record current year allocation.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button
            onClick={() => setActiveTab('ledger')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline ml-2"
          >
            View in Ledger →
          </button>
        </div>
      )}

      {/* STEP 1: BENEFICIARY SELECTION & PROFILE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Step 1: Select Beneficiary Profile
          </span>
          <span className="text-xs text-slate-500">
            Total Available in Directory: <strong>{beneficiaries.length}</strong>
          </span>
        </div>

        {/* Integrated Searchable Combobox */}
        <div className="relative" ref={comboboxRef}>
          <label className="block text-slate-700 font-semibold text-xs mb-1">
            Choose Recipient (Click or Type to Search) *
          </label>
          <div
            onClick={() => setIsComboboxOpen(!isComboboxOpen)}
            className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium cursor-pointer flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <User className={`w-4 h-4 shrink-0 ${selectedBeneficiary ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className={`font-bold truncate ${selectedBeneficiary ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
                {selectedBeneficiary ? selectedBeneficiary.fullName : '-- Select Recipient Profile (Search by Name or Category) --'}
              </span>
              {selectedBeneficiary && (
                <span className="text-slate-400 text-xs hidden sm:inline">
                  • {selectedBeneficiary.classification}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedBeneficiary ? (
                isAlreadyPaidInYear ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ PAID IN FY {entryYear}
                  </span>
                ) : existingYearDistribution ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ⏳ PENDING IN FY {entryYear}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100">
                    No allocation yet in FY {entryYear}
                  </span>
                )
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100">
                  Click to select
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Search Dropdown Modal Popup */}
          {isComboboxOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-300 rounded-2xl shadow-xl p-3 space-y-2 animate-fadeIn max-h-96 flex flex-col">
              {/* Search input inside dropdown */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={comboboxSearch}
                  onChange={(e) => setComboboxSearch(e.target.value)}
                  placeholder="Type name, category, colony, phone..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {comboboxSearch && (
                  <button
                    onClick={() => setComboboxSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable Items List */}
              <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1">
                {filteredBeneficiaries.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No recipients matching "{comboboxSearch}"
                  </div>
                ) : (
                  filteredBeneficiaries.map(b => {
                    const yearRec = distributions.find(d =>
                      d.beneficiaryId === b.id &&
                      Number(d.financialYear) === Number(entryYear)
                    );
                    const isPaid = yearRec?.paymentStatus === 'Paid';
                    const isPending = yearRec && !isPaid;
                    const isSelected = b.id === selectedBenId;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setSelectedBenId(b.id);
                          setIsComboboxOpen(false);
                          setComboboxSearch('');
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {b.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">[{b.id}]</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {b.classification} {b.location ? `• ${b.location}` : ''}
                          </div>
                        </div>

                        {/* Live Year Status Tag */}
                        <div className="shrink-0 text-right">
                          {isPaid ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ Paid: {formatINR(yearRec.amountPaid)}
                            </span>
                          ) : isPending ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ⏳ Pending: {formatINR(yearRec.amountAllocated)}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100">
                              Not allocated yet
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROMINENT DUPLICATE / ALREADY PAID WARNING ALERT */}
        {isAlreadyPaidInYear && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 space-y-1.5 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Notice: Payment Already Completed for FY {entryYear}!</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              <strong>{selectedBeneficiary.fullName}</strong> has already received payment of{' '}
              <strong className="text-amber-950 font-bold font-mono">
                {formatINR(existingYearDistribution.amountPaid || existingYearDistribution.amountAllocated)}
              </strong>{' '}
              for FY {entryYear} on {existingYearDistribution.paidDate || 'recorded date'} via{' '}
              <strong>{existingYearDistribution.paymentMethod}</strong> from{' '}
              <strong>{existingYearDistribution.sourceAccountName}</strong>.
            </p>
            <p className="text-[11px] text-amber-700 italic pt-0.5">
              Submitting this form will record an additional secondary disbursement for this recipient in FY {entryYear}.
            </p>
          </div>
        )}

        {/* Selected Profile Details Card or Blank Prompt */}
        {selectedBeneficiary ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{selectedBeneficiary.fullName}</span>
                  <span className="text-xs text-slate-500 font-mono font-normal">[{selectedBeneficiary.id}]</span>
                </h3>
                <span className="text-xs text-blue-700 font-semibold">
                  {selectedBeneficiary.classification} • {selectedBeneficiary.subCategory}
                </span>
              </div>
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedBeneficiary.verificationStatus || 'Verified'}
                </span>
              </div>
            </div>

            {/* If Student / Minor Details */}
            {isSchoolFeeCase && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-blue-900">
                <div>
                  <span className="text-blue-700 block text-[11px] font-semibold">Standard / Class:</span>
                  <strong className="text-blue-950">{selectedBeneficiary.standard || 'Primary / Secondary'}</strong>
                </div>
                <div>
                  <span className="text-blue-700 block text-[11px] font-semibold">Parent / Guardian:</span>
                  <strong className="text-blue-950">{selectedBeneficiary.guardianName || 'Father / Mother'}</strong>
                </div>
                <div>
                  <span className="text-blue-700 block text-[11px] font-semibold">School / Institute:</span>
                  <strong className="text-blue-950">{selectedBeneficiary.schoolName || 'Enrolled School'}</strong>
                </div>
              </div>
            )}

            {/* Profile Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Field Coordinator:</span>
                <strong className="text-slate-800">{selectedBeneficiary.referencePerson}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location:</span>
                <strong className="text-slate-800 truncate block" title={selectedBeneficiary.location}>
                  {selectedBeneficiary.location || '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Phone:</span>
                <strong className="text-slate-800 font-mono">{selectedBeneficiary.phone || 'No phone'}</strong>
              </div>
            </div>

            {selectedBeneficiary.auditNotes && (
              <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 italic">
                "{selectedBeneficiary.auditNotes}"
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-5 text-center text-slate-400 text-xs">
            <User className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <span className="font-semibold text-slate-600">No Recipient Selected</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Please choose a recipient from the directory search box above to view profile details and grant history.
            </p>
          </div>
        )}
      </div>

      {/* STEP 2: COMPLETE MULTI-YEAR HISTORY LOOKUP */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Step 2: Complete Multi-Year Payout History (Automatic Audit Lookup)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Live record for FY {entryYear} + Archived cycles
          </span>
        </div>

        {!selectedBeneficiary ? (
          <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Please choose a recipient in Step 1 to inspect their past payout records across all financial years.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Financial Year</th>
                <th className="py-2.5 px-3 text-right">Disbursed (₹)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Payment Channel / Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {(() => {
                // Collect all relevant years starting from current entryYear
                const historyYears = Array.from(new Set([
                  Number(entryYear),
                  2025,
                  2024,
                  2023,
                  2022,
                  ...Object.keys(selectedBeneficiary?.history || {}).map(Number)
                ])).sort((a, b) => b - a);

                return historyYears.map(yr => {
                  const isCurrentCycle = yr === Number(entryYear);
                  // Look for live record in active distributions first
                  const liveDist = distributions.find(d =>
                    d.beneficiaryId === selectedBeneficiary?.id &&
                    Number(d.financialYear) === yr
                  );

                  let amt = 0;
                  let status = 'Nil';
                  let details = 'Not enrolled in program';

                  if (liveDist) {
                    amt = liveDist.paymentStatus === 'Paid'
                      ? (Number(liveDist.amountPaid) || Number(liveDist.amountAllocated) || 0)
                      : (Number(liveDist.amountAllocated) || 0);
                    status = liveDist.paymentStatus === 'Paid' ? 'Disbursed' : 'Pending';
                    const dateStr = liveDist.paidDate ? ` on ${liveDist.paidDate}` : '';
                    const methodStr = liveDist.paymentMethod ? ` via ${liveDist.paymentMethod}` : '';
                    const accStr = liveDist.sourceAccountName ? ` (${liveDist.sourceAccountName})` : '';
                    details = liveDist.paymentStatus === 'Paid'
                      ? `Paid${dateStr}${methodStr}${accStr} • ${liveDist.remarks || 'Assistance Released'}`
                      : `Pending allocation of ${formatINR(amt)} • ${liveDist.remarks || 'Awaiting payout'}`;
                  } else if (selectedBeneficiary?.history?.[yr] !== undefined) {
                    amt = Number(selectedBeneficiary.history[yr]) || 0;
                    if (amt > 0) {
                      status = 'Disbursed';
                      details = 'Assistance Released (Archived)';
                    } else {
                      status = isCurrentCycle ? 'Not Allocated' : 'Nil';
                      details = isCurrentCycle ? 'No payout recorded yet for this year' : 'Not enrolled in program';
                    }
                  } else {
                    status = isCurrentCycle ? 'Not Allocated' : 'Nil';
                    details = isCurrentCycle ? 'No payout recorded yet for this year' : 'Not enrolled in program';
                  }

                  return (
                    <tr
                      key={yr}
                      className={isCurrentCycle ? 'bg-blue-50/40 hover:bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/60'}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">FY {yr}</span>
                          {isCurrentCycle && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                              Current Cycle
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {amt > 0 ? (
                          <span className={status === 'Disbursed' ? 'text-emerald-700' : 'text-amber-700'}>
                            {formatINR(amt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹ 0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {status === 'Disbursed' ? (
                          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                            <span>✓</span>
                            <span>Disbursed</span>
                          </span>
                        ) : status === 'Pending' ? (
                          <span className="text-amber-800 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⏳ Pending
                          </span>
                        ) : isCurrentCycle ? (
                          <span className="text-blue-700 font-medium text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Not Yet Disbursed
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Nil</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {details}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* STEP 3: FINANCIAL DETAILS & ONE-CLICK DISBURSEMENT */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block border-b border-slate-200 pb-2">
          Step 3: Allocate Funds & Payout Channel
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Assessment Year (Dynamic) */}
          <div>
            <label className="block text-slate-700 font-semibold text-xs mb-1">Assessment Year *</label>
            <select
              value={entryYear}
              onChange={(e) => setEntryYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>FY {y} {y === Number(financialYear) ? '(Active)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Amount to Disburse */}
          <div>
            <label className="block text-slate-700 font-semibold text-xs mb-1">Amount to Allocate (₹) *</label>
            <input
              type="number"
              required
              value={amountAllocated}
              onChange={(e) => setAmountAllocated(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Default Payment Status */}
          <div>
            <label className="block text-slate-700 font-semibold text-xs mb-1">
              {isFinance ? 'Authorization Workflow' : 'Default Payment Status'}
            </label>
            {isFinance ? (
              <div className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Awaiting CTO (Akbar Hussain) Authorization</span>
              </div>
            ) : (
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Not Paid">Not Paid (Red / Pending)</option>
                <option value="Paid">Paid (Immediate Release)</option>
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Payment Method */}
          <div>
            <label className="block text-slate-700 font-semibold text-xs mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Online / Bank Transfer">Online / Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Direct to School / Madrasa">Direct to School / Madrasa</option>
              <option value="Bank Transfer from gulf">Bank Transfer from gulf</option>
            </select>
          </div>

          {/* Source Funding Account */}
          <div>
            <label className="block text-slate-700 font-semibold text-xs mb-1">Source Account</label>
            <select
              value={sourceAccountId}
              onChange={(e) => setSourceAccountId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fundingAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-slate-700 font-semibold text-xs mb-1">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Remarks / Notes */}
        <div>
          <label className="block text-slate-700 font-semibold text-xs mb-1">
            Payment Remarks / Voucher Reference
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={isSchoolFeeCase ? "e.g. 5th Std Annual Fee receipt #4892 deposited" : "e.g. Cash handed over via Akbar Sir"}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {isFinance ? (
              <span className="text-amber-800 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Finance Policy: Payout will be queued for CTO (Akbar Hussain) authorization before payment release.</span>
              </span>
            ) : (
              <span>Default creates a <strong>[Not Paid]</strong> entry. Clicking <strong>Mark as Paid</strong> immediately releases funds.</span>
            )}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isFinance ? (
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Submit for CTO Authorization</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save as Not Paid
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Paid Immediately</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
