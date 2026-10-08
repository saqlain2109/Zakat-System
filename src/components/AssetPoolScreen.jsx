import React, { useState } from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatINR, formatCompactINR } from '../utils/formatters';
import {
  Calculator,
  Coins,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';

export const AssetPoolScreen = () => {
  const {
    assets,
    updateAsset,
    addAsset,
    deleteAsset,
    totalZakatableAssets,
    calculated25Pool,
    totalZakatPaid,
    totalSadqaPaid,
    grandTotalPaid,
    financialYear
  } = useZakat();

  // Add Asset Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    amount: '',
    category: 'Liquid Cash',
    notes: ''
  });

  // Editing row inline
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditAmount(item.amount);
  };

  const handleSaveEdit = (id) => {
    const val = Number(editAmount);
    if (!isNaN(val) && val >= 0) {
      updateAsset(id, val);
    }
    setEditingId(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newAsset.name.trim() || !newAsset.amount) return;

    addAsset({
      name: newAsset.name.trim(),
      amount: Number(newAsset.amount) || 0,
      category: newAsset.category,
      liquidity: 'High',
      notes: newAsset.notes.trim()
    });

    setShowAddModal(false);
    setNewAsset({ name: '', amount: '', category: 'Liquid Cash', notes: '' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <span>2.5% Shariah Valuation Pool Engine</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            FY {financialYear} Zakatable business assets. Update any valuation to recalculate the 2.5% pool in real-time.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Asset Item</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Zakatable Assets</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatINR(totalZakatableAssets)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cash, bank balances, gold valuation & trade receivables
          </p>
        </div>

        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 block">Calculated 2.5% Target Pool</span>
          <div className="text-2xl font-bold text-blue-700 mt-1 font-mono">
            {formatINR(calculated25Pool)}
          </div>
          <p className="text-[11px] text-blue-600 mt-1">
            Standard Islamic 2.5% Shariah pool requirement
          </p>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 block">Current FY {financialYear} Disbursed</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            {formatINR(totalZakatPaid)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Plus Sadqa: <strong className="text-slate-700">{formatINR(totalSadqaPaid)}</strong>
          </p>
        </div>
      </div>

      {/* Nisab Guidelines Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-blue-950">Shariah Zakat Accounting Methodology (2.5% Annual Rate)</h4>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            Zakat is mandatory upon wealth held for a complete lunar year (Hawl) above the Nisab threshold
            (approx. 85g gold or 595g silver). Zakatable wealth includes liquid bank cash, physical gold/silver,
            unwithdrawn dividend balances, and realizable business stock. Personal residential properties, personal
            vehicles, and daily operational liabilities are excluded.
          </p>
        </div>
      </div>

      {/* Asset Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Asset Line Items ({assets.length})
            </h3>
            <p className="text-xs text-slate-500">
              Click "Edit" on any row to modify its valuation.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            2.5% Formula: Value × 0.025
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 font-semibold w-16">ID</th>
                <th className="py-3 px-3.5 font-semibold">Asset Name & Classification</th>
                <th className="py-3 px-3.5 font-semibold">Group</th>
                <th className="py-3 px-3.5 font-semibold text-right">Asset Valuation (₹)</th>
                <th className="py-3 px-3.5 font-semibold text-right">2.5% Zakat Due (₹)</th>
                <th className="py-3 px-3.5 font-semibold">Notes / Reference</th>
                <th className="py-3 px-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {assets.map(item => {
                const isEditing = editingId === item.id;
                const zakatDue = Math.round(item.amount * 0.025);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-mono text-slate-400 font-bold">{item.id}</td>
                    <td className="py-3 px-3.5">
                      <strong className="text-slate-900 text-xs block">{item.name}</strong>
                      <span className="text-[11px] text-slate-500">{item.liquidity || 'Liquid Asset'}</span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-32 bg-slate-50 border border-blue-500 rounded px-2 py-1 text-right text-xs font-mono font-bold text-slate-900 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>{formatINR(item.amount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">
                      {formatINR(zakatDue)}
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 max-w-xs truncate" title={item.notes}>
                      {item.notes || '—'}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Edit Valuation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete asset line item ${item.name}?`)) {
                              deleteAsset(item.id);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                <td className="py-3.5 px-3.5" colSpan={3}>TOTAL ZAKATABLE ASSETS POOL</td>
                <td className="py-3.5 px-3.5 text-right font-mono text-slate-900 font-bold">
                  {formatINR(totalZakatableAssets)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-blue-700 font-bold">
                  {formatINR(calculated25Pool)}
                </td>
                <td className="py-3.5 px-3.5 text-slate-500" colSpan={2}>
                  Full 2.5% Nisab valuation
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ASSET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Add Zakatable Asset Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="e.g. HDFC Current Account 0012"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Asset Group</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="Liquid Cash">Liquid Cash</option>
                    <option value="Bank Balance">Bank Balance</option>
                    <option value="Gold / Silver">Gold / Silver</option>
                    <option value="Shares / Investment">Shares / Investment</option>
                    <option value="Receivables">Receivables</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valuation (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
                    placeholder="e.g. 500000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Notes / Location</label>
                <input
                  type="text"
                  value={newAsset.notes}
                  onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                  placeholder="e.g. Audited balance as of March 31"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800"
                />
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
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
