import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChurchProvider } from './context/ChurchContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { AddMemberPage } from './pages/AddMemberPage';
import { MembershipCardsPage } from './pages/MembershipCardsPage';
import { AttendanceSessionsPage } from './pages/AttendanceSessionsPage';
import { ScannerPage } from './pages/ScannerPage';
import { AttendanceRecordsPage } from './pages/AttendanceRecordsPage';
import { VisitorsPage } from './pages/VisitorsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B2345] flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#38BDF8] mb-3" />
        <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
          Methodist Church Ghana – MYC
        </h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Digital Attendance System...</p>
      </div>
    );
  }

  // Not authenticated: Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Role guard: if attendance officer and on admin-only tab, default to qr_scanner
  const adminOnlyTabs: NavTab[] = [
    'dashboard',
    'members',
    'add_member',
    'membership_cards',
    'reports',
    'user_management',
    'audit_logs',
  ];

  const effectiveTab = !isAdmin && adminOnlyTabs.includes(currentTab) ? 'qr_scanner' : currentTab;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#172B4D]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={effectiveTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpenMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={effectiveTab}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {effectiveTab === 'dashboard' && <DashboardPage onNavigate={setCurrentTab} />}
          {effectiveTab === 'members' && <MembersPage onNavigate={setCurrentTab} />}
          {effectiveTab === 'add_member' && <AddMemberPage onNavigate={setCurrentTab} />}
          {effectiveTab === 'membership_cards' && (
            <MembershipCardsPage onNavigate={setCurrentTab} />
          )}
          {effectiveTab === 'attendance_sessions' && (
            <AttendanceSessionsPage onNavigate={setCurrentTab} />
          )}
          {effectiveTab === 'qr_scanner' && <ScannerPage onNavigate={setCurrentTab} />}
          {effectiveTab === 'attendance_records' && <AttendanceRecordsPage />}
          {effectiveTab === 'visitors' && <VisitorsPage onNavigate={setCurrentTab} />}
          {effectiveTab === 'reports' && <ReportsPage />}
          {effectiveTab === 'user_management' && <UserManagementPage />}
          {effectiveTab === 'audit_logs' && <AuditLogsPage />}
          {effectiveTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChurchProvider>
        <MainApp />
      </ChurchProvider>
    </AuthProvider>
  );
}
