import React, { useState, useRef, useEffect } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth } from '../context/AuthContext';
import { formatCompactINR } from '../utils/formatters';
import {
  Menu,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Users,
  ChevronDown,
  Clock,
  LogOut,
  KeyRound,
  Check
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
    zakatYears,
    pendingApprovalCount
  } = useZakat();

  const {
    currentUser,
    isCTO,
    isAdmin,
    isFinance,
    setIsLoginModalOpen,
    setIsProfileModalOpen,
    setIs2FASetupModalOpen,
    setIsUserManagementModalOpen,
    setTarget2FAUser,
    logout
  } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const titles = {
    'dashboard': { title: 'Financial Dashboard & Budget Overview', subtitle: `Overview of FY ${financialYear} Zakat allocation and category utilization` },
    'entry-form': { title: 'Record New Disbursement', subtitle: 'Disburse funds with 1-click status update and multi-year recipient history' },
    'ledger': { title: 'Live Disbursement Ledger', subtitle: 'Audit log of all payouts with 1-click payment status toggles' },
    'beneficiaries': { title: 'Beneficiary Master Directory', subtitle: 'Verified recipients, families, trusts, and case notes' },
    'reports': { title: 'Audited Financial Reports & Analytics', subtitle: 'Category envelopes, school grants, multi-year archives & bank outflows' },
    'masters': { title: 'Central Master Settings', subtitle: 'Manage categories, bank accounts, and coordinators' },
  };

  const currentInfo = titles[activeTab] || titles['dashboard'];

  // Role color styles
  const getRoleBadge = (role) => {
    switch (role) {
      case 'cto':
        return { label: 'CTO', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'admin':
        return { label: 'Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'finance':
        return { label: 'Finance', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Auditor', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
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

        {/* Right: Quick Stats, Approvals & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* CTO Pending Queue Badge Button */}
          {pendingApprovalCount > 0 && (
            <button
              onClick={() => setActiveTab('ledger')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs animate-pulse"
              title="Disbursements awaiting CTO authorization"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">CTO Queue:</span>
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-mono">
                {pendingApprovalCount}
              </span>
            </button>
          )}

          {/* Live Progress Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Payout</span>
            </button>
          )}

          {/* User Account / 2FA / Role Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs text-left"
              title="Account & Security"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                    {currentUser?.name || 'User'}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${roleBadge.bg}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>
              {currentUser?.twoFactorEnabled ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="2-Step Verification Active (Microsoft/Google Authenticator)" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" title="2-Step Verification Not Setup" />
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Account Menu Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs animate-fadeIn">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {currentUser?.name || 'Guest User'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {currentUser?.email || 'user@almeezan.org'}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.bg}`}>
                      Role: {roleBadge.label}
                    </span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      currentUser?.twoFactorEnabled ? 'text-emerald-700' : 'text-amber-600'
                    }`}>
                      {currentUser?.twoFactorEnabled ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>2FA Active</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                          <span>2FA Inactive</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  {/* My Profile & Security (Password, 2FA) */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-800 font-semibold"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>My Profile & Security</span>
                  </button>

                  {/* Switch Account */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Switch User / Quick Login</span>
                  </button>

                  {/* Admin User Management */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsUserManagementModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-purple-700 font-medium bg-purple-50/50"
                    >
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>Admin: User Directory & 2FA Reset</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
