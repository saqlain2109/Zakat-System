import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ShieldCheck,
  RotateCcw,
  Trash2,
  Edit2,
  X,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Check
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
  const [formData, setFormData] = useState({ name: '', email: '', role: 'finance' });
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setFormData({ name: '', email: '', role: 'finance' });
    setEditingUserId(null);
    setIsAdding(true);
    setFeedbackMsg('');
  };

  const handleStartEdit = (u) => {
    setFormData({ name: u.name, email: u.email, role: u.role });
    setEditingUserId(u.id);
    setIsAdding(true);
    setFeedbackMsg('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Name and Email are required');
      return;
    }

    setIsSubmitting(true);
    if (editingUserId) {
      await updateUser(editingUserId, formData);
      setFeedbackMsg(`User ${formData.name} updated successfully.`);
    } else {
      await addUser(formData);
      setFeedbackMsg(`User ${formData.name} created! On first login, they will be prompted to setup Microsoft/Google Authenticator.`);
    }
    setIsSubmitting(false);
    setIsAdding(false);
    setEditingUserId(null);
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleReset2FA = async (u) => {
    const confirm = window.confirm(
      `Reset 2-Step Verification for ${u.name}?\n\nThis will remove their existing Authenticator binding so they can scan a fresh QR code on their new phone on next login.`
    );
    if (!confirm) return;

    await resetUser2FA(u.id);
    setFeedbackMsg(`2-Step Verification for ${u.name} was removed. They can re-configure 2FA on their next login.`);
    setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert('You cannot delete your own active account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user ${u.name}?`)) {
      await deleteUser(u.id);
      setFeedbackMsg(`User ${u.name} deleted.`);
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                User Security & 2-Step Verification Management
              </h3>
              <p className="text-xs text-slate-500">
                Manage roles, user access, and reset 2FA for device changes
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

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-700">
                Registered System Users ({users.length})
              </span>
              <p className="text-[11px] text-slate-400">
                CTO (Akbar Hussain) authorizes payouts. Finance users submit requests for review.
              </p>
            </div>
            {!isAdding && (
              <button
                onClick={handleStartAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {isAdding && (
            <form onSubmit={handleSaveUser} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  {editingUserId ? 'Edit User Profile' : 'Register New User'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Farheen Accounts"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. farheen@almeezan.org"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold text-xs mb-1">Assigned Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableRoles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingUserId ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">2-Step Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const isCTO = u.role === 'cto';
                    const isAdmin = u.role === 'admin';
                    const isFinance = u.role === 'finance';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">
                            {u.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {u.email}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCTO
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isAdmin
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isFinance
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {isCTO ? 'CTO (Approver)' : isAdmin ? 'Admin' : isFinance ? 'Finance' : 'Auditor'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {u.twoFactorEnabled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>2FA Active (Authenticator)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                              <span>Not Configured</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reset 2FA Button */}
                            {u.twoFactorEnabled ? (
                              <button
                                onClick={() => handleReset2FA(u)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-200 transition-colors flex items-center gap-1"
                                title="Reset 2-Step Verification if phone changed"
                              >
                                <RotateCcw className="w-3 h-3 text-amber-600" />
                                <span>Reset 2FA</span>
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleStartEdit(u)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {u.id !== currentUser?.id && (
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
