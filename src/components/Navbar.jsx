import React, { useState } from 'react';
import { useZakat } from '../context/ZakatContext';
import { useAuth, SYSTEM_ROLES } from '../context/AuthContext';
import { formatCompactINR } from '../utils/formatters';
import {
  LayoutDashboard,
  FilePlus2,
  Receipt,
  Users2,
  Calculator,
  RotateCcw,
  Menu,
  X,
  Wallet,
  FileSpreadsheet,
  CalendarDays,
  UserCheck,
  Package,
  GraduationCap,
  Settings2,
  Activity,
  ChevronDown
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenImport, onOpenYearModal }) => {
  const {
    financialYear,
    setFinancialYear,
    plannedAnnualBudget,
    totalZakatPaid,
    overallUtilization,
    resetToDefaultData,
    zakatYears
  } = useZakat();

  const { currentUser, switchRole } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry-form', label: 'New Payout', icon: FilePlus2 },
    { id: 'ledger', label: 'Ledger', icon: Receipt },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users2 },
    { id: 'ration-kit', label: 'Ration', icon: Package },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'asset-pool', label: '2.5% Pool', icon: Calculator },
    { id: 'masters', label: 'Masters', icon: Settings2 },
    { id: 'audit-logs', label: 'Audit', icon: Activity },
  ];

  const currentRoleObj = SYSTEM_ROLES.find(r => r.id === currentUser?.role) || SYSTEM_ROLES[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Year Badge */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Zakat System
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenYearModal) onOpenYearModal();
                }}
                title="Manage assessment years"
                className="hidden sm:inline-flex items-center gap-1 ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 transition-colors"
              >
                <span>FY {financialYear}</span>
                <CalendarDays className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Medium Screens Navigation (Compact) */}
          <nav className="hidden md:flex xl:hidden items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            {mainNavItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg font-medium flex items-center gap-1"
            >
              <span>More</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Live Progress Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Paid:</span>
              <strong className="text-emerald-400 font-mono">{formatCompactINR(totalZakatPaid)}</strong>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300 font-mono">{formatCompactINR(plannedAnnualBudget)}</span>
              <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {(overallUtilization || 0).toFixed(0)}%
              </span>
            </div>

            {/* Excel Import Trigger */}
            <button
              onClick={onOpenImport}
              title="Import Beneficiaries or Disbursements from Excel"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Year Selector */}
            <div className="relative">
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-emerald-400 font-bold text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                {zakatYears.map((yr) => (
                  <option key={yr.year} value={yr.year} className="bg-slate-900 text-white">
                    {yr.year} {yr.year === 2026 ? '★' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
                title={`Active Role: ${currentRoleObj.label}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-semibold">{currentUser?.name?.split(' ')[0] || 'User'}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                  {currentUser?.role}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Role Dropdown Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                  <div className="px-2 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 font-semibold">
                    Simulate User & Role Permissions
                  </div>
                  {SYSTEM_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        switchRole(role.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex flex-col gap-0.5 transition-colors ${
                        currentUser?.role === role.id
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{role.label}</span>
                        {currentUser?.role === role.id && <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {role.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Data Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset all Zakat System data to default seed file (Zakat File 2026)?')) {
                  resetToDefaultData();
                }
              }}
              title="Reset data to original seed"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Overflow Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fadeIn pb-4">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
