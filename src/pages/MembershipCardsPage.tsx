import React, { useState, useMemo } from 'react';
import { useChurch } from '../context/ChurchContext';
import { Member } from '../types/database';
import { MembershipCard } from '../components/MembershipCard';
import { downloadMemberCardPdf, downloadBatchCardsA4Pdf } from '../lib/cardExport';
import {
  CreditCard,
  Search,
  Printer,
  Download,
  Layers,
  HelpCircle,
  CheckSquare,
  Square,
  Users,
  Eye,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface MembershipCardsPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const MembershipCardsPage: React.FC<MembershipCardsPageProps> = ({ onNavigate }) => {
  const { members } = useChurch();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members.length > 0 ? members[0].id : ''
  );
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [showPrintingGuide, setShowPrintingGuide] = useState(false);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.membership_number.toLowerCase().includes(q) ||
        m.telephone.includes(q)
    );
  }, [members, searchQuery]);

  // Selected member for interactive card display
  const currentMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || (members.length > 0 ? members[0] : null);
  }, [members, selectedMemberId]);

  const handleSelectMember = (member: Member) => {
    setSelectedMemberId(member.id);
  };

  const toggleBatchSelect = (memberId: string) => {
    const next = new Set(batchSelectedIds);
    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    setBatchSelectedIds(next);
  };

  const selectAllFiltered = () => {
    if (batchSelectedIds.size === filteredMembers.length) {
      setBatchSelectedIds(new Set());
    } else {
      setBatchSelectedIds(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleDownloadSinglePdf = async () => {
    if (!currentMember) return;
    setIsExportingSingle(true);
    await downloadMemberCardPdf(currentMember);
    setIsExportingSingle(false);
  };

  const handleDownloadBatchPdf = async () => {
    const targetMembers = members.filter((m) => batchSelectedIds.has(m.id));
    if (targetMembers.length === 0) return;
    setIsExportingBatch(true);
    await downloadBatchCardsA4Pdf(targetMembers);
    setIsExportingBatch(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Double-Sided Printing Guide Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#38BDF8] bg-[#0B2345] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
            CR80 Official ID Card Designer
          </span>
          <h3 className="text-base font-extrabold text-[#0B2345]">
            Methodist Youth Club Membership Cards
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact 85.60 × 53.98 mm physical dimensions with cryptographic QR code validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrintingGuide(!showPrintingGuide)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#123B70]" />
            <span>Printing Guide</span>
          </button>

          {batchSelectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDownloadBatchPdf}
              disabled={isExportingBatch}
              className="px-4 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>
                {isExportingBatch
                  ? 'Generating Batch...'
                  : `Export Batch PDF (${batchSelectedIds.size})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Printing Guide Card (Collapsible) */}
      {showPrintingGuide && (
        <div className="bg-[#EAF6FF] p-5 rounded-2xl border border-[#38BDF8]/40 text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-[#0B2345] text-sm">
              Double-Sided ID Card Printing Guidelines
            </h4>
            <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded text-[#123B70] font-bold">
              CR80 Standard
            </span>
          </div>
          <p className="leading-relaxed">
            For best professional results on PVC card printers (e.g. Fargo, Zebra, Evolis) or A4 heavy cardstock:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
            <li>
              <strong>Direct PVC Card Printers:</strong> Use the <em>"Download Card PDF"</em> button. It exports at standard CR80 size (85.60 × 53.98 mm) at 300+ DPI. Select "Flip on Short Edge" for duplex printing.
            </li>
            <li>
              <strong>A4 Sheet Batch Printing:</strong> Select multiple members using the checkboxes below and click <em>"Export Batch PDF"</em>. This neatly lays out 8 cards per A4 page with cutting lines.
            </li>
            <li>
              <strong>Lamination & Alignment:</strong> When printing on standard printers, ensure printer scaling is set to <strong>100% (Actual Size)</strong>, not "Fit to Page", to preserve exact card scale.
            </li>
          </ul>
        </div>
      )}

      {/* Main Two-Column View: Left Card Preview, Right Member Directory Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Card Visual Preview & Actions */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-md flex flex-col items-center">
          {currentMember ? (
            <div className="w-full flex flex-col items-center space-y-6">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Selected Member
                  </span>
                  <h4 className="text-sm font-extrabold text-[#0B2345] truncate">
                    {currentMember.full_name}
                  </h4>
                  <span className="text-xs font-mono font-semibold text-[#123B70]">
                    {currentMember.membership_number}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSinglePdf}
                    disabled={isExportingSingle}
                    className="px-3.5 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{isExportingSingle ? 'Exporting...' : 'Download PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* High-fidelity Card Render */}
              <div className="w-full flex justify-center py-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <MembershipCard
                  member={currentMember}
                  side="both"
                  scale={1.12}
                  interactive={true}
                />
              </div>

              <div className="w-full text-center text-[11px] text-slate-400">
                Front and back designs faithfully reproduce the official Methodist Church Ghana MYC reference card.
              </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No Members Available</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Enroll church members to automatically generate printable membership cards.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('add_member')}
                className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl"
              >
                Enroll Member
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Member Selector & Batch Selection */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0B2345]">
                Select Member Card ({members.length})
              </h4>
              {filteredMembers.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-xs font-bold text-[#123B70] hover:text-[#38BDF8] flex items-center gap-1"
                >
                  {batchSelectedIds.size === filteredMembers.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#123B70]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Select All</span>
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member name or ID..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching members found
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isCurrent = currentMember?.id === member.id;
                const isBatchSelected = batchSelectedIds.has(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#EAF6FF] border-l-4 border-[#123B70]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBatchSelect(member.id);
                        }}
                        className="text-slate-400 hover:text-[#123B70]"
                      >
                        {isBatchSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#123B70]" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-[#0B2345] truncate">
                          {member.full_name}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono font-bold text-[#123B70]">
                            {member.membership_number}
                          </span>
                          <span>•</span>
                          <span>{member.telephone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-400">
                        {member.registration_date}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
