import { Router } from 'express';
import { db } from '../config/db.js';

export const beneficiaryRouter = Router();

// GET /api/beneficiaries
beneficiaryRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    const { search, category, status } = req.query;
    let list = store.beneficiaries;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.fullName.toLowerCase().includes(q) ||
        (b.classification && b.classification.toLowerCase().includes(q)) ||
        (b.subCategory && b.subCategory.toLowerCase().includes(q)) ||
        (b.location && b.location.toLowerCase().includes(q)) ||
        (b.phone && b.phone.includes(q))
      );
    }
    if (category && category !== 'ALL') {
      list = list.filter(b => b.classification === category || b.categoryId === category);
    }
    if (status && status !== 'ALL') {
      list = list.filter(b => (b.verificationStatus || '').toLowerCase() === status.toLowerCase());
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/beneficiaries
beneficiaryRouter.post('/', (req, res) => {
  try {
    const ben = req.body;
    if (!ben.fullName) {
      return res.status(400).json({ success: false, error: 'Full Name is required' });
    }

    const store = db.getStore();
    const nextNum = store.beneficiaries.length + 1;
    const newId = `BEN-${String(nextNum).padStart(2, '0')}`;

    const newBen = {
      id: newId,
      ...ben,
      verificationStatus: ben.verificationStatus || 'Verified',
      history: ben.history || { 2022: 0, 2023: 0, 2024: 0, 2025: 0, 2026: 0 },
      createdAt: new Date().toISOString()
    };

    db.updateStore(s => {
      s.beneficiaries.push(newBen);
      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: ben.userName || 'Admin',
        actionType: 'CREATE_BENEFICIARY',
        entityName: 'beneficiaries',
        recordId: newId,
        description: `Registered beneficiary ${newBen.fullName} (${newBen.classification})`,
        oldValue: null,
        newValue: newBen,
        changedFields: [
          { field: 'Full Name', from: '—', to: newBen.fullName },
          { field: 'Category', from: '—', to: newBen.classification }
        ],
        timestamp: new Date().toISOString()
      });
    });

    res.status(201).json({ success: true, data: newBen });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/beneficiaries/:id
beneficiaryRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    let saved = null;

    db.updateStore(store => {
      const idx = store.beneficiaries.findIndex(b => b.id === id);
      if (idx === -1) return;

      const current = store.beneficiaries[idx];
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
      if (current.phone !== updated.phone) {
        changedFields.push({ field: 'Phone Contact', from: current.phone || '—', to: updated.phone || '—' });
      }
      if (current.location !== updated.location) {
        changedFields.push({ field: 'Location', from: current.location || '—', to: updated.location || '—' });
      }
      if (current.referencePerson !== updated.referencePerson) {
        changedFields.push({ field: 'Coordinator', from: current.referencePerson || '—', to: updated.referencePerson || '—' });
      }

      saved = { ...current, ...updated, updatedAt: new Date().toISOString() };
      store.beneficiaries[idx] = saved;

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: req.body.userName || 'Admin',
        actionType: 'UPDATE_BENEFICIARY',
        entityName: 'beneficiaries',
        recordId: id,
        description: `Updated profile for ${saved.fullName} (${changedFields.length} fields changed)`,
        oldValue: current,
        newValue: saved,
        changedFields,
        timestamp: new Date().toISOString()
      });
    });

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Beneficiary not found' });
    }
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/beneficiaries/:id (Safe Delete to Recycle Bin)
beneficiaryRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let target = null;

    db.updateStore(store => {
      target = store.beneficiaries.find(b => b.id === id);
      if (!target) return;

      store.beneficiaries = store.beneficiaries.filter(b => b.id !== id);

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

      store.recycleBin.unshift(rbItem);

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: req.body.userName || 'Admin',
        actionType: 'DELETE_BENEFICIARY',
        entityName: 'beneficiaries',
        recordId: id,
        description: `Moved beneficiary ${target.fullName} to Recycle Bin`,
        oldValue: target,
        newValue: null,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    if (!target) {
      return res.status(404).json({ success: false, error: 'Beneficiary not found' });
    }
    res.json({ success: true, message: 'Beneficiary moved to Recycle Bin', data: target });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
