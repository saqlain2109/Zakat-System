import { Router } from 'express';
import { db } from '../config/db.js';

export const masterRouter = Router();

// GET all masters
masterRouter.get('/all', (req, res) => {
  try {
    const store = db.getStore();
    res.json({
      success: true,
      data: {
        fundingAccounts: store.fundingAccounts,
        referencePersons: store.referencePersons,
        assets: store.assets
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Accounts
masterRouter.get('/accounts', (req, res) => {
  res.json({ success: true, data: db.getStore().fundingAccounts });
});

masterRouter.post('/accounts', (req, res) => {
  try {
    const account = req.body;
    const store = db.getStore();
    const newId = `ACC-${String(store.fundingAccounts.length + 1).padStart(2, '0')}`;
    const newAccount = { id: newId, ...account };
    db.updateStore(s => s.fundingAccounts.push(newAccount));
    res.status(201).json({ success: true, data: newAccount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Coordinators
masterRouter.get('/coordinators', (req, res) => {
  res.json({ success: true, data: db.getStore().referencePersons });
});

masterRouter.post('/coordinators', (req, res) => {
  try {
    const coord = req.body;
    const store = db.getStore();
    const newId = `REF-${String(store.referencePersons.length + 1).padStart(2, '0')}`;
    const newCoord = { id: newId, ...coord };
    db.updateStore(s => s.referencePersons.push(newCoord));
    res.status(201).json({ success: true, data: newCoord });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Assets
masterRouter.get('/assets', (req, res) => {
  res.json({ success: true, data: db.getStore().assets });
});

masterRouter.put('/assets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    let saved = null;
    db.updateStore(s => {
      const target = s.assets.find(a => a.id === id);
      if (target) {
        target.amount = Number(amount) || 0;
        if (notes !== undefined) target.notes = notes;
        saved = target;
      }
    });
    if (!saved) return res.status(404).json({ success: false, error: 'Asset not found' });
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
