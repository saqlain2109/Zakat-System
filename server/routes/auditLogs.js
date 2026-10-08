import { Router } from 'express';
import { db } from '../config/db.js';

export const auditRouter = Router();

// GET /api/audit-logs
auditRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    const { recordId, entityName } = req.query;
    let list = store.auditLogs;

    if (recordId) {
      list = list.filter(l => String(l.recordId) === String(recordId));
    }
    if (entityName) {
      list = list.filter(l => l.entityName === entityName);
    }

    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit-logs/:recordId (Record Version History)
auditRouter.get('/:recordId', (req, res) => {
  try {
    const { recordId } = req.params;
    const store = db.getStore();
    const raw = store.auditLogs.filter(l => String(l.recordId) === String(recordId));

    // Deduplicate adjacent duplicates
    const deduped = [];
    for (let i = 0; i < raw.length; i++) {
      const cur = raw[i];
      const prev = deduped[deduped.length - 1];
      if (
        prev &&
        prev.actionType === cur.actionType &&
        Math.abs(new Date(prev.timestamp).getTime() - new Date(cur.timestamp).getTime()) < 3500
      ) {
        continue;
      }
      deduped.push(cur);
    }

    res.json({ success: true, count: deduped.length, data: deduped });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
