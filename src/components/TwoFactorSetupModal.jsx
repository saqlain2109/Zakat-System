import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  QrCode,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Smartphone,
  Lock
} from 'lucide-react';

export const TwoFactorSetupModal = ({ isOpen, onClose }) => {
  const { target2FAUser, currentUser, on2FAActivated } = useAuth();
  const user = target2FAUser || currentUser;

  const [loading, setLoading] = useState(true);
  const [qrCodeData, setQrCodeData] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      setTokenInput('');

      // Request 2FA setup details from Backend API or generate client-side
      api.setup2FA(user.id)
        .then(res => {
          if (res && res.success && res.data) {
            setQrCodeData(res.data.qrCode);
            setSecretKey(res.data.secret);
            setLoading(false);
          }
        })
        .catch(async () => {
          // Client-side fallback generation
          try {
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
            const qrUrl = await QRCode.toDataURL(totp.toString(), {
              width: 220,
              margin: 2,
              color: { dark: '#0f172a', light: '#ffffff' }
            });
            setQrCodeData(qrUrl);
            setSecretKey(secretBase32);
            setLoading(false);
          } catch (e) {
            setErrorMsg('Failed to initialize QR code setup');
            setLoading(false);
          }
        });
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleCopyKey = () => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!tokenInput || tokenInput.trim().length !== 6) {
      setErrorMsg('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      // 1. Try Backend API
      const res = await api.verify2FA({
        userId: user.id,
        secret: secretKey,
        token: tokenInput.trim(),
        userName: user.name
      });

      if (res && res.success && res.data) {
        setSuccessMsg('2-Step Verification activated successfully!');
        setTimeout(() => {
          on2FAActivated(res.data);
          onClose();
        }, 1200);
        return;
      }
    } catch (err) {
      // 2. Client-side TOTP validation fallback
      try {
        const totp = new OTPAuth.TOTP({
          issuer: 'Al-Meezan Zakat',
          label: user.email,
          secret: OTPAuth.Secret.fromBase32(secretKey)
        });
        const delta = totp.validate({ token: tokenInput.trim(), window: 1 });
        if (delta !== null) {
          const updatedUser = {
            ...user,
            twoFactorEnabled: true,
            twoFactorSecret: secretKey,
            twoFactorConfiguredAt: new Date().toISOString()
          };
          setSuccessMsg('2-Step Verification activated successfully!');
          setTimeout(() => {
            on2FAActivated(updatedUser);
            onClose();
          }, 1200);
          return;
        } else {
          setErrorMsg('Invalid 6-digit code. Check Microsoft or Google Authenticator.');
        }
      } catch (clientErr) {
        setErrorMsg('Invalid 6-digit code. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                2-Step Verification Setup
              </h3>
              <p className="text-xs text-slate-500">
                Microsoft Authenticator & Google Authenticator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* User info callout */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
            <div>
              <span className="text-blue-600 block text-[10px] font-semibold uppercase">Configuring Account:</span>
              <span className="font-bold">{user.name}</span> <span className="text-blue-700">({user.email})</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-800 uppercase">
              {user.role}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Generating secure 2FA QR code...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Scan QR Code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Scan QR Code in Microsoft or Google Authenticator</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  {qrCodeData && (
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                      <img
                        src={qrCodeData}
                        alt="2FA QR Code"
                        className="w-36 h-36 object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-slate-600">
                    <p className="leading-relaxed">
                      Open <strong>Microsoft Authenticator</strong>, <strong>Google Authenticator</strong>, or any TOTP app on your smartphone, tap <strong>"+"</strong>, and scan the QR code.
                    </p>
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-400 block mb-1">Cannot scan? Enter setup key manually:</span>
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-800">
                        <span className="truncate flex-1 font-bold">{secretKey}</span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copy Key"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Enter 6-digit Code */}
              <form onSubmit={handleVerify} className="space-y-3 pt-1">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Enter the 6-Digit Code from Authenticator</span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full text-center tracking-[0.35em] font-mono text-xl sm:text-2xl font-bold bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900"
                  />

                  {errorMsg && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Skip for Now
                  </button>

                  <button
                    type="submit"
                    disabled={isVerifying || tokenInput.length !== 6}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Activate 2-Step Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
