import React from 'react';
import { Menu, QrCode, Calendar, Radio } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileNav: () => void;
  onSelectTab: (tab: NavTab) => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Church attendance overview & live statistics' },
  members: { title: 'Members Directory', subtitle: 'Manage registered youth members & history' },
  add_member: { title: 'Register Member', subtitle: 'Digital member enrollment & instant ID card generation' },
  membership_cards: { title: 'Membership ID Cards', subtitle: 'CR80 standard card designer, print & PDF export' },
  attendance_sessions: { title: 'Attendance Sessions', subtitle: 'Church services, fellowship meetings & special events' },
  qr_scanner: { title: 'QR Code Attendance Scanner', subtitle: 'Smartphone camera scanning & instant check-in' },
  attendance_records: { title: 'Attendance Records', subtitle: 'Historical attendance log, verification & search' },
  visitors: { title: 'Visitors & Walk-ins', subtitle: 'Guest check-in & member conversion tracking' },
  reports: { title: 'Reports & Analytics', subtitle: 'Printable official PDF reports & Excel workbooks' },
  user_management: { title: 'User Roles & Access', subtitle: 'Administrators and Attendance Officers' },
  audit_logs: { title: 'System Audit Logs', subtitle: 'Security audit trail of church data modifications' },
  settings: { title: 'System Settings & Preferences', subtitle: 'Methodist Church Ghana MYC configuration & offline queue' },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileNav,
  onSelectTab,
}) => {
  const { activeSession } = useChurch();
  const info = TAB_TITLES[currentTab] || { title: 'MYC Attendance System', subtitle: '' };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title and subtitle */}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0B2345] truncate tracking-tight">
            {info.title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 truncate">{info.subtitle}</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Active Session Badge */}
        {activeSession ? (
          <div
            onClick={() => onSelectTab('qr_scanner')}
            className="cursor-pointer hidden md:flex items-center gap-2 bg-[#EAF6FF] text-[#123B70] border border-[#38BDF8]/40 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-sky-100 transition-all"
            title="Click to open QR Scanner for this session"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[140px] font-bold">{activeSession.session_name}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSelectTab('attendance_sessions')}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#123B70] bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Select Active Meeting</span>
          </button>
        )}

        {/* Quick QR Scanner Shortcut */}
        {currentTab !== 'qr_scanner' && (
          <button
            type="button"
            onClick={() => onSelectTab('qr_scanner')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <QrCode className="w-4 h-4 text-[#38BDF8]" />
            <span className="hidden sm:inline">Open Scanner</span>
          </button>
        )}
      </div>
    </header>
  );
};
