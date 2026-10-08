import express from 'express';
import cors from 'cors';
import { distributionRouter } from './routes/distributions.js';
import { beneficiaryRouter } from './routes/beneficiaries.js';
import { categoryRouter } from './routes/categories.js';
import { yearRouter } from './routes/years.js';
import { masterRouter } from './routes/masters.js';
import { auditRouter } from './routes/auditLogs.js';
import { recycleBinRouter } from './routes/recycleBin.js';
import { systemRouter } from './routes/system.js';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Zakat & Sadaqah Management Backend API',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/distributions', distributionRouter);
app.use('/api/beneficiaries', beneficiaryRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/years', yearRouter);
app.use('/api/masters', masterRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/recycle-bin', recycleBinRouter);
app.use('/api/system', systemRouter);

// Fallback 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});
