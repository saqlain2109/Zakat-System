import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'al_meezan_auth_session';

export const SYSTEM_ROLES = [
  { id: 'admin', label: 'Admin (Managing Trustee)', description: 'Full access to budgets, approvals, payouts, audit & masters' },
  { id: 'manager', label: 'Manager (Operations Lead)', description: 'Can approve requests, verify beneficiaries & record disbursements' },
  { id: 'verifier', label: 'Verifier (Field Officer)', description: 'Field audits, re-verifications, document checks & case notes' },
  { id: 'finance', label: 'Finance / Cashier', description: 'Record payments, 1-click status payouts & financial exports' },
  { id: 'viewer', label: 'Auditor (Read-Only Viewer)', description: 'Inspect reports, ledger & dashboards with no editing rights' },
];

const DEFAULT_USERS = [
  { id: 'usr-01', name: 'Akbar Sir', email: 'akbar@almeezan.org', role: 'admin' },
  { id: 'usr-02', name: 'Yasmeen Ansari', email: 'yasmeen@almeezan.org', role: 'manager' },
  { id: 'usr-03', name: 'Misbah Sherkhan', email: 'misbah@almeezan.org', role: 'verifier' },
  { id: 'usr-04', name: 'Farheen Accounts', email: 'finance@almeezan.org', role: 'finance' },
  { id: 'usr-05', name: 'External Auditor', email: 'audit@almeezan.org', role: 'viewer' },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USERS[0]; // Default to Akbar Sir (Admin)
  });

  const switchUser = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
  };

  const switchRole = (roleKey) => {
    const updated = {
      ...currentUser,
      role: roleKey
    };
    setCurrentUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
  };

  // Direct access: No approval bottlenecks or permissions roadblocks
  const permissions = {
    canDisburse: true,
    canVerify: true,
    canManageMasters: true,
    canDelete: true,
    canConfigureBudget: true,
    isReadOnly: false,
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers: DEFAULT_USERS,
        availableRoles: SYSTEM_ROLES,
        switchUser,
        switchRole,
        permissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
