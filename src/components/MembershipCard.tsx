import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Member } from '../types/database';
import { CrestLogo, ChurchSilhouette } from './CrestLogo';
import { generateQrPayload } from '../lib/attendanceLogic';
import { Phone, Mail, Calendar, User, CreditCard } from 'lucide-react';

interface MembershipCardProps {
  member: Member;
  side?: 'front' | 'back' | 'both';
  scale?: number;
  interactive?: boolean;
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  member,
  side = 'both',
  scale = 1,
  interactive = true,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');

  useEffect(() => {
    // Generate secure QR payload
    const payload = generateQrPayload(member.id, member.membership_number);
    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0B2345',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [member.id, member.membership_number]);

  // Format registration date nicely (e.g. 10 Nov 2024)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '10 Nov 2024';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formattedRegDate = formatDate(member.registration_date);

  return (
    <div className="flex flex-col items-center">
      {/* Front / Back Toggle for interactive preview if requested */}
      {side === 'both' && interactive && (
        <div className="flex items-center gap-2 mb-4 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('front')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'front'
                ? 'bg-[#123B70] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Front Side
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('back')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'back'
                ? 'bg-[#123B70] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Back Side
          </button>
          <span className="text-[11px] text-slate-400 pl-2 pr-1 border-l border-slate-200">
            CR80: 85.60 × 53.98 mm
          </span>
        </div>
      )}

      {/* Render Card Container */}
      <div className="flex flex-col gap-6 items-center">
        {(side === 'front' || (side === 'both' && (!interactive || activeTab === 'front'))) && (
          <div
            id={`card-front-${member.id}`}
            className="membership-card-front relative overflow-hidden rounded-[14px] shadow-lg border border-slate-300 select-none bg-gradient-to-br from-[#F4F9FF] via-[#EBF4FD] to-[#E2F0FD]"
            style={{
              width: `${340 * scale}px`,
              height: `${214 * scale}px`,
              minWidth: `${340 * scale}px`,
              minHeight: `${214 * scale}px`,
              transformOrigin: 'top left',
            }}
          >
            {/* Subtle Marble Texture / Clouds background */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.9) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.15) 0%, transparent 50%)',
              }}
            />

            {/* Top Header Row */}
            <div className="relative z-10 px-3.5 pt-2.5 flex items-center justify-between">
              {/* Crest Logo */}
              <div className="flex-shrink-0">
                <CrestLogo className="w-9 h-11 drop-shadow-sm" />
              </div>

              {/* Title & Motto */}
              <div className="flex-1 text-center px-1">
                <h2 className="text-[12px] font-extrabold tracking-wide text-[#0B2345] uppercase leading-tight font-sans">
                  METHODIST CHURCH GHANA
                </h2>
                <p className="text-[9.5px] italic font-medium text-[#123B70]">
                  Faith • Hope • Love
                </p>
                {/* MYC Dark Pill */}
                <div className="mt-0.5 inline-flex flex-col items-center justify-center bg-[#0B2345] px-3.5 py-0.5 rounded-md shadow-xs">
                  <span className="text-[10px] font-black tracking-widest text-white leading-tight">
                    MYC
                  </span>
                  <span className="text-[7.5px] font-medium text-[#38BDF8] tracking-normal leading-none -mt-0.5">
                    Methodist Youth Club
                  </span>
                </div>
              </div>

              {/* Top Right Mini Spacer */}
              <div className="w-8 flex-shrink-0" />
            </div>

            {/* Middle Content: Photo, Member Info, QR Code */}
            <div className="relative z-10 px-3.5 pt-1.5 flex items-center justify-between gap-2">
              {/* Member Photo or Fallback Avatar */}
              <div className="flex-shrink-0">
                <div className="w-[68px] h-[82px] rounded-lg overflow-hidden border-2 border-[#123B70] shadow-sm bg-white flex items-center justify-center relative">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center text-[#123B70]">
                      <User className="w-8 h-8 opacity-60" />
                      <span className="text-[7.5px] font-bold mt-1 text-slate-500 uppercase">
                        Photo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Member Details */}
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-[12.5px] font-extrabold text-[#0B2345] truncate leading-tight">
                  {member.full_name}
                </h3>

                <div className="mt-1 space-y-0.5 text-[8.5px]">
                  <div className="flex items-baseline">
                    <span className="text-slate-500 w-[72px] font-medium flex-shrink-0">
                      Membership ID:
                    </span>
                    <span className="font-extrabold text-[#0B2345] tracking-wide">
                      {member.membership_number}
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-slate-500 w-[72px] font-medium flex-shrink-0">
                      Phone:
                    </span>
                    <span className="font-bold text-[#172B4D] truncate">
                      {member.telephone}
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-slate-500 w-[72px] font-medium flex-shrink-0">
                      Email:
                    </span>
                    <span className="font-medium text-[#172B4D] truncate max-w-[105px]">
                      {member.email || '—'}
                    </span>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-slate-500 w-[72px] font-medium flex-shrink-0">
                      Date of Reg:
                    </span>
                    <span className="font-semibold text-slate-700">
                      {formattedRegDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code Block */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="p-1 bg-white rounded-lg border border-slate-300 shadow-xs">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Attendance QR Code"
                      className="w-[58px] h-[58px]"
                    />
                  ) : (
                    <div className="w-[58px] h-[58px] bg-slate-100 animate-pulse rounded" />
                  )}
                </div>
                <div className="mt-0.5 bg-[#0B2345] text-white text-[6.5px] font-bold px-2 py-0.5 rounded-full tracking-tight shadow-2xs whitespace-nowrap">
                  Scan for Attendance
                </div>
              </div>
            </div>

            {/* Bottom Swoop Banner and Script */}
            <div className="absolute bottom-0 inset-x-0 h-10 pointer-events-none select-none">
              {/* Bottom Left Script */}
              <div className="absolute left-3.5 bottom-1.5 z-20">
                <span className="text-[9px] italic text-white font-medium drop-shadow-xs">
                  Together in Christ
                </span>
              </div>

              {/* Triple Swoop Waves SVG */}
              <svg
                viewBox="0 0 340 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Yellow / Gold Wave */}
                <path
                  d="M 0 35 C 100 38, 200 24, 340 6 L 340 40 L 0 40 Z"
                  fill="#F59E0B"
                />
                {/* Red Wave */}
                <path
                  d="M 0 37 C 120 40, 220 22, 340 10 L 340 40 L 0 40 Z"
                  fill="#DC2626"
                />
                {/* Deep Navy Blue Base Wave */}
                <path
                  d="M 0 16 C 90 28, 180 34, 340 22 L 340 40 L 0 40 Z"
                  fill="#0B2345"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Back of Card */}
        {(side === 'back' || (side === 'both' && (!interactive || activeTab === 'back'))) && (
          <div
            id={`card-back-${member.id}`}
            className="membership-card-back relative overflow-hidden rounded-[14px] shadow-lg border border-slate-300 select-none bg-gradient-to-br from-[#F4F9FF] via-[#EBF4FD] to-[#E2F0FD]"
            style={{
              width: `${340 * scale}px`,
              height: `${214 * scale}px`,
              minWidth: `${340 * scale}px`,
              minHeight: `${214 * scale}px`,
              transformOrigin: 'top left',
            }}
          >
            {/* Top Navy Header Banner */}
            <div className="relative z-10 bg-[#0B2345] text-white pt-2 pb-1.5 px-3 text-center shadow-xs">
              <div className="flex items-center justify-center gap-2">
                <span className="h-[1px] w-8 bg-white/40" />
                <h2 className="text-[11.5px] font-extrabold tracking-wider uppercase font-sans">
                  METHODIST CHURCH GHANA
                </h2>
                <span className="h-[1px] w-8 bg-white/40" />
              </div>
              <h3 className="text-[10px] font-black tracking-widest text-[#F59E0B] uppercase mt-0.5">
                MEMBERSHIP CARD
              </h3>
            </div>

            {/* Two Column Layout */}
            <div className="relative z-10 px-3.5 pt-2 grid grid-cols-2 gap-3">
              {/* Left Column: Member Details */}
              <div className="flex flex-col">
                <div className="inline-block bg-[#0B2345] text-white text-[8px] font-bold px-2 py-0.5 rounded-md mb-1.5 self-start">
                  Member Details
                </div>

                <div className="space-y-1 text-[8.5px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User className="w-2.5 h-2.5 text-[#123B70] flex-shrink-0" />
                    <span className="text-slate-500 font-medium">Name:</span>
                    <span className="font-bold text-[#0B2345] truncate">
                      {member.full_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CreditCard className="w-2.5 h-2.5 text-[#123B70] flex-shrink-0" />
                    <span className="text-slate-500 font-medium">ID:</span>
                    <span className="font-extrabold text-[#0B2345]">
                      {member.membership_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="w-2.5 h-2.5 text-[#123B70] flex-shrink-0" />
                    <span className="text-slate-500 font-medium">Phone:</span>
                    <span className="font-bold text-[#172B4D]">
                      {member.telephone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="w-2.5 h-2.5 text-[#123B70] flex-shrink-0" />
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="font-medium text-[#172B4D] truncate max-w-[85px]">
                      {member.email || '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-2.5 h-2.5 text-[#123B70] flex-shrink-0" />
                    <span className="text-slate-500 font-medium">Date:</span>
                    <span className="font-semibold text-slate-700">
                      {formattedRegDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Mission & Church Silhouette */}
              <div className="flex flex-col border-l border-slate-300 pl-3 relative">
                <div className="inline-block bg-[#0B2345] text-white text-[8px] font-bold px-2 py-0.5 rounded-md mb-1.5 self-start">
                  Our Mission
                </div>

                <p className="text-[8.5px] italic font-medium text-[#0B2345] leading-relaxed">
                  “To make disciples of Jesus Christ for the transformation of the
                  world.”
                </p>

                {/* Church Silhouette graphic */}
                <div className="mt-1 flex justify-end opacity-90">
                  <ChurchSilhouette className="w-24 h-16" />
                </div>
              </div>
            </div>

            {/* Bottom Swoop Banner */}
            <div className="absolute bottom-0 inset-x-0 h-6 pointer-events-none select-none">
              <svg
                viewBox="0 0 340 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 20 C 100 22, 200 14, 340 4 L 340 24 L 0 24 Z"
                  fill="#F59E0B"
                />
                <path
                  d="M 0 22 C 120 24, 220 12, 340 6 L 340 24 L 0 24 Z"
                  fill="#DC2626"
                />
                <path
                  d="M 0 10 C 90 18, 180 22, 340 14 L 340 24 L 0 24 Z"
                  fill="#0B2345"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
