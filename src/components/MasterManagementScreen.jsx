import React, { useState } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/formatters';
import {
  Settings2,
  Layers,
  Building,
  Users,
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Tag,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export const MasterManagementScreen = () => {
  const {
    categories,
    updateCategory,
    addCategory,
    deleteCategory,
    fundingAccounts,
    updateFundingAccount,
    addFundingAccount,
    deleteFundingAccount,
    referencePersons,
    updateReferencePerson,
    addReferencePerson,
    deleteReferencePerson,
    aurangabadRationList,
    financialYear
  } = useZakat();

  const { isAuditor, isReadOnly } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('categories');

  // Add Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({
    name: '',
    fundType: 'Zakat (Mandatory)',
    isEligible25Pool: true,
    plannedBudget: '',
    defaultAccountName: 'Employees acc',
    description: ''
  });

  const [showAccModal, setShowAccModal] = useState(false);
  const [accForm, setAccForm] = useState({
    name: '',
    accountHolder: '',
    accountType: 'Corporate Bank Account',
    bankName: '',
    role: '',
    balance: ''
  });

  const [showRefModal, setShowRefModal] = useState(false);
  const [refForm, setRefForm] = useState({
    name: '',
    role: '',
    department: 'Welfare Admin',
    area: '',
    phone: ''
  });

  // Edit Modal States
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingRefPerson, setEditingRefPerson] = useState(null);

  // Success Notification banner
  const [notification, setNotification] = useState('');
  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Add Handlers
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    addCategory({
      name: catForm.name.trim(),
      fundType: catForm.fundType,
      isEligible25Pool: catForm.isEligible25Pool,
      plannedBudget: Number(catForm.plannedBudget) || 0,
      defaultAccountName: catForm.defaultAccountName,
      description: catForm.description.trim()
    });
    setShowCatModal(false);
    setCatForm({
      name: '',
      fundType: 'Zakat (Mandatory)',
      isEligible25Pool: true,
      plannedBudget: '',
      defaultAccountName: 'Employees acc',
      description: ''
    });
    showNotice('New category added successfully!');
  };

  const handleUpdateCategory = (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    updateCategory({
      ...editingCategory,
      name: editingCategory.name.trim(),
      plannedBudget: Number(editingCategory.plannedBudget) || 0,
      description: (editingCategory.description || '').trim()
    });
    setEditingCategory(null);
    showNotice(`Category "${editingCategory.name}" updated successfully!`);
  };

  const handleDeleteCategory = (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      deleteCategory(cat.id);
      showNotice(`Category "${cat.name}" deleted.`);
    }
  };

  const handleAddAccount = (e) => {
    e.preventDefault();
    if (!accForm.name.trim()) return;
    addFundingAccount({
      name: accForm.name.trim(),
      accountHolder: accForm.accountHolder.trim(),
      accountType: accForm.accountType,
      bankName: accForm.bankName.trim(),
      role: accForm.role.trim(),
      balance: Number(accForm.balance) || 0
    });
    setShowAccModal(false);
    setAccForm({
      name: '',
      accountHolder: '',
      accountType: 'Corporate Bank Account',
      bankName: '',
      role: '',
      balance: ''
    });
    showNotice('New funding account added successfully!');
  };

  const handleUpdateAccount = (e) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.name.trim()) return;
    updateFundingAccount({
      ...editingAccount,
      name: editingAccount.name.trim(),
      accountHolder: (editingAccount.accountHolder || '').trim(),
      bankName: (editingAccount.bankName || '').trim(),
      balance: Number(editingAccount.balance) || 0
    });
    setEditingAccount(null);
    showNotice(`Funding account "${editingAccount.name}" updated successfully!`);
  };

  const handleDeleteAccount = (acc) => {
    if (window.confirm(`Are you sure you want to delete account "${acc.name}"?`)) {
      deleteFundingAccount(acc.id);
      showNotice(`Account "${acc.name}" deleted.`);
    }
  };

  const handleAddReference = (e) => {
    e.preventDefault();
    if (!refForm.name.trim()) return;
    addReferencePerson({
      name: refForm.name.trim(),
      role: refForm.role.trim(),
      department: refForm.department,
      area: refForm.area.trim(),
      phone: refForm.phone.trim()
    });
    setShowRefModal(false);
    setRefForm({
      name: '',
      role: '',
      department: 'Welfare Admin',
      area: '',
      phone: ''
    });
    showNotice('New coordinator added successfully!');
  };

  const handleUpdateReference = (e) => {
    e.preventDefault();
    if (!editingRefPerson || !editingRefPerson.name.trim()) return;
    updateReferencePerson({
      ...editingRefPerson,
      name: editingRefPerson.name.trim(),
      role: (editingRefPerson.role || '').trim(),
      area: (editingRefPerson.area || '').trim(),
      phone: (editingRefPerson.phone || '').trim()
    });
    setEditingRefPerson(null);
    showNotice(`Coordinator "${editingRefPerson.name}" updated successfully!`);
  };

  const handleDeleteReference = (ref) => {
    if (window.confirm(`Are you sure you want to delete coordinator "${ref.name}"?`)) {
      deleteReferencePerson(ref.id);
      showNotice(`Coordinator "${ref.name}" deleted.`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <span>Central Master Settings</span>
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          View, edit and customize standardized categories, payout bank accounts, and coordinators.
        </p>
      </div>

      {/* Action Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'categories', label: `Category Master (${categories.length})`, icon: Layers },
          { id: 'accounts', label: `Funding Accounts (${fundingAccounts.length})`, icon: Building },
          { id: 'coordinators', label: `Coordinators (${referencePersons.length})`, icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATEGORY MASTER */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Standardized Zakat & Sadqa budget envelope classifications</span>
            {!isAuditor && !isReadOnly && (
              <button
                onClick={() => setShowCatModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-semibold w-16">ID</th>
                  <th className="py-3 px-3.5 font-semibold">Category Name</th>
                  <th className="py-3 px-3.5 font-semibold">Fund Type</th>
                  <th className="py-3 px-3.5 font-semibold text-center">2.5% Pool?</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Planned Cap (₹)</th>
                  <th className="py-3 px-3.5 font-semibold">Default Account</th>
                  <th className="py-3 px-3.5 font-semibold">Description</th>
                  <th className="py-3 px-3.5 font-semibold text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {categories.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{c.id}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        c.isEligible25Pool
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.fundType}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {c.isEligible25Pool ? (
                        <span className="text-emerald-700 font-bold">YES</span>
                      ) : (
                        <span className="text-slate-400">NO (Sadqa)</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-800">
                      {formatINR(c.plannedBudget)}
                    </td>
                    <td className="py-3 px-3.5 text-slate-700">{c.defaultAccountName}</td>
                    <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate">{c.description}</td>
                    <td className="py-3 px-3.5 text-center">
                      {isAuditor || isReadOnly ? (
                        <span className="text-[11px] text-slate-400 italic font-medium">Read-Only</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingCategory({ ...c })}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FUNDING ACCOUNTS MASTER */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Bank accounts from which payments are disbursed</span>
            {!isAuditor && !isReadOnly && (
              <button
                onClick={() => setShowAccModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Funding Account</span>
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-semibold w-16">Code</th>
                  <th className="py-3 px-3.5 font-semibold">Account Name</th>
                  <th className="py-3 px-3.5 font-semibold">Managed By / Holder</th>
                  <th className="py-3 px-3.5 font-semibold">Bank Name</th>
                  <th className="py-3 px-3.5 font-semibold">Account Type</th>
                  <th className="py-3 px-3.5 font-semibold">Assigned Role</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Current Balance (₹)</th>
                  <th className="py-3 px-3.5 font-semibold text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {fundingAccounts.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{a.id}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900">{a.name}</td>
                    <td className="py-3 px-3.5 text-slate-700">{a.accountHolder}</td>
                    <td className="py-3 px-3.5 text-slate-500">{a.bankName}</td>
                    <td className="py-3 px-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                        {a.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 max-w-xs">{a.role}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                      {formatINR(a.balance)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {isAuditor || isReadOnly ? (
                        <span className="text-[11px] text-slate-400 italic font-medium">Read-Only</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingAccount({ ...a })}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(a)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REFERENCE COORDINATORS MASTER */}
      {activeSubTab === 'coordinators' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Internal coordinators and employees who refer and verify applicants</span>
            {!isAuditor && !isReadOnly && (
              <button
                onClick={() => setShowRefModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Coordinator</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {referencePersons.map(r => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                      <span className="text-[11px] text-blue-700 font-semibold">{r.role}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      {r.department}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Focus Area:</strong> {r.area || 'All Areas'}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-700 font-mono">
                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{r.phone || 'N/A'}</span>
                  </div>
                </div>

                {!isAuditor && !isReadOnly && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingRefPerson({ ...r })}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteReference(r)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add New Budget Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Medical Aid"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fund Type</label>
                  <select
                    value={catForm.fundType}
                    onChange={(e) => setCatForm({
                      ...catForm,
                      fundType: e.target.value,
                      isEligible25Pool: e.target.value.includes('Zakat')
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Zakat (Mandatory)">Zakat (Mandatory)</option>
                    <option value="Sadqa / Nafila">Sadqa / Nafila</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Planned Budget (₹)</label>
                  <input
                    type="number"
                    value={catForm.plannedBudget}
                    onChange={(e) => setCatForm({ ...catForm, plannedBudget: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Default Payout Account</label>
                <select
                  value={catForm.defaultAccountName}
                  onChange={(e) => setCatForm({ ...catForm, defaultAccountName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                >
                  {fundingAccounts.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Purpose of this envelope"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Category ({editingCategory.id})</span>
              </h3>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fund Type</label>
                  <select
                    value={editingCategory.fundType}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      fundType: e.target.value,
                      isEligible25Pool: e.target.value.includes('Zakat')
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Zakat (Mandatory)">Zakat (Mandatory)</option>
                    <option value="Sadqa / Nafila">Sadqa / Nafila</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Planned Budget (₹)</label>
                  <input
                    type="number"
                    value={editingCategory.plannedBudget}
                    onChange={(e) => setEditingCategory({ ...editingCategory, plannedBudget: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Default Payout Account</label>
                <select
                  value={editingCategory.defaultAccountName || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, defaultAccountName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                >
                  {fundingAccounts.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Description"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Funding Bank Account</h3>
              <button onClick={() => setShowAccModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  value={accForm.name}
                  onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                  placeholder="e.g. Office Petty Cash"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Holder</label>
                  <input
                    type="text"
                    value={accForm.accountHolder}
                    onChange={(e) => setAccForm({ ...accForm, accountHolder: e.target.value })}
                    placeholder="e.g. Akbar Sir"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={accForm.bankName}
                    onChange={(e) => setAccForm({ ...accForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Type</label>
                  <select
                    value={accForm.accountType}
                    onChange={(e) => setAccForm({ ...accForm, accountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Corporate Bank Account">Corporate Bank Account</option>
                    <option value="Personal / Management Savings">Personal / Management Savings</option>
                    <option value="Cash in Hand / Petty Cash">Cash in Hand / Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Balance (₹)</label>
                  <input
                    type="number"
                    value={accForm.balance}
                    onChange={(e) => setAccForm({ ...accForm, balance: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Purpose / Role</label>
                <input
                  type="text"
                  value={accForm.role}
                  onChange={(e) => setAccForm({ ...accForm, role: e.target.value })}
                  placeholder="Primary channel for cash distributions"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAccModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ACCOUNT */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Funding Account ({editingAccount.id})</span>
              </h3>
              <button onClick={() => setEditingAccount(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateAccount} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Holder</label>
                  <input
                    type="text"
                    value={editingAccount.accountHolder || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, accountHolder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editingAccount.bankName || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Type</label>
                  <select
                    value={editingAccount.accountType || 'Corporate Bank Account'}
                    onChange={(e) => setEditingAccount({ ...editingAccount, accountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Corporate Bank Account">Corporate Bank Account</option>
                    <option value="Personal / Management Savings">Personal / Management Savings</option>
                    <option value="Cash in Hand / Petty Cash">Cash in Hand / Petty Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Balance (₹)</label>
                  <input
                    type="number"
                    value={editingAccount.balance ?? ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, balance: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Purpose / Role</label>
                <input
                  type="text"
                  value={editingAccount.role || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD COORDINATOR */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Reference Coordinator</h3>
              <button onClick={() => setShowRefModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAddReference} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Coordinator Name *</label>
                <input
                  type="text"
                  required
                  value={refForm.name}
                  onChange={(e) => setRefForm({ ...refForm, name: e.target.value })}
                  placeholder="e.g. Shahed Dalvi"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={refForm.role}
                    onChange={(e) => setRefForm({ ...refForm, role: e.target.value })}
                    placeholder="e.g. Field Officer"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={refForm.phone}
                    onChange={(e) => setRefForm({ ...refForm, phone: e.target.value })}
                    placeholder="e.g. 9820123456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Focus Area / Colony</label>
                <input
                  type="text"
                  value={refForm.area}
                  onChange={(e) => setRefForm({ ...refForm, area: e.target.value })}
                  placeholder="e.g. Mumbra & Kausa"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRefModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Coordinator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT COORDINATOR */}
      {editingRefPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Coordinator ({editingRefPerson.id})</span>
              </h3>
              <button onClick={() => setEditingRefPerson(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleUpdateReference} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Coordinator Name *</label>
                <input
                  type="text"
                  required
                  value={editingRefPerson.name}
                  onChange={(e) => setEditingRefPerson({ ...editingRefPerson, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={editingRefPerson.role || ''}
                    onChange={(e) => setEditingRefPerson({ ...editingRefPerson, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingRefPerson.phone || ''}
                    onChange={(e) => setEditingRefPerson({ ...editingRefPerson, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Focus Area / Colony</label>
                <input
                  type="text"
                  value={editingRefPerson.area || ''}
                  onChange={(e) => setEditingRefPerson({ ...editingRefPerson, area: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRefPerson(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
