import { Router } from 'express';
import { db } from '../config/db.js';

export const userRouter = Router();

// Helper to strip sensitive secrets
function safeUser(u) {
  if (!u) return null;
  const { twoFactorSecret, ...safe } = u;
  return safe;
}

// GET /api/users (List all users)
userRouter.get('/', (req, res) => {
  try {
    const store = db.getStore();
    const users = (store.users || []).map(safeUser);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users (Create new user - Admin Only)
userRouter.post('/', (req, res) => {
  try {
    const { name, email, role, adminName } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'Name, Email and Role are required' });
    }

    const store = db.getStore();
    const existing = (store.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this email address already exists' });
    }

    const newUser = {
      id: `usr-${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.toLowerCase(), // 'admin' | 'cto' | 'finance' | 'viewer'
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfiguredAt: null,
      createdAt: new Date().toISOString()
    };

    db.updateStore(s => {
      s.users = s.users || [];
      s.users.push(newUser);

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: adminName || 'Admin',
        actionType: 'CREATE_USER',
        entityName: 'users',
        recordId: newUser.id,
        description: `Created user ${newUser.name} with role [${newUser.role.toUpperCase()}]`,
        oldValue: null,
        newValue: safeUser(newUser),
        changedFields: [
          { field: 'Name', from: '—', to: newUser.name },
          { field: 'Email', from: '—', to: newUser.email },
          { field: 'Role', from: '—', to: newUser.role }
        ],
        timestamp: new Date().toISOString()
      });
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: safeUser(newUser) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id (Update user - Admin Only)
userRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, adminName } = req.body;
    let saved = null;

    db.updateStore(s => {
      const idx = (s.users || []).findIndex(u => u.id === id);
      if (idx === -1) return;

      const current = s.users[idx];
      const changedFields = [];
      if (name && current.name !== name) changedFields.push({ field: 'Name', from: current.name, to: name });
      if (email && current.email !== email) changedFields.push({ field: 'Email', from: current.email, to: email });
      if (role && current.role !== role) changedFields.push({ field: 'Role', from: current.role, to: role });

      s.users[idx] = {
        ...current,
        name: name !== undefined ? name.trim() : current.name,
        email: email !== undefined ? email.trim().toLowerCase() : current.email,
        role: role !== undefined ? role.toLowerCase() : current.role,
        updatedAt: new Date().toISOString()
      };
      saved = s.users[idx];

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: adminName || 'Admin',
        actionType: 'UPDATE_USER',
        entityName: 'users',
        recordId: id,
        description: `Updated profile for ${saved.name}`,
        oldValue: safeUser(current),
        newValue: safeUser(saved),
        changedFields,
        timestamp: new Date().toISOString()
      });
    });

    if (!saved) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User updated successfully', data: safeUser(saved) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users/:id/reset-2fa (Admin resets/removes 2FA for a user so they can re-register on a new phone)
userRouter.post('/:id/reset-2fa', (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;
    let resetUser = null;

    db.updateStore(s => {
      const idx = (s.users || []).findIndex(u => u.id === id);
      if (idx === -1) return;

      const current = s.users[idx];
      s.users[idx] = {
        ...current,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfiguredAt: null,
        twoFactorResetAt: new Date().toISOString()
      };
      resetUser = s.users[idx];

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: adminName || 'Admin',
        actionType: 'RESET_2FA',
        entityName: 'users',
        recordId: id,
        description: `Reset 2-Step Verification for ${current.name}. User will be prompted to configure fresh 2FA.`,
        oldValue: { twoFactorEnabled: current.twoFactorEnabled },
        newValue: { twoFactorEnabled: false },
        changedFields: [{ field: '2FA Status', from: 'Active', to: 'Reset / Removed' }],
        timestamp: new Date().toISOString()
      });
    });

    if (!resetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      message: `2-Step Verification for ${resetUser.name} has been reset. They can scan a new QR code on next login.`,
      data: safeUser(resetUser)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id (Delete user)
userRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.body;
    let deleted = null;

    db.updateStore(s => {
      const idx = (s.users || []).findIndex(u => u.id === id);
      if (idx === -1) return;
      deleted = s.users[idx];
      s.users.splice(idx, 1);

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: adminName || 'Admin',
        actionType: 'DELETE_USER',
        entityName: 'users',
        recordId: id,
        description: `Deleted user ${deleted.name} (${deleted.email})`,
        oldValue: safeUser(deleted),
        newValue: null,
        changedFields: [],
        timestamp: new Date().toISOString()
      });
    });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully', data: safeUser(deleted) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
