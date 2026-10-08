import React from 'react';
import { useZakat } from '../context/ZakatContext';
import { formatCompactINR } from '../utils/formatters';
import {
  Menu,
  Plus
} from 'lucide-react';

export const Header = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
  onOpenYearModal
}) => {
  const {
    financialYear,
    setFinancialYear,
    plannedAnnualBudget,
    totalZakatPaid,
    overallUtilization,
    zakatYears
  } = useZakat();

  const titles = {
    'dashboard': { title: 'Financial Dashboard & Budget Overview', subtitle: `Overview of FY ${financialYear} Zakat allocation and category utilization` },
    'entry-form': { title: 'Record New Disbursement', subtitle: 'Disburse funds with 1-click status update and multi-year recipient history' },
    'ledger': { title: 'Live Disbursement Ledger', subtitle: 'Audit log of all payouts with 1-click payment status toggles' },
    'beneficiaries': { title: 'Beneficiary Master Directory', subtitle: 'Verified recipients, families, trusts, and case notes' },
    'reports': { title: 'Audited Financial Reports & Analytics', subtitle: 'Category envelopes, school grants, multi-year archives & bank outflows' },
    'masters': { title: 'Central Master Settings', subtitle: 'Manage categories, bank accounts, and coordinators' },
  };

  const currentInfo = titles[activeTab] || titles['dashboard'];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-snug">
              {currentInfo.title}
            </h2>
            <p className="hidden md:block text-xs text-slate-500 truncate">
              {currentInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Quick Stats & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Progress Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500">Paid:</span>
            <strong className="text-emerald-700 font-mono font-bold">{formatCompactINR(totalZakatPaid)}</strong>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700 font-mono">{formatCompactINR(plannedAnnualBudget)}</span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {(overallUtilization || 0).toFixed(0)}%
            </span>
          </div>

          {/* Year Selector */}
          <div className="flex items-center">
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(Number(e.target.value))}
              className="bg-white border border-slate-300 text-blue-700 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
            >
              {zakatYears.map((yr) => (
                <option key={yr.year} value={yr.year}>
                  FY {yr.year} {yr.year === 2026 ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* New Payout Action */}
          {activeTab !== 'entry-form' && (
            <button
              onClick={() => setActiveTab('entry-form')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Payout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
