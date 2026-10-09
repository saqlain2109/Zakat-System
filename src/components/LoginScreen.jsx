import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Coins,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const LoginScreen = () => {
  const {
    users,
    loginWithCredentials,
    verifyLogin2FA
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 2FA Verification Step State
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await loginWithCredentials(email, password);
      if (result.requires2FA) {
        setPendingUser(result.user);
        setIs2FAStep(true);
        setTotpCode('');
      } else if (!result.success) {
        setErrorMsg(result.error || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!totpCode || totpCode.trim().length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code.');
      return;
    }

    setErrorMsg('');
    setIsVerifying2FA(true);

    try {
      const result = await verifyLogin2FA(pendingUser.id, totpCode.trim());
      if (!result.success) {
        setErrorMsg(result.error || 'Invalid 6-digit code. Please check your Authenticator app.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleQuickSelect = (u) => {
    const pw = u.password || (
      u.role === 'cto' ? 'Akbar@123' :
      u.role === 'admin' ? 'Admin@123' :
      u.role === 'finance' ? 'Finance@123' : 'Auditor@123'
    );
    setEmail(u.email);
    setPassword(pw);
    setErrorMsg('');
    setIs2FAStep(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Glow Decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/40 mb-1">
            <Coins className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Al-Meezan Zakat System
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Welfare & Education Fund • 2.5% Shariah Compliant Audited Accounting
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-950/80 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {!is2FAStep ? (
            /* STEP 1: Email & Password Credentials */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Account Sign In
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secure Session</span>
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@almeezan.org"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: 2-Step Verification (Only if user has 2FA enabled) */
            <form onSubmit={handle2FASubmit} className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  <span>2-Step Verification</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {pendingUser?.name}
                </span>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
                <p className="font-semibold text-white">
                  Enter 6-Digit Authenticator Code
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open <strong>Microsoft Authenticator</strong> or <strong>Google Authenticator</strong> on your phone and enter the live 6-digit code.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl py-3 text-center text-2xl font-mono tracking-widest text-emerald-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIs2FAStep(false);
                    setErrorMsg('');
                    setTotpCode('');
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isVerifying2FA || totpCode.length !== 6}
                  className="flex-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{isVerifying2FA ? 'Validating...' : 'Verify & Continue'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Accounts Selection */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Quick Access Accounts (Click to auto-fill):</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {users.map(u => {
                const isSelected = email.toLowerCase() === u.email.toLowerCase();
                const roleBadge = u.role === 'cto' ? 'CTO Approver' :
                  u.role === 'admin' ? 'Trustee Admin' :
                  u.role === 'finance' ? 'Finance Team' : 'Auditor (Read-Only)';

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold truncate text-[11px]">{u.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-blue-400 font-semibold">{roleBadge}</span>
                      {u.twoFactorEnabled && (
                        <span className="text-[9px] text-emerald-400 flex items-center gap-0.5" title="2FA Active">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>2FA</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-500">
          Al-Meezan Trust Accounting System • End-to-End Audited
        </div>
      </div>
    </div>
  );
};
