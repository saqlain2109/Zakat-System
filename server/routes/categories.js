import { Router } from 'express';
import { db } from '../config/db.js';

export const categoryRouter = Router();

// GET /api/categories
categoryRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    res.json({ success: true, count: store.categories.length, data: store.categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/categories
categoryRouter.post('/', (req, res) => {
  try {
    const cat = req.body;
    if (!cat.name) {
      return res.status(400).json({ success: false, error: 'Category Name is required' });
    }

    const store = db.getStore();
    const nextNum = store.categories.length + 1;
    const newId = `CAT-${String(nextNum).padStart(2, '0')}`;

    const newCat = {
      id: newId,
      name: cat.name,
      fundType: cat.fundType || 'Zakat (Mandatory)',
      isEligible25Pool: cat.isEligible25Pool !== false,
      plannedBudget: Number(cat.plannedBudget) || 0,
      defaultAccountId: cat.defaultAccountId || 'ACC-01',
      defaultAccountName: cat.defaultAccountName || 'Employees acc',
      description: cat.description || ''
    };

    db.updateStore(s => {
      s.categories.push(newCat);
      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: cat.userName || 'Admin',
        actionType: 'CREATE_CATEGORY',
        entityName: 'categories',
        recordId: newId,
        description: `Created category ${newCat.name}`,
        oldValue: null,
        newValue: newCat,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    res.status(201).json({ success: true, data: newCat });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/categories/:id
categoryRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = req.body;
    let saved = null;

    db.updateStore(store => {
      const idx = store.categories.findIndex(c => c.id === id);
      if (idx === -1) return;

      const current = store.categories[idx];
      saved = {
        ...current,
        name: updated.name || current.name,
        plannedBudget: Number(updated.plannedBudget) !== undefined ? Number(updated.plannedBudget) : current.plannedBudget,
        fundType: updated.fundType || current.fundType,
        isEligible25Pool: updated.isEligible25Pool !== undefined ? updated.isEligible25Pool : current.isEligible25Pool,
        defaultAccountId: updated.defaultAccountId || current.defaultAccountId,
        defaultAccountName: updated.defaultAccountName || current.defaultAccountName,
        description: updated.description !== undefined ? updated.description : current.description
      };
      store.categories[idx] = saved;

      store.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: req.body.userName || 'Admin',
        actionType: 'UPDATE_CATEGORY',
        entityName: 'categories',
        recordId: id,
        description: `Updated budget/details for ${saved.name}`,
        oldValue: current,
        newValue: saved,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    if (!saved) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
