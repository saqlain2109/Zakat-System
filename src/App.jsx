import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ZakatProvider } from './context/ZakatContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardScreen } from './components/DashboardScreen';
import { DistributionEntryScreen } from './components/DistributionEntryScreen';
import { BeneficiaryDirectoryScreen } from './components/BeneficiaryDirectoryScreen';
import { DistributionLedgerScreen } from './components/DistributionLedgerScreen';
import { MasterManagementScreen } from './components/MasterManagementScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { ZakatAssistantBot } from './components/ZakatAssistantBot';
import { RecycleBinModal } from './components/RecycleBinModal';
import { YearManagementModal } from './components/YearManagementModal';
import { LoginScreen } from './components/LoginScreen';
import { UserProfileModal } from './components/UserProfileModal';
import { TwoFactorSetupModal } from './components/TwoFactorSetupModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ShieldCheck } from 'lucide-react';

function MainApp() {
  const {
    currentUser,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    is2FASetupModalOpen,
    setIs2FASetupModalOpen,
    isUserManagementModalOpen,
    setIsUserManagementModalOpen
  } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If user is not authenticated, render full-screen login experience
  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
        onOpenYearModal={() => setIsYearModalOpen(true)}
      />

      {/* Main Area Offset For Sidebar */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenYearModal={() => setIsYearModalOpen(true)}
        />

        {/* Main Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              setActiveTab={setActiveTab}
              onOpenYearModal={() => setIsYearModalOpen(true)}
            />
          )}
          {activeTab === 'entry-form' && <DistributionEntryScreen setActiveTab={setActiveTab} />}
          {activeTab === 'ledger' && <DistributionLedgerScreen setActiveTab={setActiveTab} />}
          {activeTab === 'beneficiaries' && <BeneficiaryDirectoryScreen setActiveTab={setActiveTab} />}
          {activeTab === 'reports' && <ReportsScreen setActiveTab={setActiveTab} />}
          {activeTab === 'masters' && <MasterManagementScreen setActiveTab={setActiveTab} />}
        </main>

        {/* Clean Minimal Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-800">Zakat System</span>
              <span>•</span>
              <span>Annual Welfare & Education Ledger</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Shariah 2.5% Audited Accounting & Multi-Year History
            </span>
          </div>
        </footer>
      </div>

      {/* Recycle Bin Modal (30-day recovery) */}
      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
      />

      {/* Zakat Year Management & Rollover Modal */}
      <YearManagementModal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
      />

      {/* User Profile, Password & 2FA Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* 2-Step Verification (2FA / TOTP) Setup Modal */}
      <TwoFactorSetupModal
        isOpen={is2FASetupModalOpen}
        onClose={() => setIs2FASetupModalOpen(false)}
      />

      {/* Admin User Management & 2FA Reset Modal */}
      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
      />

      {/* Floating Live AI / System Assistant Bot */}
      <ZakatAssistantBot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ZakatProvider>
        <MainApp />
      </ZakatProvider>
    </AuthProvider>
  );
}
