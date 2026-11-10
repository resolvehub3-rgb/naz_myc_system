import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  CalendarDays,
  QrCode,
  ClipboardList,
  UserCheck,
  FileBarChart,
  ShieldAlert,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { CrestLogo } from './CrestLogo';

export type NavTab =
  | 'dashboard'
  | 'members'
  | 'add_member'
  | 'membership_cards'
  | 'attendance_sessions'
  | 'qr_scanner'
  | 'attendance_records'
  | 'visitors'
  | 'reports'
  | 'user_management'
  | 'audit_logs'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { profile, signOut, isAdmin } = useAuth();
  const { activeSession, isOnline, offlineQueueCount, syncPendingRecords } = useChurch();

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  // Nav items filtered by role
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'qr_scanner' as NavTab, label: 'QR Scanner', icon: QrCode, badge: activeSession ? 'ACTIVE' : undefined },
    { id: 'attendance_sessions' as NavTab, label: 'Sessions', icon: CalendarDays },
    { id: 'members' as NavTab, label: 'Members', icon: Users, adminOnly: true },
    { id: 'add_member' as NavTab, label: 'Add Member', icon: UserPlus, adminOnly: true },
    { id: 'membership_cards' as NavTab, label: 'ID Cards', icon: CreditCard, adminOnly: true },
    { id: 'attendance_records' as NavTab, label: 'Attendance Records', icon: ClipboardList },
    { id: 'visitors' as NavTab, label: 'Visitors & Walk-ins', icon: UserCheck },
    { id: 'reports' as NavTab, label: 'Reports', icon: FileBarChart, adminOnly: true },
    { id: 'user_management' as NavTab, label: 'User Roles', icon: ShieldAlert, adminOnly: true },
    { id: 'audit_logs' as NavTab, label: 'Audit Logs', icon: History, adminOnly: true },
    { id: 'settings' as NavTab, label: 'System Settings', icon: Settings },
  ];

  const visibleItems = navItems.filter((item) => (item.adminOnly ? isAdmin : true));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B2345] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:self-start ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <CrestLogo className="w-10 h-12 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs font-black tracking-wider uppercase leading-tight font-sans text-white">
              METHODIST CHURCH
            </h1>
            <p className="text-[10px] text-[#38BDF8] font-bold tracking-widest uppercase">
              GHANA • MYC
            </p>
            <span className="text-[9px] text-slate-300 italic font-medium">
              Faith • Hope • Love
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3 mx-3 my-2 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {profile?.full_name || 'Church Staff'}
            </p>
            <span
              className={`inline-block text-[9.5px] px-2 py-0.5 rounded font-extrabold tracking-wide uppercase mt-0.5 ${
                isAdmin ? 'bg-amber-400 text-slate-900' : 'bg-sky-400 text-slate-900'
              }`}
            >
              {profile?.role === 'admin' ? 'Administrator' : 'Attendance Officer'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold" title="Online">
                <Wifi className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold" title="Offline mode active">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Offline Queue Notification (if items pending) */}
        {offlineQueueCount > 0 && (
          <div className="mx-3 mb-2 p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl flex items-center justify-between text-xs">
            <div className="min-w-0 pr-1">
              <span className="font-bold text-amber-300 block leading-tight">
                {offlineQueueCount} Offline Scans
              </span>
              <span className="text-[10px] text-amber-200">Pending sync</span>
            </div>
            {isOnline && (
              <button
                type="button"
                onClick={syncPendingRecords}
                className="px-2.5 py-1 bg-amber-400 text-slate-900 font-bold text-[10px] rounded-lg shadow-xs hover:bg-amber-300"
              >
                Sync Now
              </button>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#123B70] text-white shadow-md border border-[#38BDF8]/30 font-bold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#38BDF8]' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold uppercase">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="w-3.5 h-3.5 text-[#38BDF8]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
