import { Router } from 'express';
import { db } from '../config/db.js';

export const systemRouter = Router();

// GET /api/system/initial-state (Full App Bootstrap)
systemRouter.get('/initial-state', (req, res) => {
  try {
    const store = db.getStore();
    res.json({
      success: true,
      data: {
        assets: store.assets,
        categories: store.categories,
        fundingAccounts: store.fundingAccounts,
        referencePersons: store.referencePersons,
        beneficiaries: store.beneficiaries,
        distributions: store.distributions,
        zakatYears: store.zakatYears,
        multiYearArchive: store.multiYearArchive,
        auditLogs: store.auditLogs,
        recycleBin: store.recycleBin,
        customAnnualBudget: store.customAnnualBudget
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/system/reset (Restore pristine seed data)
systemRouter.post('/reset', (req, res) => {
  try {
    const fresh = db.resetStore();
    res.json({ success: true, message: 'Database reset to pristine seed data', data: fresh });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/system/custom-budget (Override annual target budget)
systemRouter.post('/custom-budget', (req, res) => {
  try {
    const { customBudget } = req.body;
    db.updateStore(s => {
      s.customAnnualBudget = customBudget !== null && customBudget !== undefined ? Number(customBudget) : null;
    });
    res.json({ success: true, data: { customAnnualBudget: db.getStore().customAnnualBudget } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
