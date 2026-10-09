import { Router } from 'express';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { db } from '../config/db.js';

export const authRouter = Router();

// Helper to strip sensitive secrets from user responses
function safeUser(u) {
  if (!u) return null;
  const { twoFactorSecret, password, ...safe } = u;
  return safe;
}

// POST /api/auth/login (Secure email & password authentication)
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const store = db.getStore();
    const user = (store.users || []).find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Default password fallback for demo/seed data
    const expectedPassword = user.password || (
      user.role === 'cto' ? 'Akbar@123' :
      user.role === 'admin' ? 'Admin@123' :
      user.role === 'finance' ? 'Finance@123' : 'Auditor@123'
    );

    if (password !== expectedPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // If user has optional 2FA enabled, require the 6-digit Authenticator code
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res.json({
        success: true,
        requires2FA: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // Direct login success when 2FA is not enabled
    res.json({
      success: true,
      requires2FA: false,
      data: safeUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/change-password (User updates password from profile)
authRouter.post('/change-password', (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'User ID, current password, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    const store = db.getStore();
    const user = (store.users || []).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const expectedPassword = user.password || (
      user.role === 'cto' ? 'Akbar@123' :
      user.role === 'admin' ? 'Admin@123' :
      user.role === 'finance' ? 'Finance@123' : 'Auditor@123'
    );

    if (currentPassword !== expectedPassword) {
      return res.status(400).json({ success: false, error: 'Current password does not match' });
    }

    let updated = null;
    db.updateStore(s => {
      const idx = s.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        s.users[idx].password = newPassword;
        updated = s.users[idx];
      }

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: user.name,
        actionType: 'CHANGE_PASSWORD',
        entityName: 'users',
        recordId: user.id,
        description: `Password updated for ${user.name} (${user.email})`,
        oldValue: null,
        newValue: null,
        changedFields: [{ field: 'Password', from: '••••••', to: '••••••' }],
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      message: 'Password updated successfully!',
      data: safeUser(updated)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/disable-2fa (User unlinks / removes 2-Step Verification from profile)
authRouter.post('/disable-2fa', (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const store = db.getStore();
    const user = (store.users || []).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (password) {
      const expectedPassword = user.password || (
        user.role === 'cto' ? 'Akbar@123' :
        user.role === 'admin' ? 'Admin@123' :
        user.role === 'finance' ? 'Finance@123' : 'Auditor@123'
      );
      if (password !== expectedPassword) {
        return res.status(400).json({ success: false, error: 'Incorrect password. Cannot unlink 2-Step Verification.' });
      }
    }

    let updated = null;
    db.updateStore(s => {
      const idx = s.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        s.users[idx] = {
          ...s.users[idx],
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorConfiguredAt: null
        };
        updated = s.users[idx];
      }

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: user.name,
        actionType: 'DISABLE_2FA',
        entityName: 'users',
        recordId: user.id,
        description: `Unlinked and removed 2-Step Verification for ${user.name} (${user.email})`,
        oldValue: { twoFactorEnabled: true },
        newValue: { twoFactorEnabled: false },
        changedFields: [{ field: '2FA Status', from: 'Active (TOTP)', to: 'Disabled / Unlinked' }],
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      message: '2-Step Verification has been unlinked and removed successfully.',
      data: safeUser(updated)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/setup-2fa (Generate new TOTP secret & QR Code for Microsoft/Google Authenticator)
authRouter.post('/setup-2fa', async (req, res) => {
  try {
    const { userId } = req.body;
    const store = db.getStore();
    const user = (store.users || []).find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Generate RFC 6238 compliant Base32 Secret
    const secretObj = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secretObj.base32;

    const totp = new OTPAuth.TOTP({
      issuer: 'Al-Meezan Zakat',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretObj
    });

    const uri = totp.toString();
    const qrCode = await QRCode.toDataURL(uri, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        secret: secretBase32,
        uri,
        qrCode
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/verify-2fa (Activate 2FA after user scans and verifies initial 6-digit code)
authRouter.post('/verify-2fa', (req, res) => {
  try {
    const { userId, secret, token, userName } = req.body;
    if (!userId || !secret || !token) {
      return res.status(400).json({ success: false, error: 'User ID, Secret, and 6-digit Token are required' });
    }

    const store = db.getStore();
    const user = (store.users || []).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Al-Meezan Zakat',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });

    const delta = totp.validate({ token: String(token).trim(), window: 1 });
    if (delta === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 6-digit code. Please enter the current code from Microsoft or Google Authenticator.'
      });
    }

    let updatedUser = null;
    db.updateStore(s => {
      const idx = s.users.findIndex(u => u.id === userId);
      if (idx !== -1) {
        s.users[idx] = {
          ...s.users[idx],
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          twoFactorConfiguredAt: new Date().toISOString()
        };
        updatedUser = s.users[idx];
      }

      s.auditLogs.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userName: userName || user.name,
        actionType: 'ENABLE_2FA',
        entityName: 'users',
        recordId: user.id,
        description: `Enabled 2-Step Verification for ${user.name} (${user.email})`,
        oldValue: { twoFactorEnabled: false },
        newValue: { twoFactorEnabled: true },
        changedFields: [{ field: '2FA Status', from: 'Disabled', to: 'Active (TOTP)' }],
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      message: '2-Step Verification successfully enabled!',
      data: safeUser(updatedUser)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/validate-login-2fa (Validate 6-digit token on login)
authRouter.post('/validate-login-2fa', (req, res) => {
  try {
    const { userId, token } = req.body;
    const store = db.getStore();
    const user = (store.users || []).find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.json({ success: true, data: safeUser(user) });
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'Al-Meezan Zakat',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
    });

    const delta = totp.validate({ token: String(token).trim(), window: 1 });
    if (delta === null) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 6-digit Authenticator code. Please enter the current code from your app.'
      });
    }

    res.json({
      success: true,
      message: '2-Step Verification successful!',
      data: safeUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
