import React from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatCompactINR } from '../utils/formatters';
import {
  LayoutDashboard,
  FilePlus2,
  Receipt,
  Users2,
  Settings2,
  CalendarDays,
  Coins,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  BarChart3,
  Trash2,
  UserCog,
  LogIn,
  X
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  onOpenRecycleBin,
  onOpenYearModal
}) => {
  const {
    financialYear,
    plannedAnnualBudget,
    totalZakatPaid,
    overallUtilization,
    recycleBin
  } = useZakat();

  const {
    currentUser,
    isAdmin,
    setIsLoginModalOpen,
    setIsProfileModalOpen,
    setIsUserManagementModalOpen
  } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', desc: 'Budget & Overview', icon: LayoutDashboard },
    { id: 'entry-form', label: 'New Payout', desc: 'Record Disbursement', icon: FilePlus2 },
    { id: 'ledger', label: 'Disbursement Ledger', desc: 'Payments & Records', icon: Receipt },
    { id: 'beneficiaries', label: 'Beneficiary Directory', desc: 'Verified Master Profiles', icon: Users2 },
    { id: 'reports', label: 'Reports & Analytics', desc: 'Category & Year Drilldown', icon: BarChart3 },
    { id: 'masters', label: 'Master Settings', desc: 'Categories, Accounts & Refs', icon: Settings2 },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-900/50">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Zakat System
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Welfare & Education Fund
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assessment Year Card */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">FY {financialYear} Cycle</span>
            </div>
            <button
              onClick={onOpenYearModal}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Pool Target:</span>
            <span className="font-semibold text-slate-200 font-mono">{formatCompactINR(plannedAnnualBudget)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Disbursed:</span>
            <span className="font-semibold text-emerald-400 font-mono">
              {formatCompactINR(totalZakatPaid)} ({(overallUtilization || 0).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Main Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div
                    className={`text-[10px] font-normal truncate mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Active User Identity & 2FA Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                setIsProfileModalOpen(true);
                if (setIsOpen) setIsOpen(false);
              }}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 group"
              title="Click to view Profile, change password, or manage 2FA"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600/50">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                  {currentUser?.name || 'User'}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-semibold text-blue-400 uppercase">
                    {currentUser?.role === 'cto' ? 'CTO Akbar' : currentUser?.role === 'admin' ? 'Trustee Admin' : currentUser?.role === 'finance' ? 'Finance' : 'Auditor'}
                  </span>
                  <span className="text-slate-600">•</span>
                  {currentUser?.twoFactorEnabled ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5" title="2-Step Verification Active">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>2FA Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5" title="2-Step Verification Inactive">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>No 2FA</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsLoginModalOpen(true);
                if (setIsOpen) setIsOpen(false);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] shrink-0"
              title="Switch User / Quick Login"
            >
              <LogIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setIsUserManagementModalOpen(true);
                if (setIsOpen) setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 text-[11px] font-semibold transition-colors mt-2"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>Admin: User Directory & 2FA Reset</span>
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          {/* Recycle Bin */}
          <button
            onClick={() => {
              if (onOpenRecycleBin) onOpenRecycleBin();
              if (setIsOpen) setIsOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Recycle Bin</span>
            </div>
            {recycleBin?.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                {recycleBin.length}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
