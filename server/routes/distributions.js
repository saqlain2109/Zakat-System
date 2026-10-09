import { Router } from 'express';
import { db } from '../config/db.js';

export const distributionRouter = Router();

// GET /api/distributions
distributionRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    const { financialYear, categoryId, status } = req.query;
    let list = store.distributions;

    if (financialYear) {
      list = list.filter(d => Number(d.financialYear) === Number(financialYear));
    }
    if (categoryId) {
      list = list.filter(d => d.categoryId === categoryId);
    }
    if (status) {
      list = list.filter(d => d.paymentStatus.toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/distributions
distributionRouter.post('/', (req, res) => {
  try {
    const entry = req.body;
    if (!entry.beneficiaryId || !entry.amountAllocated) {
      return res.status(400).json({ success: false, error: 'Beneficiary and Amount are required' });
    }

    const newId = `DIST-${entry.financialYear || 2026}-${String(Date.now()).slice(-4)}`;
    const numAmt = Number(entry.amountAllocated) || 0;
    const isFinanceUser = entry.userRole === 'finance';
    const isCtoOrAdmin = entry.userRole === 'cto' || entry.userRole === 'admin';

    // If created by Finance team, payout automatically requires CTO approval and cannot be paid immediately
    const approvalStatus = isFinanceUser
      ? 'Pending Approval'
      : (entry.approvalStatus || 'Approved');

    const isPaid = !isFinanceUser && entry.paymentStatus === 'Paid';

    const newRecord = {
      id: newId,
      ...entry,
      amountAllocated: numAmt,
      paymentStatus: isPaid ? 'Paid' : 'Not Paid',
      amountPaid: isPaid ? (Number(entry.amountPaid) || numAmt) : 0,
      paidDate: isPaid ? (entry.paidDate || new Date().toISOString().split('T')[0]) : null,
      approvalStatus,
      approvedBy: isCtoOrAdmin ? (entry.userName || 'Akbar Hussain (CTO)') : null,
      approvedAt: isCtoOrAdmin ? new Date().toISOString() : null,
      submittedBy: entry.userName || (isFinanceUser ? 'Finance Team' : 'Akbar Hussain (CTO)'),
      createdAt: new Date().toISOString()
    };

    db.updateStore(store => {
      store.distributions.unshift(newRecord);

      // Update beneficiary multi-year history
      const ben = store.beneficiaries.find(b => b.id === entry.beneficiaryId);
      if (ben) {
        ben.history = ben.history || {};
        ben.history[entry.financialYear || 2026] = numAmt;
      }

      // Log activity
      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: entry.userName || 'Admin',
        actionType: 'CREATE_DISBURSEMENT',
        entityName: 'disbursements',
        recordId: newId,
        description: `Allocated ₹${numAmt.toLocaleString('en-IN')} to ${entry.beneficiaryName} [${newRecord.paymentStatus}] for FY ${entry.financialYear}`,
        oldValue: null,
        newValue: newRecord,
        changedFields: [
          { field: 'Beneficiary', from: '—', to: entry.beneficiaryName },
          { field: 'Amount Allocated', from: '—', to: `₹${numAmt.toLocaleString('en-IN')}` },
          { field: 'Category', from: '—', to: entry.classification },
          { field: 'Status', from: '—', to: newRecord.paymentStatus }
        ],
        timestamp: new Date().toISOString()
      });
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/distributions/:id
distributionRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    let saved = null;

    db.updateStore(store => {
      const idx = store.distributions.findIndex(d => d.id === id);
      if (idx === -1) return;

      const current = store.distributions[idx];
      const changedFields = [];

      if (Number(current.amountAllocated) !== Number(updated.amountAllocated)) {
        changedFields.push({ field: 'Amount Allocated', from: `₹${Number(current.amountAllocated).toLocaleString('en-IN')}`, to: `₹${Number(updated.amountAllocated).toLocaleString('en-IN')}` });
      }
      if (Number(current.amountPaid) !== Number(updated.amountPaid)) {
        changedFields.push({ field: 'Amount Paid', from: `₹${Number(current.amountPaid).toLocaleString('en-IN')}`, to: `₹${Number(updated.amountPaid).toLocaleString('en-IN')}` });
      }
      if (current.paymentStatus !== updated.paymentStatus) {
        changedFields.push({ field: 'Payment Status', from: current.paymentStatus, to: updated.paymentStatus });
      }
      if (current.paymentMethod !== updated.paymentMethod) {
        changedFields.push({ field: 'Payment Method', from: current.paymentMethod || '—', to: updated.paymentMethod || '—' });
      }
      if (current.sourceAccountName !== updated.sourceAccountName) {
        changedFields.push({ field: 'Source Account', from: current.sourceAccountName || '—', to: updated.sourceAccountName || '—' });
      }
      if (current.remarks !== updated.remarks) {
        changedFields.push({ field: 'Remarks / Notes', from: current.remarks || 'None', to: updated.remarks || 'None' });
      }

      saved = { ...current, ...updated, updatedAt: new Date().toISOString() };
      store.distributions[idx] = saved;

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: req.body.userName || 'Admin',
        actionType: 'UPDATE_DISBURSEMENT',
        entityName: 'disbursements',
        recordId: id,
        description: `Updated payment details for ${saved.beneficiaryName} (${changedFields.length} fields changed)`,
        oldValue: current,
        newValue: saved,
        changedFields,
        timestamp: new Date().toISOString()
      });
    });

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Disbursement not found' });
    }
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/distributions/:id/toggle-paid
distributionRouter.patch('/:id/toggle-paid', (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userRole } = req.body;
    let saved = null;
    let authError = null;

    db.updateStore(store => {
      const idx = store.distributions.findIndex(d => d.id === id);
      if (idx === -1) return;

      const current = store.distributions[idx];
      const isCurrentlyPaid = current.paymentStatus === 'Paid';
      const newStatus = isCurrentlyPaid ? 'Not Paid' : 'Paid';

      // If Finance team tries to mark an unapproved disbursement as Paid, block it
      if (newStatus === 'Paid' && current.approvalStatus && current.approvalStatus !== 'Approved') {
        if (userRole === 'finance') {
          authError = 'This payout requires authorization from CTO (Akbar Hussain) before payment can be released.';
          return;
        }
      }

      const newAmt = isCurrentlyPaid ? 0 : Number(current.amountAllocated);
      const newDate = isCurrentlyPaid ? null : new Date().toISOString().split('T')[0];

      saved = {
        ...current,
        paymentStatus: newStatus,
        amountPaid: newAmt,
        paidDate: newDate,
        updatedAt: new Date().toISOString()
      };
      store.distributions[idx] = saved;

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: userName || 'Admin',
        actionType: 'PAYMENT_STATUS_CHANGE',
        entityName: 'disbursements',
        recordId: id,
        description: `Status changed for ${current.beneficiaryName}: ${current.paymentStatus} → ${newStatus} (₹${newAmt.toLocaleString('en-IN')})`,
        oldValue: { status: current.paymentStatus, amountPaid: current.amountPaid },
        newValue: { status: newStatus, amountPaid: newAmt },
        changedFields: [
          { field: 'Payment Status', from: current.paymentStatus, to: newStatus },
          { field: 'Amount Paid', from: `₹${(current.amountPaid || 0).toLocaleString('en-IN')}`, to: `₹${newAmt.toLocaleString('en-IN')}` },
          { field: 'Payment Date', from: current.paidDate || 'None', to: newDate || 'Pending' }
        ],
        timestamp: new Date().toISOString()
      });
    });

    if (authError) {
      return res.status(403).json({ success: false, error: authError });
    }

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Disbursement not found' });
    }
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/distributions/:id/approve (CTO Authorization)
distributionRouter.patch('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userRole } = req.body;
    let saved = null;

    db.updateStore(store => {
      const idx = store.distributions.findIndex(d => d.id === id);
      if (idx === -1) return;

      const current = store.distributions[idx];
      const approverName = userName || (userRole === 'cto' ? 'Akbar Hussain (CTO)' : 'Admin');

      saved = {
        ...current,
        approvalStatus: 'Approved',
        approvedBy: approverName,
        approvedAt: new Date().toISOString()
      };
      store.distributions[idx] = saved;

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: approverName,
        actionType: 'APPROVE_PAYOUT',
        entityName: 'disbursements',
        recordId: id,
        description: `CTO Authorized payout of ₹${(Number(current.amountAllocated) || 0).toLocaleString('en-IN')} for ${current.beneficiaryName}`,
        oldValue: { approvalStatus: current.approvalStatus || 'Pending Approval' },
        newValue: { approvalStatus: 'Approved', approvedBy: approverName },
        changedFields: [{ field: 'Approval Status', from: current.approvalStatus || 'Pending Approval', to: 'Approved' }],
        timestamp: new Date().toISOString()
      });
    });

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Disbursement not found' });
    }
    res.json({ success: true, message: 'Disbursement authorized successfully by CTO', data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/distributions/:id/reject (CTO Decline)
distributionRouter.patch('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { userName, userRole, reason } = req.body;
    let saved = null;

    db.updateStore(store => {
      const idx = store.distributions.findIndex(d => d.id === id);
      if (idx === -1) return;

      const current = store.distributions[idx];
      const rejecterName = userName || (userRole === 'cto' ? 'Akbar Hussain (CTO)' : 'Admin');

      saved = {
        ...current,
        approvalStatus: 'Rejected',
        rejectedBy: rejecterName,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason || 'Declined by CTO'
      };
      store.distributions[idx] = saved;

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: rejecterName,
        actionType: 'REJECT_PAYOUT',
        entityName: 'disbursements',
        recordId: id,
        description: `Declined payout request for ${current.beneficiaryName}: ${reason || 'Declined by CTO'}`,
        oldValue: { approvalStatus: current.approvalStatus || 'Pending Approval' },
        newValue: { approvalStatus: 'Rejected', rejectedBy: rejecterName },
        changedFields: [{ field: 'Approval Status', from: current.approvalStatus || 'Pending Approval', to: 'Rejected' }],
        timestamp: new Date().toISOString()
      });
    });

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Disbursement not found' });
    }
    res.json({ success: true, message: 'Disbursement rejected', data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/distributions/:id (Safe Delete to Recycle Bin)
distributionRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let deletedTarget = null;

    db.updateStore(store => {
      const target = store.distributions.find(d => d.id === id);
      if (!target) return;

      deletedTarget = target;
      store.distributions = store.distributions.filter(d => d.id !== id);

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

      store.recycleBin.unshift(rbItem);

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: req.body.userName || 'Admin',
        actionType: 'DELETE_DISBURSEMENT',
        entityName: 'disbursements',
        recordId: id,
        description: `Moved payment record for ${target.beneficiaryName} to Recycle Bin`,
        oldValue: target,
        newValue: null,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    if (!deletedTarget) {
      return res.status(404).json({ success: false, error: 'Disbursement not found' });
    }
    res.json({ success: true, message: 'Disbursement moved to Recycle Bin', data: deletedTarget });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
