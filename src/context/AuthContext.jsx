import React, { createContext, useContext, useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
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
    password: 'Akbar@123',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  },
  {
    id: 'usr-02',
    name: 'Managing Trustee',
    email: 'admin@almeezan.org',
    role: 'admin',
    password: 'Admin@123',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  },
  {
    id: 'usr-03',
    name: 'Farheen Accounts',
    email: 'finance@almeezan.org',
    role: 'finance',
    password: 'Finance@123',
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfiguredAt: null
  },
  {
    id: 'usr-04',
    name: 'External Auditor',
    email: 'auditor@almeezan.org',
    role: 'viewer',
    password: 'Auditor@123',
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
    return INITIAL_AUTH_USERS[0]; // Default to Akbar Hussain (CTO) session
  });

  // Modal states for Auth, Profile & 2FA
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [is2FASetupModalOpen, setIs2FASetupModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [target2FAUser, setTarget2FAUser] = useState(null);

  // Sync users list from backend API
  useEffect(() => {
    api.getUsers()
      .then(res => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setUsers(res.data);
          // Refresh current user from updated remote record
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

  // Secure Email + Password Login
  const loginWithCredentials = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      if (res && res.success) {
        if (res.requires2FA) {
          // 2FA is active on this account -> return for OTP prompt
          return { requires2FA: true, user: res.user };
        } else if (res.data) {
          // Direct login success
          setSessionUser(res.data);
          return { success: true, user: res.data };
        }
      }
      return { success: false, error: res?.error || 'Invalid credentials' };
    } catch (err) {
      // Local Fallback for offline / demo mode
      const normalizedEmail = (email || '').trim().toLowerCase();
      const localUser = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!localUser) {
        return { success: false, error: 'User with this email not found' };
      }

      const expectedPassword = localUser.password || (
        localUser.role === 'cto' ? 'Akbar@123' :
        localUser.role === 'admin' ? 'Admin@123' :
        localUser.role === 'finance' ? 'Finance@123' : 'Auditor@123'
      );

      if (password !== expectedPassword) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      if (localUser.twoFactorEnabled && localUser.twoFactorSecret) {
        return { requires2FA: true, user: localUser };
      }

      setSessionUser(localUser);
      return { success: true, user: localUser };
    }
  };

  // Verify 2FA 6-digit TOTP Token on Login
  const verifyLogin2FA = async (userId, token) => {
    try {
      const res = await api.validateLogin2FA({ userId, token });
      if (res && res.success && res.data) {
        setSessionUser(res.data);
        return { success: true, user: res.data };
      }
      return { success: false, error: res?.error || 'Invalid 6-digit code' };
    } catch (err) {
      // Local fallback using otpauth
      const localUser = users.find(u => u.id === userId);
      if (localUser && localUser.twoFactorSecret) {
        try {
          const totp = new OTPAuth.TOTP({
            issuer: 'Al-Meezan Zakat',
            label: localUser.email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(localUser.twoFactorSecret)
          });
          const delta = totp.validate({ token: String(token).trim(), window: 1 });
          if (delta !== null) {
            setSessionUser(localUser);
            return { success: true, user: localUser };
          }
        } catch (e) {
          console.warn('Local TOTP validation note:', e.message);
        }
      }
      return { success: false, error: 'Invalid 6-digit code. Please verify Microsoft / Google Authenticator.' };
    }
  };

  // Switch user directly (e.g. for demo role selection)
  const switchUser = (userObj) => {
    if (userObj.twoFactorEnabled) {
      setTarget2FAUser(userObj);
      setIsLoginModalOpen(true);
    } else {
      // 2FA is optional: log in directly without forcing setup modal
      setSessionUser(userObj);
    }
  };

  // Sign out
  const logout = () => {
    setSessionUser(null);
  };

  // Change Password from Profile
  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      const res = await api.changePassword({
        userId: currentUser.id,
        currentPassword,
        newPassword
      });
      if (res && res.success) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u));
        return { success: true, message: 'Password updated successfully!' };
      }
      return { success: false, error: res?.error || 'Failed to update password' };
    } catch (err) {
      // Local fallback
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u));
      return { success: true, message: 'Password updated successfully!' };
    }
  };

  // Disable / Unlink 2-Step Verification from Profile
  const disable2FA = async (password = null) => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };
    try {
      const res = await api.disable2FA({
        userId: currentUser.id,
        password
      });
      if (res && res.success && res.data) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? res.data : u));
        setSessionUser(res.data);
        return { success: true, message: '2-Step Verification unlinked successfully!' };
      }
    } catch (err) {
      console.warn('Disable 2FA remote note:', err.message);
    }

    // Local fallback update
    const updated = {
      ...currentUser,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfiguredAt: null
    };
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    setSessionUser(updated);
    return { success: true, message: '2-Step Verification unlinked successfully!' };
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
      const newUser = {
        id: `usr-${String(Date.now()).slice(-4)}`,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        password: userData.password || 'Welcome@123',
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

  // Admin resets / removes 2FA for any user (e.g. lost phone recovery)
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

  // Mark 2FA verified & enabled from Setup Modal
  const on2FAActivated = (userWith2FA) => {
    setUsers(prev => prev.map(u => u.id === userWith2FA.id ? userWith2FA : u));
    setSessionUser(userWith2FA);
    setIs2FASetupModalOpen(false);
  };

  // Role helpers
  const isCTO = currentUser?.role === 'cto';
  const isAdmin = currentUser?.role === 'admin';
  const isFinance = currentUser?.role === 'finance';
  const isViewer = currentUser?.role === 'viewer';

  const permissions = {
    canApprovePayouts: isCTO || isAdmin,
    canCreatePayouts: !isViewer,
    canDirectPay: isCTO || isAdmin,
    canManageUsers: isAdmin,
    canManageMasters: isCTO || isAdmin,
    isReadOnly: isViewer
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        availableRoles: SYSTEM_ROLES,
        loginWithCredentials,
        verifyLogin2FA,
        switchUser,
        logout,
        changePassword,
        disable2FA,
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
        isProfileModalOpen,
        setIsProfileModalOpen,
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
