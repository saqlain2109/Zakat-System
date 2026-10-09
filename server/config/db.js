import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import {
  INITIAL_ASSETS,
  INITIAL_CATEGORIES,
  INITIAL_FUNDING_ACCOUNTS,
  INITIAL_REFERENCE_PERSONS,
  INITIAL_BENEFICIARIES,
  INITIAL_DISTRIBUTIONS_2026,
  INITIAL_ZAKAT_YEARS,
  MULTI_YEAR_ARCHIVE
} from '../../src/data/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.resolve(DATA_DIR, 'store.json');

// Initialize Default Users
export const INITIAL_USERS = [
  {
    id: 'usr-01',
    name: 'Akbar Hussain',
    email: 'akbar@almeezan.org',
    role: 'cto',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-02',
    name: 'Managing Trustee',
    email: 'admin@almeezan.org',
    role: 'admin',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-03',
    name: 'Farheen Accounts',
    email: 'finance@almeezan.org',
    role: 'finance',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-04',
    name: 'External Auditor',
    email: 'auditor@almeezan.org',
    role: 'viewer',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// Initialize Memory/File Store
let memStore = null;

function getInitialState() {
  return {
    users: [...INITIAL_USERS],
    assets: [...INITIAL_ASSETS],
    categories: [...INITIAL_CATEGORIES],
    fundingAccounts: [...INITIAL_FUNDING_ACCOUNTS],
    referencePersons: [...INITIAL_REFERENCE_PERSONS],
    beneficiaries: [...INITIAL_BENEFICIARIES],
    distributions: INITIAL_DISTRIBUTIONS_2026.map(d => ({
      ...d,
      approvalStatus: d.approvalStatus || 'Approved',
      approvedBy: d.approvedBy || 'Akbar Hussain (CTO)',
      approvedAt: d.approvedAt || '2026-01-15T10:00:00.000Z'
    })),
    zakatYears: [...INITIAL_ZAKAT_YEARS],
    multiYearArchive: [...MULTI_YEAR_ARCHIVE],
    auditLogs: [],
    recycleBin: [],
    customAnnualBudget: null
  };
}

function loadFileStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = [...INITIAL_USERS];
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[DB] Warning loading store.json, using in-memory store:', err.message);
  }
  const init = getInitialState();
  saveFileStore(init);
  return init;
}

function saveFileStore(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // In Vercel serverless environment, filesystem is read-only outside /tmp
    console.warn('[DB] Could not write to disk (read-only environment):', err.message);
  }
}

// PostgreSQL Client Pool (if DATABASE_URL is configured in environment)
let pgPool = null;
if (process.env.DATABASE_URL) {
  try {
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    console.log('[DB] Connected to PostgreSQL via DATABASE_URL');
  } catch (err) {
    console.error('[DB] PostgreSQL connection error:', err.message);
  }
}

export const db = {
  isPostgres: () => !!pgPool,

  getStore: () => {
    if (!memStore) {
      memStore = loadFileStore();
    }
    return memStore;
  },

  updateStore: (updater) => {
    if (!memStore) {
      memStore = loadFileStore();
    }
    updater(memStore);
    saveFileStore(memStore);
    return memStore;
  },

  resetStore: () => {
    memStore = getInitialState();
    saveFileStore(memStore);
    return memStore;
  },

  // Direct PostgreSQL query helper if needed
  query: async (text, params) => {
    if (pgPool) {
      return pgPool.query(text, params);
    }
    throw new Error('PostgreSQL is not configured. Using file-based JSON store.');
  }
};
