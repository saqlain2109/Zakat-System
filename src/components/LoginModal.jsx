import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import * as OTPAuth from 'otpauth';
import {
  ShieldCheck,
  KeyRound,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  X,
  Smartphone
} from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const {
    users,
    currentUser,
    setSessionUser,
    setIs2FASetupModalOpen,
    setTarget2FAUser
  } = useAuth();

  const [selectedUser, setSelectedUser] = useState(users[0] || null);
  const [step, setStep] = useState('select'); // 'select' | '2fa'
  const [totpCode, setTotpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setErrorMsg('');
    setTotpCode('');

    if (u.twoFactorEnabled) {
      // Prompt for 6-digit Authenticator code
      setStep('2fa');
    } else {
      // Direct login and prompt 2FA setup
      setSessionUser(u);
      onClose();
      // Prompt to configure 2FA on first login
      setTarget2FAUser(u);
      setIs2FASetupModalOpen(true);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setErrorMsg('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      // 1. Validate with backend API
      const res = await api.validateLogin2FA({
        userId: selectedUser.id,
        token: totpCode.trim()
      });

      if (res && res.success) {
        setSessionUser(selectedUser);
        setIsVerifying(false);
        onClose();
        return;
      }
    } catch (err) {
      // 2. Client-side TOTP fallback validation
      if (selectedUser.twoFactorSecret) {
        try {
          const totp = new OTPAuth.TOTP({
            issuer: 'Al-Meezan Zakat',
            label: selectedUser.email,
            secret: OTPAuth.Secret.fromBase32(selectedUser.twoFactorSecret)
          });
          const delta = totp.validate({ token: totpCode.trim(), window: 1 });
          if (delta !== null) {
            setSessionUser(selectedUser);
            setIsVerifying(false);
            onClose();
            return;
          }
        } catch (e) {
          console.warn('TOTP validation exception:', e);
        }
      }
      setErrorMsg(err.message || 'Incorrect 6-digit code from Microsoft or Google Authenticator.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {step === '2fa' ? '2-Step Verification' : 'Select Account'}
              </h3>
              <p className="text-xs text-slate-500">
                {step === '2fa' ? 'Enter Microsoft / Google Authenticator Code' : 'Switch active role & identity'}
              </p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Choose an account to continue. Users with 2-Step Verification enabled will be prompted for their one-time authenticator code.
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {users.map(u => {
                  const isCurrent = currentUser?.id === u.id;
                  const isCTO = u.role === 'cto';
                  const isAdmin = u.role === 'admin';
                  const isFinance = u.role === 'finance';

                  return (
                    <div
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/60'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCTO
                            ? 'bg-amber-100 text-amber-800'
                            : isAdmin
                            ? 'bg-purple-100 text-purple-800'
                            : isFinance
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isCTO
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isAdmin
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isFinance
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>

                        {u.twoFactorEnabled ? (
                          <span
                            className="p-1 rounded text-emerald-600 bg-emerald-50"
                            title="2FA Active"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span
                            className="p-1 rounded text-slate-300"
                            title="2FA Not Enabled"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step: 2FA Verification */
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Authenticating as:</span>
                  <strong className="text-slate-800 font-bold">{selectedUser.name}</strong>
                  <span className="text-slate-500 text-[11px] block">{selectedUser.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Change
                </button>
              </div>

              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Open Microsoft or Google Authenticator
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Enter the 6-digit one-time code shown in your Authenticator app for <strong>Al-Meezan Zakat</strong>.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.35em] font-mono text-2xl font-bold bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900"
                />

                {errorMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2 justify-center">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isVerifying || totpCode.length !== 6}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
