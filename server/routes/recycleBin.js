import { Router } from 'express';
import { db } from '../config/db.js';

export const recycleBinRouter = Router();

// GET /api/recycle-bin
recycleBinRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    res.json({ success: true, count: store.recycleBin.length, data: store.recycleBin });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/recycle-bin/:id/restore
recycleBinRouter.post('/:id/restore', (req, res) => {
  try {
    const { id } = req.params;
    const userName = req.body.userName || 'Admin';
    let restoredItem = null;

    db.updateStore(store => {
      const item = store.recycleBin.find(r => r.id === id);
      if (!item) return;

      restoredItem = item;

      if (item.itemType === 'year') {
        if (item.yearData && !store.zakatYears.some(y => y.year === item.yearNumber)) {
          store.zakatYears.unshift(item.yearData);
          store.zakatYears.sort((a, b) => b.year - a.year);
        }
        if (item.distributionsData && item.distributionsData.length > 0) {
          const existingIds = new Set(store.distributions.map(d => d.id));
          const newToAdd = item.distributionsData.filter(d => !existingIds.has(d.id));
          store.distributions.unshift(...newToAdd);
        }
        store.auditLogs.unshift({
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userName,
          actionType: 'RESTORE_YEAR',
          entityName: 'zakat_years',
          recordId: `yr-${item.yearNumber}`,
          description: `Restored Assessment Year ${item.yearNumber} and ${item.count} transactions from Recycle Bin`,
          oldValue: null,
          newValue: item.yearData,
          changedFields: [],
          timestamp: new Date().toISOString()
        });
      } else if (item.itemType === 'distribution') {
        if (item.data) {
          store.distributions = store.distributions.filter(d => d.id !== item.data.id);
          store.distributions.unshift(item.data);
          store.auditLogs.unshift({
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userName,
            actionType: 'RESTORE_DISBURSEMENT',
            entityName: 'disbursements',
            recordId: item.data.id,
            description: `Restored payment for ${item.title} from Recycle Bin`,
            oldValue: null,
            newValue: item.data,
            changedFields: [],
            timestamp: new Date().toISOString()
          });
        }
      } else if (item.itemType === 'beneficiary') {
        if (item.data) {
          store.beneficiaries = store.beneficiaries.filter(b => b.id !== item.data.id);
          store.beneficiaries.unshift(item.data);
          store.auditLogs.unshift({
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userName,
            actionType: 'RESTORE_BENEFICIARY',
            entityName: 'beneficiaries',
            recordId: item.data.id,
            description: `Restored beneficiary ${item.title} from Recycle Bin`,
            oldValue: null,
            newValue: item.data,
            changedFields: [],
            timestamp: new Date().toISOString()
          });
        }
      }

      store.recycleBin = store.recycleBin.filter(r => r.id !== id);
    });

    if (!restoredItem) {
      return res.status(404).json({ success: false, error: 'Item not found in Recycle Bin' });
    }
    res.json({ success: true, message: 'Item restored successfully', data: restoredItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/recycle-bin/:id (Permanent Delete)
recycleBinRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let target = null;
    db.updateStore(s => {
      target = s.recycleBin.find(r => r.id === id);
      s.recycleBin = s.recycleBin.filter(r => r.id !== id);
    });
    if (!target) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, message: 'Item permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/recycle-bin (Empty Bin)
recycleBinRouter.delete('/', (req, res) => {
  try {
    db.updateStore(s => { s.recycleBin = []; });
    res.json({ success: true, message: 'Recycle Bin emptied' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
