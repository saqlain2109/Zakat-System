import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Smartphone,
  Trash2,
  Check
} from 'lucide-react';

export const UserProfileModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    changePassword,
    disable2FA,
    setIs2FASetupModalOpen,
    setTarget2FAUser
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | '2fa'

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  // Unlink 2FA State
  const [unlinkPassword, setUnlinkPassword] = useState('');
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkError, setUnlinkError] = useState('');
  const [unlinkSuccess, setUnlinkSuccess] = useState('');
  const [isUnlinking, setIsUnlinking] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPw(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res && res.success) {
        setPwSuccess('Password has been successfully updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwError(res?.error || 'Failed to update password.');
      }
    } catch (err) {
      setPwError(err.message || 'Error updating password.');
    } finally {
      setIsUpdatingPw(false);
    }
  };

  const handleUnlink2FA = async (e) => {
    e.preventDefault();
    setUnlinkError('');
    setUnlinkSuccess('');
    setIsUnlinking(true);

    try {
      const res = await disable2FA(unlinkPassword);
      if (res && res.success) {
        setUnlinkSuccess('2-Step Verification has been successfully unlinked and removed.');
        setShowUnlinkConfirm(false);
        setUnlinkPassword('');
      } else {
        setUnlinkError(res?.error || 'Failed to unlink 2-Step Verification.');
      }
    } catch (err) {
      setUnlinkError(err.message || 'Error unlinking 2-Step Verification.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'cto':
        return { label: 'Chief Technology Officer (CTO)', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'admin':
        return { label: 'System Administrator (Trustee)', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'finance':
        return { label: 'Finance & Accounts Officer', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'External Auditor (Read-Only)', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Account Profile & Security</span>
              </h3>
              <p className="text-slate-500 text-xs">
                Manage your credentials, password, and optional 2-Step Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Info</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setActiveTab('2fa')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === '2fa'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {currentUser.twoFactorEnabled ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>2-Step Verification</span>
            {currentUser.twoFactorEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Display Name</span>
                  <span className="font-bold text-slate-900 text-sm">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="font-mono text-slate-700">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Assigned Role</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">2-Step Verification</span>
                  <span className={`flex items-center gap-1 font-bold ${
                    currentUser.twoFactorEnabled ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {currentUser.twoFactorEnabled ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Active (Microsoft / Google Authenticator)</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                        <span>Optional (Not Enabled)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {currentUser.role === 'cto' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-900 text-[11px]">
                  <strong>CTO Authority:</strong> You have authorization privileges to approve or decline Finance payout requests.
                </div>
              )}
              {currentUser.role === 'finance' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-[11px]">
                  <strong>Finance Workflow:</strong> You can submit disbursements. Payout requests require CTO authorization before they can be marked as Paid.
                </div>
              )}
              {currentUser.role === 'admin' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-purple-900 text-[11px]">
                  <strong>Trustee Admin:</strong> You have system administration rights, including user management and resetting 2FA for users.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5 animate-fadeIn">
              {pwError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pr-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  New Password (min 6 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 pr-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingPw}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isUpdatingPw ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: 2-Step Verification (Optional / Opt-In & Unlink) */}
          {activeTab === '2fa' && (
            <div className="space-y-4 animate-fadeIn">
              {unlinkSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{unlinkSuccess}</span>
                </div>
              )}
              {unlinkError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{unlinkError}</span>
                </div>
              )}

              {currentUser.twoFactorEnabled ? (
                /* Already Enabled: Option to Unlink / Remove */
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm">
                        2-Step Verification is Active
                      </h4>
                      <p className="text-emerald-800 text-[11px]">
                        Your account is secured with Microsoft / Google Authenticator.
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    A 6-digit one-time code will be requested whenever you sign in to this account.
                  </p>

                  {!showUnlinkConfirm ? (
                    <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Need to remove or switch phones?
                      </span>
                      <button
                        onClick={() => setShowUnlinkConfirm(true)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Unlink / Remove 2FA</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleUnlink2FA} className="pt-3 border-t border-emerald-200/80 space-y-2.5 animate-fadeIn">
                      <div className="text-rose-800 font-bold text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Confirm Unlinking 2-Step Verification</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Please enter your account password to confirm removing 2-Step Verification:
                      </p>
                      <input
                        type="password"
                        value={unlinkPassword}
                        onChange={(e) => setUnlinkPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUnlinkConfirm(false);
                            setUnlinkPassword('');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUnlinking}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isUnlinking ? 'Unlinking...' : 'Confirm Unlink'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Not Configured: Option to Add */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        2-Step Verification (Optional)
                      </h4>
                      <p className="text-slate-500 text-[11px]">
                        Add an extra layer of protection using standard authenticator apps.
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Works seamlessly with <strong>Microsoft Authenticator</strong> and <strong>Google Authenticator</strong>.
                    When enabled, signing in will require your password plus a 6-digit code generated on your phone.
                  </p>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Status: <strong className="text-slate-700">Not Configured</strong>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        setTarget2FAUser(currentUser);
                        setIs2FASetupModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Set Up 2-Step Verification</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Shariah Audited Welfare Ledger • User Security
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
