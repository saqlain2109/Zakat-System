import React, { useState, useMemo } from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatINR, exportToCSV } from '../utils/formatters';
import {
  Package,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Download,
  Check,
  Edit2,
  MapPin,
  Phone
} from 'lucide-react';

export const RationKitScreen = () => {
  const { rationDistributions, updateRationItem, addRationItem, financialYear } = useZakat();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [colonyFilter, setColonyFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newRecipient, setNewRecipient] = useState({
    name: '',
    phone: '',
    colony: 'Kat Kat Gate',
    occupation: 'Widow / Destitute Family',
    coordinator: 'Rehan',
    kitQuantity: 1,
    unitCost: 4076,
    status: 'planned',
    notes: 'Ramzan food kit package'
  });

  // Scoped to active assessment year
  const yearRationList = useMemo(() => {
    return rationDistributions.filter(r => !r.year || r.year === Number(financialYear));
  }, [rationDistributions, financialYear]);

  // Unique Colonies
  const colonies = useMemo(() => {
    return Array.from(new Set(yearRationList.map(r => r.colony))).filter(Boolean);
  }, [yearRationList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return yearRationList.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || r.name.toLowerCase().includes(q) || (r.phone && r.phone.includes(q)) || r.colony.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesColony = colonyFilter === 'ALL' || r.colony === colonyFilter;
      return matchesSearch && matchesStatus && matchesColony;
    });
  }, [yearRationList, searchQuery, statusFilter, colonyFilter]);

  // Auto Calculations
  const stats = useMemo(() => {
    const totalKits = yearRationList.reduce((sum, r) => sum + (Number(r.kitQuantity) || 1), 0);
    const distributedKits = yearRationList.filter(r => r.status === 'distributed').reduce((sum, r) => sum + (Number(r.kitQuantity) || 1), 0);
    const pendingKits = totalKits - distributedKits;
    const totalBudget = yearRationList.reduce((sum, r) => sum + (Number(r.totalAmount) || (r.kitQuantity * r.unitCost)), 0);
    const distributedAmount = yearRationList.filter(r => r.status === 'distributed').reduce((sum, r) => sum + (Number(r.totalAmount) || (r.kitQuantity * r.unitCost)), 0);
    const remainingAmount = totalBudget - distributedAmount;
    return { totalKits, distributedKits, pendingKits, totalBudget, distributedAmount, remainingAmount };
  }, [yearRationList]);

  // Direct 1-Click Distribution Toggle
  const handleToggleDistributed = (item) => {
    const isDone = item.status === 'distributed';
    updateRationItem({
      ...item,
      status: isDone ? 'planned' : 'distributed',
      distributionDate: isDone ? null : new Date().toISOString().split('T')[0]
    });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newRecipient.name.trim()) return;
    addRationItem({
      ...newRecipient,
      totalAmount: Number(newRecipient.kitQuantity) * Number(newRecipient.unitCost),
      distributionDate: newRecipient.status === 'distributed' ? new Date().toISOString().split('T')[0] : null
    });
    setShowAddModal(false);
    setNewRecipient({
      name: '',
      phone: '',
      colony: 'Kat Kat Gate',
      occupation: 'Widow / Destitute Family',
      coordinator: 'Rehan',
      kitQuantity: 1,
      unitCost: 4076,
      status: 'planned',
      notes: ''
    });
  };

  const handleExportCSV = () => {
    const data = filteredList.map(r => ({
      ID: r.id,
      Name: r.name,
      Phone: r.phone || 'No Phone',
      Colony: r.colony,
      Occupation: r.occupation,
      Coordinator: r.coordinator,
      'Kit Quantity': r.kitQuantity,
      'Unit Cost (INR)': r.unitCost,
      'Total Amount (INR)': r.totalAmount,
      Status: r.status,
      Date: r.distributionDate || 'Pending'
    }));
    exportToCSV(data, `Ration_Kit_Program_${financialYear}.csv`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>Ration Kit Distribution Program</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Ramzan grocery kits tracking across Aurangabad & local colony families (Standard: ₹4,076/kit).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recipient</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Planned Kits</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.totalKits} <span className="text-xs font-normal text-slate-500">Kits</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Budget: <strong className="text-slate-700">{formatINR(stats.totalBudget)}</strong>
          </span>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Distributed Kits</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {stats.distributedKits} <span className="text-xs font-normal text-slate-500">Handed Over</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-semibold">
            {formatINR(stats.distributedAmount)} Disbursed
          </span>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block">Pending Distribution</span>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {stats.pendingKits} <span className="text-xs font-normal text-slate-500">Remaining</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block font-semibold">
            {formatINR(stats.remainingAmount)} In Pipeline
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Standard Unit Cost</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ₹ 4,076
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Per Ramzan Family Kit Pack
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipient name, phone, colony..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={colonyFilter}
          onChange={(e) => setColonyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Colonies ({colonies.length})</option>
          {colonies.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="distributed">Distributed (Handed Over)</option>
          <option value="planned">Planned (Pending Delivery)</option>
        </select>
      </div>

      {/* Distribution Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-semibold w-16">ID</th>
                <th className="py-3 px-3.5 font-semibold">Recipient Name</th>
                <th className="py-3 px-3.5 font-semibold">Colony & Occupation</th>
                <th className="py-3 px-3.5 font-semibold">Coordinator</th>
                <th className="py-3 px-3.5 font-semibold text-center">Kits</th>
                <th className="py-3 px-3.5 font-semibold text-right">Value (₹)</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold text-center">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No ration records match your filters.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const isDone = item.status === 'distributed';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{item.id}</td>
                      <td className="py-3 px-3.5">
                        <strong className="text-slate-900 text-xs block">{item.name}</strong>
                        {item.phone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phone}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="text-slate-900 block font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.colony}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">{item.occupation}</span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 font-medium">
                        {item.coordinator || 'Rehan'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800">
                        {item.kitQuantity}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.totalAmount || (item.kitQuantity * item.unitCost))}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isDone ? 'Distributed' : 'Planned'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {/* 1-Click Action */}
                        <button
                          onClick={() => handleToggleDistributed(item)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto ${
                            isDone
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isDone ? 'Undo' : 'Mark Delivered'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD RECIPIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Ration Kit Recipient</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  placeholder="e.g. Shakil Khan"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={newRecipient.phone}
                    onChange={(e) => setNewRecipient({ ...newRecipient, phone: e.target.value })}
                    placeholder="e.g. 9823000000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Colony / Locality</label>
                  <input
                    type="text"
                    value={newRecipient.colony}
                    onChange={(e) => setNewRecipient({ ...newRecipient, colony: e.target.value })}
                    placeholder="e.g. Kat Kat Gate"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kit Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newRecipient.kitQuantity}
                    onChange={(e) => setNewRecipient({ ...newRecipient, kitQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={newRecipient.unitCost}
                    onChange={(e) => setNewRecipient({ ...newRecipient, unitCost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Family Status / Occupation</label>
                <input
                  type="text"
                  value={newRecipient.occupation}
                  onChange={(e) => setNewRecipient({ ...newRecipient, occupation: e.target.value })}
                  placeholder="e.g. Destitute widow, daily wage earner..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                <select
                  value={newRecipient.status}
                  onChange={(e) => setNewRecipient({ ...newRecipient, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                >
                  <option value="planned">Planned (To be handed over)</option>
                  <option value="distributed">Distributed (Already handed over)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Add Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
