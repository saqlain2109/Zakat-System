import { Router } from 'express';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { db } from '../config/db.js';

export const authRouter = Router();

// Helper to strip sensitive secrets from user responses
function safeUser(u) {
  if (!u) return null;
  const { twoFactorSecret, ...safe } = u;
  return safe;
}

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
