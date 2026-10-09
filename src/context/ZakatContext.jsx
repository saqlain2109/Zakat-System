import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  INITIAL_ASSETS,
  INITIAL_CATEGORIES,
  INITIAL_FUNDING_ACCOUNTS,
  INITIAL_REFERENCE_PERSONS,
  INITIAL_VERIFICATION_STATUSES,
  INITIAL_BENEFICIARIES,
  INITIAL_DISTRIBUTIONS_2026,
  MULTI_YEAR_ARCHIVE,
  EMPLOYEE_ACCOUNTS_SUMMARY,
  AURANGABAD_RATION_BENEFICIARIES
} from '../data/seedData';
import { triggerPaidConfetti } from '../utils/formatters';
import { findPotentialDuplicates } from '../utils/duplicateDetector';
import { api } from '../services/api';

const ZakatContext = createContext(null);
const STORAGE_KEY = 'al_meezan_zakat_system_v2';

export const ZakatProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Zakat Years Model
  const [zakatYears, setZakatYears] = useState([
    { id: 'yr-2026', year: 2026, status: 'active', startDate: '2026-01-01', endDate: '2026-12-31', notes: 'Active Assessment Year' },
    { id: 'yr-2025', year: 2025, status: 'closed', startDate: '2025-01-01', endDate: '2025-12-31', notes: 'Audited & Closed' },
    { id: 'yr-2024', year: 2024, status: 'closed', startDate: '2024-01-01', endDate: '2024-12-31', notes: 'Historical Archive' },
    { id: 'yr-2023', year: 2023, status: 'archived', startDate: '2023-01-01', endDate: '2023-12-31', notes: 'Historical Archive' },
    { id: 'yr-2022', year: 2022, status: 'archived', startDate: '2022-01-01', endDate: '2022-12-31', notes: 'Historical Archive' },
  ]);

  const [financialYear, setFinancialYear] = useState(2026);
  const [customAnnualBudget, setCustomAnnualBudget] = useState(null);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [fundingAccounts, setFundingAccounts] = useState(INITIAL_FUNDING_ACCOUNTS);
  const [referencePersons, setReferencePersons] = useState(INITIAL_REFERENCE_PERSONS);
  const [beneficiaries, setBeneficiaries] = useState(INITIAL_BENEFICIARIES);
  const [distributions, setDistributions] = useState(INITIAL_DISTRIBUTIONS_2026);

  // Dedicated Ration Program State
  const [rationDistributions, setRationDistributions] = useState(() => {
    return AURANGABAD_RATION_BENEFICIARIES.map((item, idx) => ({
      id: `RAT-${idx + 1}`,
      year: 2026,
      name: item.name,
      phone: item.phone,
      colony: item.occupation.includes('Colony') ? item.occupation : 'Kat Kat Gate / Hilal Colony',
      occupation: item.occupation,
      coordinator: item.coordinator,
      kitQuantity: 1,
      unitCost: item.kitAmount || 4076,
      totalAmount: item.kitAmount || 4076,
      status: 'distributed',
      distributionDate: '2026-02-14',
      notes: 'Ramzan food grains pack handed over'
    }));
  });

  // Dedicated Education Assistance State
  const [educationRecords, setEducationRecords] = useState(() => {
    return INITIAL_BENEFICIARIES
      .filter(b => b.classification === 'School fees')
      .map((b, idx) => ({
        id: `EDU-${idx + 1}`,
        beneficiaryId: b.id,
        year: 2026,
        studentName: b.fullName,
        schoolName: b.subCategory || 'Municipal English School',
        standard: b.location || 'Class 5',
        academicYear: '2025-2026',
        totalAnnualFees: (b.history?.[2026] || 15000) * 1.1,
        approvedAmount: b.history?.[2026] || 15000,
        paidAmount: b.history?.[2026] || 15000,
        status: (b.history?.[2026] || 0) > 0 ? 'paid_full' : 'pending_receipt',
        receiptNo: `REC-2026-${String(idx + 101)}`,
        guardianName: 'Family Guardian',
        referenceName: b.referencePerson,
        notes: b.auditNotes
      }));
  });

  // Audit Logs & Version History
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'LOG-001',
      userName: 'Akbar Sir',
      actionType: 'SYSTEM_INIT',
      entityName: 'system',
      recordId: 'INIT-2026',
      description: 'System seeded from Zakat File 2026 workbook with 54 core beneficiaries.',
      changedFields: [],
      timestamp: new Date().toISOString()
    }
  ]);

  // Recycle Bin (30-day recovery window)
  const [recycleBin, setRecycleBin] = useState([]);

  // Load from Backend API with LocalStorage Cache Fallback
  useEffect(() => {
    // 1. Initial fast load from localStorage cache
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.assets) setAssets(parsed.assets);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.fundingAccounts) setFundingAccounts(parsed.fundingAccounts);
        if (parsed.referencePersons) setReferencePersons(parsed.referencePersons);
        if (parsed.beneficiaries) setBeneficiaries(parsed.beneficiaries);
        if (parsed.distributions) setDistributions(parsed.distributions);
        if (parsed.zakatYears) setZakatYears(parsed.zakatYears);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.recycleBin) setRecycleBin(parsed.recycleBin);
        if (parsed.customAnnualBudget !== undefined) setCustomAnnualBudget(parsed.customAnnualBudget);
      }
    } catch (e) {
      console.warn('Local cache read note:', e.message);
    }
    setIsLoaded(true);

    // 2. Fetch authoritative state from Full-Stack Backend API
    api.getInitialState()
      .then(res => {
        if (res && res.success && res.data) {
          const d = res.data;
          if (d.assets) setAssets(d.assets);
          if (d.categories) setCategories(d.categories);
          if (d.fundingAccounts) setFundingAccounts(d.fundingAccounts);
          if (d.referencePersons) setReferencePersons(d.referencePersons);
          if (d.beneficiaries) setBeneficiaries(d.beneficiaries);
          if (d.distributions) setDistributions(d.distributions);
          if (d.zakatYears) setZakatYears(d.zakatYears);
          if (d.auditLogs) setAuditLogs(d.auditLogs);
          if (d.recycleBin) setRecycleBin(d.recycleBin);
          if (d.customAnnualBudget !== undefined) setCustomAnnualBudget(d.customAnnualBudget);
          console.log('[Zakat System] Full-Stack Backend Connected & Live');
        }
      })
      .catch(err => {
        console.info('[Zakat System] Running in local/offline fallback mode:', err.message);
      });
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const payload = {
        assets,
        categories,
        fundingAccounts,
        referencePersons,
        beneficiaries,
        distributions,
        zakatYears,
        rationDistributions,
        educationRecords,
        auditLogs,
        recycleBin,
        customAnnualBudget
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save to local state', e);
    }
  }, [assets, categories, fundingAccounts, referencePersons, beneficiaries, distributions, zakatYears, rationDistributions, educationRecords, auditLogs, recycleBin, customAnnualBudget, isLoaded]);

  // Helper: Log Activity & Version History with Deduplication Guard
  const logActivity = (actionType, entityName, recordId, description, oldValue = null, newValue = null, userName = 'Admin', changedFields = []) => {
    setAuditLogs(prev => {
      // Deduplicate rapid successive calls (e.g. React StrictMode or double clicks)
      if (prev && prev.length > 0) {
        const last = prev[0];
        const isSameTarget = last.actionType === actionType && String(last.recordId) === String(recordId);
        const timeDiff = Math.abs(Date.now() - new Date(last.timestamp).getTime());
        if (isSameTarget && timeDiff < 2500) {
          return prev; // Ignore duplicate
        }
      }

      const entry = {
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName,
        actionType,
        entityName,
        recordId: String(recordId),
        description,
        oldValue,
        newValue,
        changedFields,
        timestamp: new Date().toISOString()
      };
      return [entry, ...prev];
    });
  };

  // Handle Custom Annual Budget with Backend API Sync
  const handleSetCustomAnnualBudget = (val) => {
    setCustomAnnualBudget(val);
    api.setCustomBudget(val).catch(err => {
      console.warn('[API Sync] setCustomBudget note:', err.message);
    });
  };

  // Reset to Pristine Data
  const resetToDefaultData = () => {
    if (window.confirm('Reset all modifications to pristine Excel seed data?')) {
      setAssets(INITIAL_ASSETS);
      setCategories(INITIAL_CATEGORIES);
      setFundingAccounts(INITIAL_FUNDING_ACCOUNTS);
      setReferencePersons(INITIAL_REFERENCE_PERSONS);
      setBeneficiaries(INITIAL_BENEFICIARIES);
      setDistributions(INITIAL_DISTRIBUTIONS_2026);
      setCustomAnnualBudget(null);
      localStorage.removeItem(STORAGE_KEY);
      logActivity('SYSTEM_RESET', 'system', 'RESET', 'Restored pristine seed data');
      api.resetSystem().catch(err => console.warn('[API Sync] resetSystem note:', err.message));
      triggerPaidConfetti();
    }
  };

  // --- ASSET POOL & 2.5% CALCULATIONS ---
  const totalZakatableAssets = useMemo(() => {
    return assets.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [assets]);

  const calculated25Pool = useMemo(() => {
    return Math.round(totalZakatableAssets * 0.025);
  }, [totalZakatableAssets]);

  const plannedAnnualBudget = customAnnualBudget !== null ? customAnnualBudget : calculated25Pool;

  // Current Year Distributions
  const currentYearDistributions = useMemo(() => {
    return distributions.filter(d => d.financialYear === Number(financialYear));
  }, [distributions, financialYear]);

  // Category Metrics
  const categoryMetrics = useMemo(() => {
    return categories.map(cat => {
      const catDistributions = currentYearDistributions.filter(d => d.categoryId === cat.id);
      const totalAllocated = catDistributions.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);
      const totalPaid = catDistributions.reduce((sum, d) => sum + (Number(d.amountPaid) || 0), 0);
      const planned = Number(cat.plannedBudget) || 0;
      const pending = Math.max(0, planned - totalPaid);
      const utilization = planned > 0 ? (totalPaid / planned) * 100 : 0;

      let status = 'On Track';
      if (totalPaid >= planned && planned > 0) {
        status = totalPaid > planned ? 'Exceeded' : 'Exhausted';
      }

      return {
        ...cat,
        totalAllocated,
        totalPaid,
        pending,
        utilization,
        status,
        recipientCount: catDistributions.length,
        paidCount: catDistributions.filter(d => d.paymentStatus === 'Paid').length
      };
    });
  }, [categories, currentYearDistributions]);

  // Top KPIs
  const totalZakatPaid = useMemo(() => {
    return categoryMetrics
      .filter(c => c.isEligible25Pool)
      .reduce((sum, c) => sum + c.totalPaid, 0);
  }, [categoryMetrics]);

  const totalSadqaPaid = useMemo(() => {
    return categoryMetrics
      .filter(c => !c.isEligible25Pool)
      .reduce((sum, c) => sum + c.totalPaid, 0);
  }, [categoryMetrics]);

  const grandTotalPaid = totalZakatPaid + totalSadqaPaid;

  const totalZakatPlanned = useMemo(() => {
    return categories
      .filter(c => c.isEligible25Pool)
      .reduce((sum, c) => sum + (Number(c.plannedBudget) || 0), 0);
  }, [categories]);

  const totalPendingZakat = Math.max(0, plannedAnnualBudget - totalZakatPaid);
  const overallUtilization = plannedAnnualBudget > 0 ? (totalZakatPaid / plannedAnnualBudget) * 100 : 0;
  const isBudgetExceeded = totalZakatPaid > plannedAnnualBudget;
  const isAllocationExceeded = totalZakatPlanned > plannedAnnualBudget;

  // Pending Approvals Count for CTO Authorization queue
  const pendingApprovalCount = useMemo(() => {
    return distributions.filter(d => d.approvalStatus === 'Pending Approval').length;
  }, [distributions]);

  // --- ACTIONS ---

  // 1-Click "Mark as Paid" / "Mark as Not Paid"
  const toggleDistributionPaid = (distributionId, userName = 'Admin', userRole = 'admin') => {
    const item = distributions.find(d => d.id === distributionId);
    if (!item) return;

    const isCurrentlyPaid = item.paymentStatus === 'Paid';
    const newStatus = isCurrentlyPaid ? 'Not Paid' : 'Paid';

    // Block finance user from marking an unapproved payout as Paid
    if (!isCurrentlyPaid && item.approvalStatus && item.approvalStatus !== 'Approved') {
      if (userRole === 'finance') {
        alert('This disbursement requires authorization from CTO (Akbar Hussain) before payment can be marked as Paid.');
        return false;
      }
    }

    const newAmt = isCurrentlyPaid ? 0 : item.amountAllocated;
    const newDate = isCurrentlyPaid ? null : new Date().toISOString().split('T')[0];

    const changedFields = [
      { field: 'Payment Status', from: item.paymentStatus, to: newStatus },
      { field: 'Amount Paid', from: `₹${(item.amountPaid || 0).toLocaleString('en-IN')}`, to: `₹${newAmt.toLocaleString('en-IN')}` },
      { field: 'Payment Date', from: item.paidDate || 'None', to: newDate || 'Pending' }
    ];

    setDistributions(prev => prev.map(d => {
      if (d.id === distributionId) {
        return {
          ...d,
          paymentStatus: newStatus,
          amountPaid: newAmt,
          paidDate: newDate
        };
      }
      return d;
    }));

    logActivity(
      'PAYMENT_STATUS_CHANGE',
      'disbursements',
      distributionId,
      `Status changed for ${item.beneficiaryName}: ${item.paymentStatus} → ${newStatus} (₹${newAmt.toLocaleString('en-IN')})`,
      { status: item.paymentStatus, amountPaid: item.amountPaid },
      { status: newStatus, amountPaid: newAmt },
      userName,
      changedFields
    );

    // Sync with Full-Stack Backend
    api.toggleDistributionPaid(distributionId, { userName, userRole }).catch(err => {
      console.warn('[API Sync] toggleDistributionPaid note:', err.message);
    });

    if (!isCurrentlyPaid) {
      triggerPaidConfetti();
    }
    return true;
  };

  // CTO / Admin: Authorize payout request
  const approveDistribution = (distributionId, userName = 'Akbar Hussain (CTO)', userRole = 'cto') => {
    const item = distributions.find(d => d.id === distributionId);
    if (!item) return false;

    const approverName = userName || (userRole === 'cto' ? 'Akbar Hussain (CTO)' : 'Admin');
    const updated = {
      ...item,
      approvalStatus: 'Approved',
      approvedBy: approverName,
      approvedAt: new Date().toISOString()
    };

    setDistributions(prev => prev.map(d => d.id === distributionId ? updated : d));

    logActivity(
      'APPROVE_PAYOUT',
      'disbursements',
      distributionId,
      `CTO Authorized payout of ₹${(Number(item.amountAllocated) || 0).toLocaleString('en-IN')} for ${item.beneficiaryName}`,
      { approvalStatus: item.approvalStatus || 'Pending Approval' },
      { approvalStatus: 'Approved', approvedBy: approverName },
      approverName,
      [{ field: 'Approval Status', from: item.approvalStatus || 'Pending Approval', to: 'Approved' }]
    );

    api.approveDistribution(distributionId, { userName: approverName, userRole }).catch(err => {
      console.warn('[API Sync] approveDistribution note:', err.message);
    });

    triggerPaidConfetti();
    return true;
  };

  // CTO / Admin: Reject payout request
  const rejectDistribution = (distributionId, reason = 'Declined by CTO', userName = 'Akbar Hussain (CTO)', userRole = 'cto') => {
    const item = distributions.find(d => d.id === distributionId);
    if (!item) return false;

    const rejecterName = userName || (userRole === 'cto' ? 'Akbar Hussain (CTO)' : 'Admin');
    const updated = {
      ...item,
      approvalStatus: 'Rejected',
      rejectedBy: rejecterName,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    };

    setDistributions(prev => prev.map(d => d.id === distributionId ? updated : d));

    logActivity(
      'REJECT_PAYOUT',
      'disbursements',
      distributionId,
      `Declined payout request for ${item.beneficiaryName}: ${reason}`,
      { approvalStatus: item.approvalStatus || 'Pending Approval' },
      { approvalStatus: 'Rejected', rejectedBy: rejecterName },
      rejecterName,
      [{ field: 'Approval Status', from: item.approvalStatus || 'Pending Approval', to: 'Rejected' }]
    );

    api.rejectDistribution(distributionId, { userName: rejecterName, userRole, reason }).catch(err => {
      console.warn('[API Sync] rejectDistribution note:', err.message);
    });

    return true;
  };

  // Add Distribution
  const addDistribution = (entry, userName = 'Admin', userRole = 'admin') => {
    const newId = `DIST-${entry.financialYear}-${String(Date.now()).slice(-4)}`;
    const isFinanceUser = userRole === 'finance';
    const isCtoOrAdmin = userRole === 'cto' || userRole === 'admin';

    // If submitted by Finance, requires CTO authorization before funds can be marked as Paid
    const approvalStatus = isFinanceUser ? 'Pending Approval' : (entry.approvalStatus || 'Approved');
    const isPaid = !isFinanceUser && entry.paymentStatus === 'Paid';

    const newRecord = {
      id: newId,
      ...entry,
      paymentStatus: isPaid ? 'Paid' : 'Not Paid',
      amountPaid: isPaid ? (entry.amountPaid || entry.amountAllocated) : 0,
      paidDate: isPaid ? (entry.paidDate || new Date().toISOString().split('T')[0]) : null,
      approvalStatus,
      approvedBy: isCtoOrAdmin ? (userName || 'Akbar Hussain (CTO)') : null,
      approvedAt: isCtoOrAdmin ? new Date().toISOString() : null,
      submittedBy: userName || (isFinanceUser ? 'Finance Team' : 'CTO / Admin')
    };

    setDistributions(prev => [newRecord, ...prev]);

    // Update beneficiary multi-year history
    if (entry.beneficiaryId) {
      setBeneficiaries(prev => prev.map(ben => {
        if (ben.id === entry.beneficiaryId) {
          return {
            ...ben,
            history: {
              ...ben.history,
              [entry.financialYear]: Number(entry.amountAllocated) || 0
            }
          };
        }
        return ben;
      }));
    }

    logActivity(
      'CREATE_DISBURSEMENT',
      'disbursements',
      newId,
      `Allocated ₹${Number(entry.amountAllocated).toLocaleString('en-IN')} to ${entry.beneficiaryName} [${newRecord.paymentStatus} / ${approvalStatus}] for FY ${entry.financialYear}`,
      null,
      newRecord,
      userName,
      [
        { field: 'Beneficiary', from: '—', to: entry.beneficiaryName },
        { field: 'Amount Allocated', from: '—', to: `₹${Number(entry.amountAllocated).toLocaleString('en-IN')}` },
        { field: 'Category', from: '—', to: entry.classification },
        { field: 'Status', from: '—', to: newRecord.paymentStatus },
        { field: 'Approval Status', from: '—', to: approvalStatus }
      ]
    );

    // Sync with Full-Stack Backend
    api.createDistribution({
      ...newRecord,
      userName,
      userRole
    }).catch(err => {
      console.warn('[API Sync] createDistribution note:', err.message);
    });

    if (newRecord.paymentStatus === 'Paid') {
      triggerPaidConfetti();
    }

    return newRecord;
  };

  const updateDistribution = (updated, userName = 'Admin') => {
    const existing = distributions.find(d => d.id === updated.id);
    if (!existing) return;

    const changedFields = [];
    if (Number(existing.amountAllocated) !== Number(updated.amountAllocated)) {
      changedFields.push({ field: 'Amount Allocated', from: `₹${Number(existing.amountAllocated).toLocaleString('en-IN')}`, to: `₹${Number(updated.amountAllocated).toLocaleString('en-IN')}` });
    }
    if (Number(existing.amountPaid) !== Number(updated.amountPaid)) {
      changedFields.push({ field: 'Amount Paid', from: `₹${Number(existing.amountPaid).toLocaleString('en-IN')}`, to: `₹${Number(updated.amountPaid).toLocaleString('en-IN')}` });
    }
    if (existing.paymentStatus !== updated.paymentStatus) {
      changedFields.push({ field: 'Payment Status', from: existing.paymentStatus, to: updated.paymentStatus });
    }
    if (existing.paymentMethod !== updated.paymentMethod) {
      changedFields.push({ field: 'Payment Method', from: existing.paymentMethod || '—', to: updated.paymentMethod || '—' });
    }
    if (existing.sourceAccountName !== updated.sourceAccountName) {
      changedFields.push({ field: 'Source Account', from: existing.sourceAccountName || '—', to: updated.sourceAccountName || '—' });
    }
    if (existing.remarks !== updated.remarks) {
      changedFields.push({ field: 'Remarks / Notes', from: existing.remarks || 'None', to: updated.remarks || 'None' });
    }

    setDistributions(prev => prev.map(d => d.id === updated.id ? updated : d));

    logActivity(
      'UPDATE_DISBURSEMENT',
      'disbursements',
      existing.id,
      `Updated payment details for ${existing.beneficiaryName} (${changedFields.length} fields changed)`,
      existing,
      updated,
      userName,
      changedFields
    );

    // Sync with Full-Stack Backend
    api.updateDistribution(existing.id, updated).catch(err => {
      console.warn('[API Sync] updateDistribution note:', err.message);
    });
  };

  // Safe Delete Distribution to Recycle Bin
  const deleteDistribution = (id, userName = 'Admin') => {
    const target = distributions.find(d => d.id === id);
    if (!target) return;

    const rbItem = {
      id: `RB-DIST-${id}-${Date.now()}`,
      itemType: 'distribution',
      title: target.beneficiaryName || 'Payment Record',
      subtitle: `₹${(Number(target.amountAllocated) || 0).toLocaleString('en-IN')} (${target.classification}) • FY ${target.financialYear}`,
      count: 1,
      totalAmount: Number(target.amountAllocated) || 0,
      data: target,
      deletedAt: new Date().toISOString(),
      expiresDays: 30
    };

    setRecycleBin(prev => [rbItem, ...prev]);
    setDistributions(prev => prev.filter(d => d.id !== id));

    logActivity(
      'DELETE_DISBURSEMENT',
      'disbursements',
      id,
      `Moved payment record for ${target.beneficiaryName} (₹${(Number(target.amountAllocated) || 0).toLocaleString('en-IN')}) to Recycle Bin`,
      target,
      null,
      userName
    );

    // Sync with Full-Stack Backend
    api.deleteDistribution(id).catch(err => {
      console.warn('[API Sync] deleteDistribution note:', err.message);
    });
  };

  // Duplicate Check Helper
  const checkDuplicates = (candidate, excludeId = null) => {
    return findPotentialDuplicates(candidate, beneficiaries, excludeId);
  };

  // Add Beneficiary
  const addBeneficiary = (ben, userName = 'Admin') => {
    const nextNum = beneficiaries.length + 1;
    const newId = `BEN-${String(nextNum).padStart(2, '0')}`;
    const newBen = {
      id: newId,
      ...ben,
      history: ben.history || { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 }
    };

    setBeneficiaries(prev => [...prev, newBen]);
    logActivity(
      'CREATE_BENEFICIARY',
      'beneficiaries',
      newId,
      `Registered beneficiary ${newBen.fullName} (${newBen.classification})`,
      null,
      newBen,
      userName,
      [
        { field: 'Full Name', from: '—', to: newBen.fullName },
        { field: 'Category', from: '—', to: newBen.classification },
        { field: 'Coordinator', from: '—', to: newBen.referencePerson || '—' }
      ]
    );

    // Sync with Full-Stack Backend
    api.createBeneficiary(newBen).catch(err => {
      console.warn('[API Sync] createBeneficiary note:', err.message);
    });

    return newBen;
  };

  const updateBeneficiary = (updated, userName = 'Admin') => {
    const current = beneficiaries.find(b => b.id === updated.id);
    if (!current) return;

    const changedFields = [];
    if (current.fullName !== updated.fullName) {
      changedFields.push({ field: 'Full Name', from: current.fullName, to: updated.fullName });
    }
    if (current.classification !== updated.classification) {
      changedFields.push({ field: 'Category', from: current.classification, to: updated.classification });
    }
    if (current.subCategory !== updated.subCategory) {
      changedFields.push({ field: 'Sub-Category', from: current.subCategory || '—', to: updated.subCategory || '—' });
    }
    if (current.verificationStatus !== updated.verificationStatus) {
      changedFields.push({ field: 'Verification Status', from: current.verificationStatus || '—', to: updated.verificationStatus || '—' });
    }
    if (current.phone !== updated.phone) {
      changedFields.push({ field: 'Phone Contact', from: current.phone || '—', to: updated.phone || '—' });
    }
    if (current.location !== updated.location) {
      changedFields.push({ field: 'Location', from: current.location || '—', to: updated.location || '—' });
    }
    if (current.referencePerson !== updated.referencePerson) {
      changedFields.push({ field: 'Coordinator', from: current.referencePerson || '—', to: updated.referencePerson || '—' });
    }
    if (current.auditNotes !== updated.auditNotes) {
      changedFields.push({ field: 'Audit Notes', from: current.auditNotes || 'None', to: updated.auditNotes || 'None' });
    }

    setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));

    logActivity(
      'UPDATE_BENEFICIARY',
      'beneficiaries',
      updated.id,
      `Updated profile for ${updated.fullName} (${changedFields.length} fields changed)`,
      current,
      updated,
      userName,
      changedFields
    );

    // Sync with Full-Stack Backend
    api.updateBeneficiary(updated.id, updated).catch(err => {
      console.warn('[API Sync] updateBeneficiary note:', err.message);
    });
  };

  // Safe Delete Beneficiary to Recycle Bin
  const deleteBeneficiary = (id, userName = 'Admin') => {
    const target = beneficiaries.find(b => b.id === id);
    if (!target) return;

    const rbItem = {
      id: `RB-BEN-${id}-${Date.now()}`,
      itemType: 'beneficiary',
      title: target.fullName,
      subtitle: `${target.classification} • Coordinator: ${target.referencePerson || 'Central'}`,
      count: 1,
      totalAmount: 0,
      data: target,
      deletedAt: new Date().toISOString(),
      expiresDays: 30
    };

    setRecycleBin(prev => [rbItem, ...prev]);
    setBeneficiaries(prev => prev.filter(b => b.id !== id));

    logActivity('DELETE_BENEFICIARY', 'beneficiaries', id, `Moved beneficiary ${target.fullName} to Recycle Bin`, target, null, userName);

    // Sync with Full-Stack Backend
    api.deleteBeneficiary(id).catch(err => {
      console.warn('[API Sync] deleteBeneficiary note:', err.message);
    });
  };

  // Create Zakat Year
  const createZakatYear = (newYearNum, notes = '', userName = 'Admin') => {
    const existing = zakatYears.find(y => y.year === Number(newYearNum));
    if (existing) {
      alert(`Year ${newYearNum} already exists!`);
      return false;
    }

    const newYearEntry = {
      id: `yr-${newYearNum}`,
      year: Number(newYearNum),
      status: 'active',
      startDate: `${newYearNum}-01-01`,
      endDate: `${newYearNum}-12-31`,
      notes: notes || `Created on ${new Date().toLocaleDateString()}`
    };

    // Close previous active year
    setZakatYears(prev => [
      newYearEntry,
      ...prev.map(y => y.year === financialYear ? { ...y, status: 'closed' } : y)
    ]);

    setFinancialYear(Number(newYearNum));

    logActivity(
      'CREATE_YEAR_ROLLOVER',
      'zakat_years',
      newYearEntry.id,
      `Rolled over to new Assessment Year ${newYearNum}. Historical records preserved.`,
      { previousActive: financialYear },
      newYearEntry,
      userName
    );

    // Sync with Full-Stack Backend
    api.createYear(newYearEntry).catch(err => {
      console.warn('[API Sync] createYear note:', err.message);
    });

    triggerPaidConfetti();
    return true;
  };

  // Safe Delete Entire Assessment Year (bundled into a single clean Recycle Bin item)
  const deleteZakatYear = (yearNum, userName = 'Admin') => {
    const yearNumber = Number(yearNum);
    const targetYear = zakatYears.find(y => y.year === yearNumber);
    if (!targetYear) return false;

    // Find all transactions under this year
    const yearTransactions = distributions.filter(d => d.financialYear === yearNumber);
    const totalAmount = yearTransactions.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);

    // Bundle the entire year and all transactions into ONE Recycle Bin item
    const rbItem = {
      id: `RB-YEAR-${yearNumber}-${Date.now()}`,
      itemType: 'year',
      yearNumber,
      title: `Assessment Year ${yearNumber}`,
      subtitle: `${yearTransactions.length} transaction records • Total ₹${totalAmount.toLocaleString('en-IN')}`,
      count: yearTransactions.length,
      totalAmount,
      yearData: targetYear,
      distributionsData: yearTransactions,
      deletedAt: new Date().toISOString(),
      expiresDays: 30
    };

    setRecycleBin(prev => [rbItem, ...prev]);

    // Remove year from active years
    const remainingYears = zakatYears.filter(y => y.year !== yearNumber);
    setZakatYears(remainingYears);

    // Remove transactions from active ledger
    setDistributions(prev => prev.filter(d => d.financialYear !== yearNumber));

    // If currently viewing the deleted year, switch active view to the latest remaining year
    if (Number(financialYear) === yearNumber && remainingYears.length > 0) {
      setFinancialYear(remainingYears[0].year);
    }

    logActivity(
      'DELETE_YEAR',
      'zakat_years',
      `yr-${yearNumber}`,
      `Moved Assessment Year ${yearNumber} with ${yearTransactions.length} transactions (₹${totalAmount.toLocaleString('en-IN')}) to Recycle Bin`,
      { year: targetYear, transactionCount: yearTransactions.length },
      null,
      userName
    );

    // Sync with Full-Stack Backend
    api.deleteYear(yearNumber, userName).catch(err => {
      console.warn('[API Sync] deleteYear note:', err.message);
    });

    return true;
  };

  // Restore from Recycle Bin
  const restoreFromRecycleBin = (rbItemId, userName = 'Admin') => {
    const item = recycleBin.find(r => r.id === rbItemId);
    if (!item) return false;

    if (item.itemType === 'year') {
      // Restore year and all bundled transactions
      if (item.yearData) {
        setZakatYears(prev => {
          if (prev.some(y => y.year === item.yearNumber)) return prev;
          return [item.yearData, ...prev].sort((a, b) => b.year - a.year);
        });
      }
      if (item.distributionsData && item.distributionsData.length > 0) {
        setDistributions(prev => {
          const existingIds = new Set(prev.map(d => d.id));
          const newToAdd = item.distributionsData.filter(d => !existingIds.has(d.id));
          return [...newToAdd, ...prev];
        });
      }
      setFinancialYear(item.yearNumber);
      logActivity('RESTORE_YEAR', 'zakat_years', `yr-${item.yearNumber}`, `Restored Assessment Year ${item.yearNumber} and ${item.count} transactions from Recycle Bin`, null, item.yearData, userName);
    } else if (item.itemType === 'distribution') {
      if (item.data) {
        setDistributions(prev => [item.data, ...prev.filter(d => d.id !== item.data.id)]);
        logActivity('RESTORE_DISBURSEMENT', 'disbursements', item.data.id, `Restored payment for ${item.title} from Recycle Bin`, null, item.data, userName);
      }
    } else if (item.itemType === 'beneficiary') {
      if (item.data) {
        setBeneficiaries(prev => [item.data, ...prev.filter(b => b.id !== item.data.id)]);
        logActivity('RESTORE_BENEFICIARY', 'beneficiaries', item.data.id, `Restored beneficiary ${item.title} from Recycle Bin`, null, item.data, userName);
      }
    }

    setRecycleBin(prev => prev.filter(r => r.id !== rbItemId));

    // Sync with Full-Stack Backend
    api.restoreRecycleBin(rbItemId, userName).catch(err => {
      console.warn('[API Sync] restoreRecycleBin note:', err.message);
    });

    triggerPaidConfetti();
    return true;
  };

  // Permanently Delete from Recycle Bin
  const permanentlyDeleteFromRecycleBin = (rbItemId) => {
    setRecycleBin(prev => prev.filter(r => r.id !== rbItemId));
    api.deleteRecycleBinItem(rbItemId).catch(err => {
      console.warn('[API Sync] deleteRecycleBinItem note:', err.message);
    });
  };

  // Empty Recycle Bin
  const emptyRecycleBin = () => {
    setRecycleBin([]);
    api.emptyRecycleBin().catch(err => {
      console.warn('[API Sync] emptyRecycleBin note:', err.message);
    });
  };

  // Query record history by record ID (with automatic adjacent duplicate filtering)
  const getRecordHistory = (recordId) => {
    const raw = auditLogs.filter(log => String(log.recordId) === String(recordId));
    const deduped = [];
    for (let i = 0; i < raw.length; i++) {
      const cur = raw[i];
      const prev = deduped[deduped.length - 1];
      if (
        prev &&
        prev.actionType === cur.actionType &&
        Math.abs(new Date(prev.timestamp).getTime() - new Date(cur.timestamp).getTime()) < 3500
      ) {
        continue; // skip duplicate log entry
      }
      deduped.push(cur);
    }
    return deduped;
  };

  // Asset Pool Management
  const updateAsset = (id, newAmount, notes, userName = 'Admin') => {
    setAssets(prev => prev.map(a => {
      if (a.id === id) {
        logActivity('UPDATE_ASSET', 'zakat_asset_items', id, `Updated valuation of ${a.name} to ₹${newAmount}`, a, { ...a, amount: newAmount }, userName);
        return {
          ...a,
          amount: Number(newAmount) || 0,
          notes: notes !== undefined ? notes : a.notes
        };
      }
      return a;
    }));

    // Sync with Full-Stack Backend
    api.updateAsset(id, { amount: newAmount, notes }).catch(err => {
      console.warn('[API Sync] updateAsset note:', err.message);
    });
  };

  const addAsset = (asset, userName = 'Admin') => {
    const newId = `AST-${String(assets.length + 1).padStart(2, '0')}`;
    setAssets(prev => [...prev, { id: newId, ...asset }]);
    logActivity('CREATE_ASSET', 'zakat_asset_items', newId, `Added asset item ${asset.name} valuing ₹${asset.amount}`, null, asset, userName);
  };

  const deleteAsset = (id, userName = 'Admin') => {
    const target = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    logActivity('DELETE_ASSET', 'zakat_asset_items', id, `Deleted asset item ${target?.name}`, target, null, userName);
  };

  // Ration Distribution Management
  const updateRationItem = (updated) => {
    setRationDistributions(prev => prev.map(r => r.id === updated.id ? updated : r));
    logActivity('UPDATE_RATION', 'ration_distributions', updated.id, `Updated ration record for ${updated.name}`);
  };

  const addRationItem = (item) => {
    const newId = `RAT-${Date.now()}`;
    const newRation = { id: newId, ...item };
    setRationDistributions(prev => [newRation, ...prev]);
    logActivity('CREATE_RATION', 'ration_distributions', newId, `Added ration recipient ${item.name} in ${item.colony}`);
  };

  // Education Assistance Management
  const updateEducationItem = (updated) => {
    setEducationRecords(prev => prev.map(e => e.id === updated.id ? updated : e));
    logActivity('UPDATE_EDUCATION', 'education_assistance', updated.id, `Updated education grant for ${updated.studentName} [${updated.status}]`);
  };

  const addEducationItem = (item) => {
    const newId = `EDU-${Date.now()}`;
    const newEdu = { id: newId, ...item };
    setEducationRecords(prev => [newEdu, ...prev]);
    logActivity('CREATE_EDUCATION', 'education_assistance', newId, `Created student education record for ${item.studentName} (${item.schoolName})`);
  };

  // Category Master CRUD
  const addCategory = (cat, userName = 'Admin') => {
    const newId = `CAT-${String(categories.length + 1).padStart(2, '0')}`;
    const newCat = { id: newId, ...cat };
    setCategories(prev => [...prev, newCat]);
    logActivity('CREATE_CATEGORY', 'categories', newId, `Added category ${cat.name}`, null, newCat, userName);
    return newCat;
  };

  const updateCategory = (updated, userName = 'Admin') => {
    setCategories(prev => prev.map(c => {
      if (c.id === updated.id) {
        logActivity('UPDATE_CATEGORY', 'categories', c.id, `Updated category ${c.name}`, c, updated, userName);
        return updated;
      }
      return c;
    }));

    // Sync with Full-Stack Backend
    api.updateCategory(updated.id, updated).catch(err => {
      console.warn('[API Sync] updateCategory note:', err.message);
    });
  };

  const deleteCategory = (id, userName = 'Admin') => {
    const target = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    logActivity('DELETE_CATEGORY', 'categories', id, `Deleted category ${target?.name}`, target, null, userName);
  };

  // Funding Account CRUD
  const addFundingAccount = (acc, userName = 'Admin') => {
    const newId = `ACC-${String(fundingAccounts.length + 1).padStart(2, '0')}`;
    const newAcc = { id: newId, ...acc };
    setFundingAccounts(prev => [...prev, newAcc]);
    logActivity('CREATE_ACCOUNT', 'fund_sources', newId, `Added funding account ${acc.name}`, null, newAcc, userName);
    return newAcc;
  };

  const updateFundingAccount = (updated, userName = 'Admin') => {
    setFundingAccounts(prev => prev.map(a => {
      if (a.id === updated.id) {
        logActivity('UPDATE_ACCOUNT', 'fund_sources', a.id, `Updated account ${a.name}`, a, updated, userName);
        return updated;
      }
      return a;
    }));
  };

  const deleteFundingAccount = (id, userName = 'Admin') => {
    const target = fundingAccounts.find(a => a.id === id);
    setFundingAccounts(prev => prev.filter(a => a.id !== id));
    logActivity('DELETE_ACCOUNT', 'fund_sources', id, `Deleted funding account ${target?.name}`, target, null, userName);
  };

  // Reference Coordinator CRUD
  const addReferencePerson = (ref, userName = 'Admin') => {
    const newId = `REF-${String(referencePersons.length + 1).padStart(2, '0')}`;
    const newRef = { id: newId, ...ref };
    setReferencePersons(prev => [...prev, newRef]);
    logActivity('CREATE_REFERENCE', 'reference_coordinators', newId, `Added reference coordinator ${ref.name}`, null, newRef, userName);
    return newRef;
  };

  const updateReferencePerson = (updated, userName = 'Admin') => {
    setReferencePersons(prev => prev.map(r => {
      if (r.id === updated.id) {
        logActivity('UPDATE_REFERENCE', 'reference_coordinators', r.id, `Updated reference ${r.name}`, r, updated, userName);
        return updated;
      }
      return r;
    }));
  };

  const deleteReferencePerson = (id, userName = 'Admin') => {
    const target = referencePersons.find(r => r.id === id);
    setReferencePersons(prev => prev.filter(r => r.id !== id));
    logActivity('DELETE_REFERENCE', 'reference_coordinators', id, `Deleted reference coordinator ${target?.name}`, target, null, userName);
  };

  // Batch Import (Excel Workbook integration)
  const batchImportRecords = (importPayload, userName = 'Admin') => {
    if (importPayload.beneficiaries?.length) {
      setBeneficiaries(prev => [...prev, ...importPayload.beneficiaries]);
    }
    if (importPayload.distributions?.length) {
      setDistributions(prev => [...prev, ...importPayload.distributions]);
    }
    logActivity(
      'EXCEL_BATCH_IMPORT',
      'import_batches',
      `BATCH-${Date.now()}`,
      `Imported ${importPayload.beneficiaries?.length || 0} beneficiaries and ${importPayload.distributions?.length || 0} distributions from Excel`,
      null,
      { count: (importPayload.beneficiaries?.length || 0) + (importPayload.distributions?.length || 0) },
      userName
    );
    triggerPaidConfetti();
  };

  const value = {
    zakatYears,
    financialYear,
    setFinancialYear,
    createZakatYear,
    customAnnualBudget,
    setCustomAnnualBudget: handleSetCustomAnnualBudget,
    assets,
    categories,
    categoryMetrics,
    fundingAccounts,
    referencePersons,
    beneficiaries,
    distributions,
    currentYearDistributions,
    verificationStatuses: INITIAL_VERIFICATION_STATUSES,
    multiYearArchive: MULTI_YEAR_ARCHIVE,
    employeeSummary: EMPLOYEE_ACCOUNTS_SUMMARY,
    rationDistributions,
    aurangabadRationList: AURANGABAD_RATION_BENEFICIARIES,
    auditLogs,
    recycleBin,

    // KPI Metrics
    totalZakatableAssets,
    calculated25Pool,
    plannedAnnualBudget,
    totalZakatPlanned,
    totalZakatPaid,
    totalSadqaPaid,
    grandTotalPaid,
    totalPendingZakat,
    overallUtilization,
    isBudgetExceeded,
    isAllocationExceeded,
    pendingApprovalCount,

    // Actions
    toggleDistributionPaid,
    approveDistribution,
    rejectDistribution,
    addDistribution,
    updateDistribution,
    deleteDistribution,
    checkDuplicates,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    createZakatYear,
    deleteZakatYear,
    restoreFromRecycleBin,
    permanentlyDeleteFromRecycleBin,
    emptyRecycleBin,
    getRecordHistory,
    addCategory,
    updateCategory,
    deleteCategory,
    addFundingAccount,
    updateFundingAccount,
    deleteFundingAccount,
    addReferencePerson,
    updateReferencePerson,
    deleteReferencePerson,
    updateAsset,
    addAsset,
    deleteAsset,
    updateRationItem,
    addRationItem,
    updateEducationItem,
    addEducationItem,
    batchImportRecords,
    logActivity,
    resetToDefaultData
  };

  return (
    <ZakatContext.Provider value={value}>
      {children}
    </ZakatContext.Provider>
  );
};

export const useZakat = () => {
  const context = useContext(ZakatContext);
  if (!context) {
    throw new Error('useZakat must be used within a ZakatProvider');
  }
  return context;
};
