import React, { useState, useRef } from 'react';
import { useChurch } from '../context/ChurchContext';
import { Member } from '../types/database';
import { MembershipCard } from '../components/MembershipCard';
import { downloadMemberCardPdf } from '../lib/cardExport';
import { formatGhanaPhoneNumber } from '../lib/attendanceLogic';
import {
  UserPlus,
  CreditCard,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  User,
  FileText,
  Camera,
  Upload,
  Trash2,
  ImageIcon,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface AddMemberPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const AddMemberPage: React.FC<AddMemberPageProps> = ({ onNavigate }) => {
  const { registerMember } = useChurch();

  const [fullName, setFullName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredMember, setRegisteredMember] = useState<Member | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setPhotoFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Optimize portrait image size for CR80 card
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPhotoUrl(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setPhotoUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setPhotoUrl(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    setPhotoFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate phone number
    const phoneCheck = formatGhanaPhoneNumber(telephone);
    if (!phoneCheck.isValid) {
      setErrorMsg('Please enter a valid Ghanaian phone number (e.g. 024 123 4567 or +233241234567)');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerMember({
        full_name: fullName.trim(),
        telephone: phoneCheck.formatted,
        email: email.trim() || undefined,
        photo_url: photoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success || !res.member) {
        setErrorMsg(res.error || 'Failed to register church member');
      } else {
        setRegisteredMember(res.member);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!registeredMember) return;
    setIsDownloadingPdf(true);
    await downloadMemberCardPdf(registeredMember);
    setIsDownloadingPdf(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetForm = () => {
    setRegisteredMember(null);
    setFullName('');
    setTelephone('');
    setEmail('');
    setPhotoUrl('');
    setPhotoFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setNotes('');
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* If a member was just registered, display Success Card & ID Card Preview */}
      {registeredMember ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">
                  Enrollment Complete
                </span>
                <h3 className="text-lg font-extrabold text-[#0B2345]">
                  {registeredMember.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: <span className="font-bold text-[#123B70]">{registeredMember.membership_number}</span> • Registered {registeredMember.registration_date}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-4 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Card PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
            </div>
          </div>

          {/* Membership Card Visual Preview */}
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/80 p-6 rounded-2xl border border-slate-200 flex flex-col items-center">
            <div className="text-center mb-4">
              <span className="text-xs font-bold text-[#0B2345] uppercase tracking-wider block">
                Official MYC Membership Card
              </span>
              <p className="text-[11px] text-slate-500">
                Standard CR80 dimensions (85.60 × 53.98 mm) with auto-generated QR code
              </p>
            </div>

            <MembershipCard member={registeredMember} side="both" scale={1.1} interactive={true} />
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#123B70] transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4 text-[#38BDF8]" />
              <span>Enroll Another Member</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('members')}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              View All Members Directory
            </button>
          </div>
        </div>
      ) : (
        /* Registration Form */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md inline-block mb-1.5">
              MYC Digital Enrollment
            </span>
            <h3 className="text-lg font-extrabold text-[#0B2345]">Register New Church Member</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Membership ID and scannable QR attendance credential are automatically generated upon submission.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samuel Mensah"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                  />
                </div>
              </div>

              {/* Telephone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telephone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="e.g. 024 123 4567"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ghana standard: 10 digits starting with 02, 05, 03
                </span>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuel.mensah@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                  />
                </div>
              </div>

              {/* Member Photo - Choose from Device */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Member Photo <span className="text-slate-400 font-normal">(Optional, for ID card portrait)</span>
                </label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                {photoUrl ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={photoUrl}
                        alt="Member portrait"
                        className="w-14 h-16 rounded-xl object-cover border border-slate-300 shadow-2xs flex-shrink-0 bg-white"
                      />
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mb-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Photo Selected from Device
                        </span>
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {photoFileName || 'Member portrait image ready'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Applied directly to official CR80 ID Card
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#123B70] text-[#123B70] text-xs font-bold rounded-xl transition-colors shadow-2xs"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#123B70] rounded-2xl p-5 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-[#EAF6FF]/40 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#123B70] group-hover:border-[#123B70] flex items-center justify-center mx-auto mb-2 shadow-2xs transition-colors">
                      <Camera className="w-6 h-6 text-[#123B70]" />
                    </div>
                    <span className="text-xs font-extrabold text-[#0B2345] block group-hover:text-[#123B70]">
                      Choose Member Photo from Device
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Click to choose JPG or PNG portrait, or take picture with camera
                    </span>
                    <button
                      type="button"
                      className="mt-3 px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-[#123B70] rounded-xl shadow-2xs group-hover:bg-[#123B70] group-hover:text-white transition-all inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Device</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Youth Fellowship Subgroup <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Singing Band, Choir, Prayer Committee, Ushering team"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Date: <strong className="text-slate-700">{new Date().toLocaleDateString('en-GB')}</strong>
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#38BDF8]" />
                    <span>Enrolling & Designing Card...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#38BDF8]" />
                    <span>Register & Generate Membership Card</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
