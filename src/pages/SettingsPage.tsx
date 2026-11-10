import React, { useState } from 'react';
import {
  Layers,
  Wifi,
  WifiOff,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  CreditCard,
  Building,
  Info,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';

export const SettingsPage: React.FC = () => {
  const { offlineQueueCount, syncPendingRecords, isOnline } = useChurch();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      await syncPendingRecords();
      setSyncSuccessMsg('All offline attendance records synchronized successfully.');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch {
      // Handled in context
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
          Configuration
        </span>
        <h3 className="text-base font-extrabold text-[#0B2345]">System Settings & Preferences</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Methodist Church Ghana – MYC Attendance System configuration, attendance policies, and offline sync.
        </p>
      </div>

      {/* Church Organization Profile */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#EAF6FF] text-[#123B70] flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#0B2345]">Organization Profile</h4>
            <p className="text-xs text-slate-500">Official church group identity & credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wide">
              Parent Church
            </span>
            <span className="font-extrabold text-sm text-[#0B2345] mt-0.5 block">
              Methodist Church Ghana
            </span>
            <span className="text-slate-500 text-[11px]">Faith • Hope • Love</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wide">
              Group / Department
            </span>
            <span className="font-extrabold text-sm text-[#123B70] mt-0.5 block">
              MYC – Methodist Youth Club
            </span>
            <span className="text-slate-500 text-[11px]">Youth Ministry Division</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wide">
              Timezone & Locale
            </span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              Africa/Accra (GMT +00:00)
            </span>
            <span className="text-slate-500 text-[11px]">Ghana Standard Time</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wide">
              System Identifier Format
            </span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              Sequential (e.g. MYC-000001)
            </span>
            <span className="text-slate-500 text-[11px]">Auto-generated collision-free IDs</span>
          </div>
        </div>
      </div>

      {/* Attendance & Scanner Policies */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#0B2345]">Attendance & Scanner Policies</h4>
            <p className="text-xs text-slate-500">Security checks, duplicate protection, and hardware standards</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-[#0B2345] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Duplicate Check-In Protection
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Prevents a member from being marked present more than once in the same active meeting session.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Active
            </span>
          </div>

          <div className="py-3 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-[#0B2345] flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#123B70]" />
                Ghana Data Protection Act (Act 843) Tokenization
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                QR codes contain checksummed credential tokens rather than raw personal phone numbers or email addresses.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-[11px]">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> Enforced
            </span>
          </div>

          <div className="py-3 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-[#0B2345] flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-sky-600" />
                CR80 Standard Card Specifications
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Membership cards are formatted according to ISO/IEC 7810 ID-1 (85.60 mm × 53.98 mm) with double-sided duplex layout.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 font-bold rounded-lg text-[11px]">
              CR80 Compliant
            </span>
          </div>

          <div className="py-3 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="font-bold text-[#0B2345] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Scanner Debounce & Audio Feedback
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                High-frequency hardware scanning with 5-second duplicate cooldown buzzer and pleasant success chime.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[11px]">
              5s Cooldown
            </span>
          </div>
        </div>
      </div>

      {/* Offline Attendance & Network Queue */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#0B2345]">Offline Scanner & Local Queue</h4>
              <p className="text-xs text-slate-500">Persistent storage for network drops during church services</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </span>
            )}
          </div>
        </div>

        {syncSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs py-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-600 block">Pending Offline Attendance Records:</span>
            <strong className="text-base text-[#0B2345] font-black">{offlineQueueCount}</strong>
          </div>
          {offlineQueueCount > 0 && isOnline && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl hover:bg-[#0B2345] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Records Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
