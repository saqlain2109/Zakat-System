import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  RotateCcw,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Check,
  Lock,
  Mail,
  User,
  Search,
  KeyRound,
  Info
} from 'lucide-react';

export const UserManagementModal = ({ isOpen, onClose }) => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    resetUser2FA,
    availableRoles
  } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'finance', password: '' });
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setFormData({ name: '', email: '', role: 'finance', password: 'Welcome@123' });
    setEditingUserId(null);
    setIsAdding(true);
    setFeedbackMsg('');
  };

  const handleStartEdit = (u) => {
    setFormData({ name: u.name, email: u.email, role: u.role, password: '' });
    setEditingUserId(u.id);
    setIsAdding(true);
    setFeedbackMsg('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role
        };
        if (formData.password?.trim()) {
          payload.password = formData.password.trim();
        }
        await updateUser(editingUserId, payload);
        setFeedbackMsg(`User "${formData.name}" was updated successfully.`);
      } else {
        await addUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          password: formData.password?.trim() || 'Welcome@123'
        });
        setFeedbackMsg(`User "${formData.name}" created! They can now log in and optionally setup 2-Step Verification.`);
      }
      setIsAdding(false);
      setEditingUserId(null);
    } catch (err) {
      alert('Failed to save user: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFeedbackMsg(''), 4500);
    }
  };

  const handleReset2FA = async (u) => {
    const confirm = window.confirm(
      `Reset 2-Step Verification for ${u.name}?\n\nThis will remove their active Authenticator binding. The user will be able to scan a fresh QR code with Microsoft/Google Authenticator whenever they choose.`
    );
    if (!confirm) return;

    await resetUser2FA(u.id);
    setFeedbackMsg(`2-Step Verification for ${u.name} has been reset. They can re-link Authenticator anytime.`);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove user "${u.name}" (${u.email})?`)) {
      await deleteUser(u.id);
      setFeedbackMsg(`User "${u.name}" was deleted.`);
      setTimeout(() => setFeedbackMsg(''), 3500);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleDescriptions = {
    cto: 'Executive Approver — Authorized to approve or reject payout requests before disbursement.',
    finance: 'Finance Officer — Prepares, logs and processes payment vouchers.',
    admin: 'Administrator — Manages team accounts, security privileges and 2FA resets.',
    auditor: 'Compliance Auditor — Read-only access to transaction ledgers and financial reports.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                User Accounts & Access Control
              </h3>
              <p className="text-xs text-slate-500">
                Manage roles, user security credentials and 2-Step Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Action Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {!isAdding && (
              <button
                onClick={handleStartAdd}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create New User</span>
              </button>
            )}
          </div>

          {/* User Create / Edit Card */}
          {isAdding && (
            <form onSubmit={handleSaveUser} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fadeIn shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {editingUserId ? <Edit2 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    {editingUserId ? 'Edit User Credentials & Role' : 'Register New Team Member'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Farheen Accounts"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. farheen@almeezan.org"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned Access Role *</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {availableRoles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    {roleDescriptions[formData.role] || ''}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>{editingUserId ? 'Update Password (Optional)' : 'Initial Password *'}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUserId ? 'Leave blank to keep existing password' : 'e.g. Welcome@123'}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Users can change this password anytime in their Profile settings.
                  </p>
                </div>
              </div>

              {/* Security Advisory note */}
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-blue-950">2-Step Verification Policy</p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    2-Step Verification is completely optional. Newly created users can sign in with their password immediately, and can choose to link Microsoft or Google Authenticator from their profile settings.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role & Permissions</th>
                    <th className="py-3 px-4">2-Step Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                        No matching users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const isCTO = u.role === 'cto';
                      const isAdmin = u.role === 'admin';
                      const isFinance = u.role === 'finance';
                      const isCurrentUser = u.id === currentUser?.id;

                      const initial = u.name ? u.name.charAt(0).toUpperCase() : 'U';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {initial}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              isCTO
                                ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                : isAdmin
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : isFinance
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {isCTO ? 'Approver (CTO)' : isAdmin ? 'Admin' : isFinance ? 'Finance' : 'Auditor'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {u.twoFactorEnabled ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>2FA Active (TOTP)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                <span>Optional / Not Setup</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reset 2FA Button (if enabled) */}
                              {u.twoFactorEnabled ? (
                                <button
                                  onClick={() => handleReset2FA(u)}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-300 transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Reset 2-Step Verification for device change"
                                >
                                  <RotateCcw className="w-3 h-3 text-amber-700" />
                                  <span>Reset 2FA</span>
                                </button>
                              ) : null}

                              {/* Edit Profile */}
                              <button
                                onClick={() => handleStartEdit(u)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                                title="Edit User Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Profile (disabled for self) */}
                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleDelete(u)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
