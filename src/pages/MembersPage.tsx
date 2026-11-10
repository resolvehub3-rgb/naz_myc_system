import React, { useState, useMemo, useRef } from 'react';
import { useChurch } from '../context/ChurchContext';
import { Member } from '../types/database';
import { MembershipCard } from '../components/MembershipCard';
import { downloadMemberCardPdf } from '../lib/cardExport';
import {
  Users,
  Search,
  UserPlus,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  Download,
  Eye,
  Edit2,
  X,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface MembersPageProps {
  onNavigate: (tab: NavTab) => void;
}

export const MembersPage: React.FC<MembersPageProps> = ({ onNavigate }) => {
  const { members, attendanceRecords, updateMember } = useChurch();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Member['membership_status']>('active');
  const [isSaving, setIsSaving] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Filter members based on search and status
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        member.full_name.toLowerCase().includes(q) ||
        member.membership_number.toLowerCase().includes(q) ||
        member.telephone.includes(q) ||
        (member.email && member.email.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || member.membership_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [members, searchQuery, statusFilter]);

  // Attendance history for selected member
  const memberAttendance = useMemo(() => {
    if (!selectedMember) return [];
    return attendanceRecords.filter((r) => r.member_id === selectedMember.id);
  }, [selectedMember, attendanceRecords]);

  const handleOpenProfile = (member: Member) => {
    setSelectedMember(member);
    setIsEditing(false);
    setEditFullName(member.full_name);
    setEditPhone(member.telephone);
    setEditEmail(member.email || '');
    setEditPhotoUrl(member.photo_url || null);
    setEditStatus(member.membership_status);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
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
          setEditPhotoUrl(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setEditPhotoUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setEditPhotoUrl(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;
    setIsSaving(true);
    try {
      await updateMember(selectedMember.id, {
        full_name: editFullName.trim(),
        telephone: editPhone.trim(),
        email: editEmail.trim() || null,
        photo_url: editPhotoUrl || null,
        membership_status: editStatus,
      });
      setSelectedMember({
        ...selectedMember,
        full_name: editFullName.trim(),
        telephone: editPhone.trim(),
        email: editEmail.trim() || null,
        photo_url: editPhotoUrl || null,
        membership_status: editStatus,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update member:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCard = async (member: Member) => {
    await downloadMemberCardPdf(member);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filters, Add Member button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID (e.g. MYC-000001), phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B70]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('add_member')}
          className="px-4 py-2 bg-[#123B70] hover:bg-[#0B2345] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <UserPlus className="w-4 h-4 text-[#38BDF8]" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No members match your criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery
                ? 'Try a different name, telephone number, or membership number.'
                : 'No members have been enrolled yet. Register your first member to generate their ID card.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('add_member')}
              className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl"
            >
              Add Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Membership ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Telephone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-extrabold text-[#0B2345]">
                      {member.membership_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.full_name}
                            className="w-7 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {member.full_name.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-slate-900">{member.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {member.telephone}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {member.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {member.registration_date}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          member.membership_status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : member.membership_status === 'inactive'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {member.membership_status === 'active' && <CheckCircle className="w-2.5 h-2.5" />}
                        {member.membership_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(member)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#123B70] hover:bg-slate-100 transition-colors"
                          title="View Profile & Attendance History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(member);
                            setIsCardModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-[#123B70] hover:bg-[#EAF6FF] transition-colors"
                          title="View / Print Membership Card"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Profile & Attendance History Modal */}
      {selectedMember && !isCardModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#0B2345] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-[#38BDF8] uppercase">
                  Member Profile
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {selectedMember.full_name}
                </h3>
                <span className="text-xs font-mono text-slate-300">
                  {selectedMember.membership_number}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Tabs / Info */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Member Details or Edit Mode */}
              {isEditing ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-[#0B2345] uppercase">Edit Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Telephone
                      </label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Member Portrait Photo
                      </label>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        {editPhotoUrl ? (
                          <img
                            src={editPhotoUrl}
                            alt="Preview"
                            className="w-12 h-14 rounded-xl object-cover border border-slate-300"
                          />
                        ) : (
                          <div className="w-12 h-14 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold">
                            No Photo
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-[#123B70] text-[#123B70] font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Choose from Device</span>
                          </button>
                          {editPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setEditPhotoUrl(null)}
                              className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-4 py-1.5 bg-[#123B70] text-white font-bold rounded-lg text-xs"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start justify-between">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Telephone
                      </span>
                      <span className="font-bold text-slate-800">{selectedMember.telephone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Email Address
                      </span>
                      <span className="font-semibold text-slate-700">
                        {selectedMember.email || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Enrolled On
                      </span>
                      <span className="font-semibold text-slate-700">
                        {selectedMember.registration_date}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Status
                      </span>
                      <span className="font-bold text-emerald-700 uppercase">
                        {selectedMember.membership_status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs font-bold text-[#123B70] bg-white border border-slate-200 rounded-xl hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCardModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-[#123B70] rounded-xl hover:bg-[#0B2345] flex items-center gap-1 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>ID Card</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Attendance History Log */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-[#0B2345]">
                    Attendance History ({memberAttendance.length} Meetings Attended)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold">Preserved Log</span>
                </div>

                {memberAttendance.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    No attendance recorded yet for this member.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-500 uppercase text-[9.5px]">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Arrival Time</th>
                          <th className="py-2 px-3">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {memberAttendance.map((rec) => (
                          <tr key={rec.id}>
                            <td className="py-2 px-3 font-medium text-slate-700">
                              {new Date(rec.arrival_timestamp).toLocaleDateString('en-GB')}
                            </td>
                            <td className="py-2 px-3 font-semibold text-[#0B2345]">
                              {new Date(rec.arrival_timestamp).toLocaleTimeString('en-GB')}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-medium">
                              {rec.attendance_method}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Membership Card Preview & Print Modal */}
      {isCardModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#38BDF8] bg-[#0B2345] px-2 py-0.5 rounded uppercase">
                  CR80 Card Designer
                </span>
                <h3 className="text-sm font-bold text-[#0B2345] mt-1">
                  {selectedMember.full_name} ({selectedMember.membership_number})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCardModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MembershipCard member={selectedMember} side="both" scale={1.1} interactive={true} />

            <div className="w-full pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDownloadCard(selectedMember)}
                className="px-4 py-2 bg-[#123B70] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0B2345] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
