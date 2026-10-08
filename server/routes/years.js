import { Router } from 'express';
import { db } from '../config/db.js';

export const yearRouter = Router();

// GET /api/years
yearRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    res.json({ success: true, count: store.zakatYears.length, data: store.zakatYears });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/years
yearRouter.post('/', (req, res) => {
  try {
    const { year, notes, userName = 'Admin' } = req.body;
    const num = Number(year);
    if (!num || isNaN(num)) {
      return res.status(400).json({ success: false, error: 'Valid year is required' });
    }

    const store = db.getStore();
    if (store.zakatYears.some(y => y.year === num)) {
      return res.status(400).json({ success: false, error: `Year ${num} already exists` });
    }

    const newYearEntry = {
      id: `yr-${num}`,
      year: num,
      status: 'active',
      startDate: `${num}-01-01`,
      endDate: `${num}-12-31`,
      notes: notes || `Created on ${new Date().toLocaleDateString()}`
    };

    db.updateStore(s => {
      s.zakatYears.unshift(newYearEntry);
      s.zakatYears.sort((a, b) => b.year - a.year);
      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName,
        actionType: 'CREATE_YEAR',
        entityName: 'zakat_years',
        recordId: `yr-${num}`,
        description: `Created assessment cycle FY ${num}`,
        oldValue: null,
        newValue: newYearEntry,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    res.status(201).json({ success: true, data: newYearEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/years/:year (Bundles year and its transactions into Recycle Bin)
yearRouter.delete('/:year', (req, res) => {
  try {
    const num = Number(req.params.year);
    const userName = req.body.userName || 'Admin';
    let bundledItem = null;

    db.updateStore(store => {
      const yearEntry = store.zakatYears.find(y => y.year === num);
      if (!yearEntry) return;

      const yearDistributions = store.distributions.filter(d => Number(d.financialYear) === num);
      const totalDisbursed = yearDistributions.reduce((sum, d) => sum + (Number(d.amountAllocated) || 0), 0);

      bundledItem = {
        id: `RB-YEAR-${num}-${Date.now()}`,
        itemType: 'year',
        title: `Assessment Cycle FY ${num}`,
        subtitle: `${yearDistributions.length} recorded payments • Total value ₹${totalDisbursed.toLocaleString('en-IN')}`,
        count: yearDistributions.length,
        totalAmount: totalDisbursed,
        yearNumber: num,
        yearData: yearEntry,
        distributionsData: yearDistributions,
        deletedAt: new Date().toISOString(),
        expiresDays: 30
      };

      store.recycleBin.unshift(bundledItem);
      store.distributions = store.distributions.filter(d => Number(d.financialYear) !== num);
      store.zakatYears = store.zakatYears.filter(y => y.year !== num);

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName,
        actionType: 'DELETE_YEAR',
        entityName: 'zakat_years',
        recordId: `yr-${num}`,
        description: `Moved Assessment Cycle FY ${num} with ${yearDistributions.length} payouts to Recycle Bin`,
        oldValue: yearEntry,
        newValue: null,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    if (!bundledItem) {
      return res.status(404).json({ success: false, error: 'Year not found' });
    }
    res.json({ success: true, message: `FY ${num} moved to Recycle Bin`, data: bundledItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
