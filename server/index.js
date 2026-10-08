import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Zakat & Sadaqah Management System - Backend Server  `);
  console.log(`  Live at: http://localhost:${PORT}/api                `);
  console.log(`  Health Check: http://localhost:${PORT}/api/health     `);
  console.log(`=======================================================`);
});
