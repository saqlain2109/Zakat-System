import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'al_meezan_auth_session';

export const SYSTEM_ROLES = [
  {
    id: 'cto',
    label: 'CTO (Akbar Hussain)',
    description: 'Full access to all menus, create disbursements, and exclusive authority to Authorize/Reject Finance payout requests.'
  },
  {
    id: 'admin',
    label: 'Admin (Managing Trustee)',
    description: 'Full administrative access, user directory management, and authority to Reset / Remove user 2-Step Verification.'
  },
  {
    id: 'finance',
    label: 'Finance / Accounts (Farheen)',
    description: 'Create new payout requests. Payouts require CTO authorization before funds can be marked as Paid.'
  },
  {
    id: 'viewer',
    label: 'Auditor (Read-Only Viewer)',
    description: 'Inspect reports, audit trails, and ledgers with read-only access.'
  }
];

export const INITIAL_AUTH_USERS = [
  {
    id: 'usr-01',
    name: 'Akbar Hussain',
    email: 'akbar@almeezan.org',
    role: 'cto',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  },
  {
    id: 'usr-02',
    name: 'Managing Trustee',
    email: 'admin@almeezan.org',
    role: 'admin',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  },
  {
    id: 'usr-03',
    name: 'Farheen Accounts',
    email: 'finance@almeezan.org',
    role: 'finance',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  },
  {
    id: 'usr-04',
    name: 'External Auditor',
    email: 'auditor@almeezan.org',
    role: 'viewer',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(INITIAL_AUTH_USERS);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Auth local read note:', e.message);
    }
    return INITIAL_AUTH_USERS[0]; // Default to Akbar Hussain (CTO)
  });

  // Modal states for Auth & 2FA
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [is2FASetupModalOpen, setIs2FASetupModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [target2FAUser, setTarget2FAUser] = useState(null);

  // Sync users list from backend API
  useEffect(() => {
    api.getUsers()
      .then(res => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setUsers(res.data);
          // Update current user if updated in backend
          if (currentUser) {
            const freshCurrent = res.data.find(u => u.id === currentUser.id);
            if (freshCurrent) {
              setCurrentUser(freshCurrent);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(freshCurrent));
            }
          }
        }
      })
      .catch(err => {
        console.info('[Auth] Using local users store:', err.message);
      });
  }, []);

  // Save current user to session storage
  const setSessionUser = (userObj) => {
    setCurrentUser(userObj);
    if (userObj) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  // Switch / Login user
  const switchUser = (userObj) => {
    // If user has 2FA enabled, prompt for code verification
    if (userObj.twoFactorEnabled) {
      setTarget2FAUser(userObj);
      setIsLoginModalOpen(true);
    } else {
      // First-time login without 2FA -> log in and prompt to set up 2FA
      setSessionUser(userObj);
      setTarget2FAUser(userObj);
      setIs2FASetupModalOpen(true);
    }
  };

  const logout = () => {
    setSessionUser(null);
    setIsLoginModalOpen(true);
  };

  // Admin user management methods
  const addUser = async (userData) => {
    try {
      const res = await api.createUser({
        ...userData,
        adminName: currentUser?.name || 'Admin'
      });
      if (res && res.success && res.data) {
        setUsers(prev => [...prev, res.data]);
        return res.data;
      }
    } catch (err) {
      // Local fallback
      const newUser = {
        id: `usr-${String(Date.now()).slice(-4)}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfiguredAt: null,
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      return newUser;
    }
  };

  const updateUser = async (id, updatedData) => {
    try {
      const res = await api.updateUser(id, {
        ...updatedData,
        adminName: currentUser?.name || 'Admin'
      });
      if (res && res.success && res.data) {
        setUsers(prev => prev.map(u => u.id === id ? res.data : u));
        if (currentUser?.id === id) {
          setSessionUser(res.data);
        }
        return res.data;
      }
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.deleteUser(id, currentUser?.name || 'Admin');
    } catch (e) {
      console.warn('Delete user backend note:', e.message);
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUser?.id === id) {
      setSessionUser(users.find(u => u.id !== id) || null);
    }
  };

  // Admin resets / removes 2FA for a user
  const resetUser2FA = async (userId) => {
    try {
      const res = await api.resetUser2FA(userId, currentUser?.name || 'Admin');
      if (res && res.success && res.data) {
        setUsers(prev => prev.map(u => u.id === userId ? res.data : u));
        if (currentUser?.id === userId) {
          setSessionUser(res.data);
        }
        return true;
      }
    } catch (err) {
      console.warn('Reset 2FA backend note:', err.message);
    }
    // Fallback local reset
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorConfiguredAt: null
        };
      }
      return u;
    }));
    if (currentUser?.id === userId) {
      setSessionUser({
        ...currentUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfiguredAt: null
      });
    }
    return true;
  };

  // Mark 2FA verified & enabled for current user
  const on2FAActivated = (userWith2FA) => {
    setUsers(prev => prev.map(u => u.id === userWith2FA.id ? userWith2FA : u));
    setSessionUser(userWith2FA);
    setIs2FASetupModalOpen(false);
  };

  // Permissions helpers
  const isCTO = currentUser?.role === 'cto';
  const isAdmin = currentUser?.role === 'admin';
  const isFinance = currentUser?.role === 'finance';
  const isViewer = currentUser?.role === 'viewer';

  const permissions = {
    canApprovePayouts: isCTO || isAdmin, // CTO has authorization authority
    canCreatePayouts: !isViewer,
    canDirectPay: isCTO || isAdmin, // Only CTO/Admin can mark unapproved payouts as Paid directly
    canManageUsers: isAdmin, // Only Admin can add/edit users and reset 2FA
    canManageMasters: isCTO || isAdmin,
    isReadOnly: isViewer
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        availableRoles: SYSTEM_ROLES,
        switchUser,
        logout,
        setSessionUser,
        addUser,
        updateUser,
        deleteUser,
        resetUser2FA,
        permissions,
        isCTO,
        isAdmin,
        isFinance,
        isViewer,
        // Modals
        isLoginModalOpen,
        setIsLoginModalOpen,
        is2FASetupModalOpen,
        setIs2FASetupModalOpen,
        isUserManagementModalOpen,
        setIsUserManagementModalOpen,
        target2FAUser,
        setTarget2FAUser,
        on2FAActivated
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
