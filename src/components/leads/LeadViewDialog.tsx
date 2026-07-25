// // components/leads/LeadViewDialog.tsx
// // View dialog with editable Status + Next Follow-up (shared by List and Kanban)

// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { toast } from 'react-toastify';
// import Dialog, { CenterDialog } from '@/components/Dialog';
// import { baseUrl, getAuthToken } from '@/config';
// import { ApiLead, ApiStatus } from './types';
// import { Eye, Download, FileText, Image, File, FileSpreadsheet } from 'lucide-react';
// import { getFileIcon } from '@/utills/utill';
import { useAppSelector } from '@/redux/hooks';

// interface Props {
//   lead: ApiLead | null;
//   statuses: ApiStatus[];
//   onClose: () => void;
//   onRefresh: () => void;
// }

// export default function LeadViewDialog({ lead, statuses, onClose, onRefresh }: Props) {
//   const [editStatus, setEditStatus] = useState('');
//   const [editNextDate, setEditNextDate] = useState('');
//   const [editNextTime, setEditNextTime] = useState('');
//   const [followupNote, setFollowupNote] = useState('');
//   const [saving, setSaving] = useState(false);
//   const [addingFollowup, setAddingFollowup] = useState(false);
//   const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);

//   useEffect(() => {
//     if (lead) {
//       setEditStatus(lead.leadStatus?._id || '');
//       setEditNextDate(lead.nextFollowupDate || '');
//       setEditNextTime(lead.nextFollowupTime || '');
//     }
//   }, [lead]);

//   const handleSave = async () => {
//     if (!lead) return;
//     setSaving(true);
//     try {
//       await axios.put(
//         `${baseUrl.updateLead}/${lead._id}`,
//         {
//           leadStatus: editStatus,
//         },
//         { headers: { Authorization: `Bearer ${getAuthToken()}` } }
//       );
//       toast.success('Lead status updated');
//       onRefresh();
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message || 'Failed to update lead');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleAddFollowup = async () => {
//     if (!lead || !editNextDate || !followupNote) return;
//     setAddingFollowup(true);
//     try {
//       // Get current user from localStorage or somewhere? 
//       // Most of our other components don't store user in a hook, 
//       // but the backend will know who is logged in from the token.

//       const newFollowup = {
//         date: editNextDate,
//         time: editNextTime,
//         note: followupNote,
//         // Backend handles staff ID if not provided, but we send if we had it.
//         // For now, let's just send the data.
//       };

//       const updatedFollowUps = [...(lead.followUps || []), newFollowup];

//       await axios.put(
//         `${baseUrl.updateLead}/${lead._id}`,
//         {
//           followUps: updatedFollowUps,
//           nextFollowupDate: editNextDate, // Update the lead's main "next" date too
//           nextFollowupTime: editNextTime,
//           lastFollowUp: new Date().toISOString().split('T')[0] // Set today as last followup
//         },
//         { headers: { Authorization: `Bearer ${getAuthToken()}` } }
//       );

//       toast.success('Follow-up recorded successfully');
//       setFollowupNote('');
//       setEditNextDate('');
//       setEditNextTime('');
//       onRefresh();
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message || 'Failed to add follow-up');
//     } finally {
//       setAddingFollowup(false);
//     }
//   };

//   const handleView = (attachment: any) => {
//     const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
//     const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(attachment.filename);

//     if (isImage) {
//       setPreviewAttachment({
//         url: fileUrl,
//         name: attachment.originalName,
//         type: 'image'
//       });
//     } else {
//       window.open(fileUrl, '_blank');
//     }
//   };

//   const handleDownload = async (attachment: any) => {
//     try {
//       const fileUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
//       const response = await fetch(fileUrl, {
//         headers: { Authorization: `Bearer ${getAuthToken()}` }
//       });

//       if (!response.ok) throw new Error('Download failed');

//       const blob = await response.blob();
//       const blobUrl = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.download = attachment.originalName;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(blobUrl);
//       toast.success('Download started');
//     } catch (error) {
//       console.error('Download error:', error);
//       toast.error('Failed to download file');
//     }
//   };

//   return (
//     <>
//       <Dialog
//         isOpen={!!lead}
//         onClose={onClose}
//         title="Lead Details"
//         size="lg"
//         footer={
//           <>
//             <button
//               onClick={onClose}
//               className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               Close
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
//             >
//               {saving ? 'Saving...' : 'Save Changes'}
//             </button>
//           </>
//         }
//       >
//         {lead && (
//           <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
//             <h2 className="text-xl font-bold text-gray-900">{lead.fullName}</h2>

//             {/* Info grid */}
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               <InfoCard label="Company" value={lead.companyName} />
//               <InfoCard label="Phone" value={lead.contact} />
//               <InfoCard label="Email" value={lead.email} />
//               <InfoCard label="Source" value={lead.leadSource?.name} />
//               <InfoCard label="Assigned Staff" value={lead.assignedTo?.fullName} />
//               <InfoCard
//                 label="Priority"
//                 value={
//                   lead.priority ? (
//                     <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${lead.priority.toLowerCase() === 'high'
//                         ? 'bg-red-100 text-red-600'
//                         : lead.priority.toLowerCase() === 'medium'
//                           ? 'bg-yellow-100 text-yellow-700'
//                           : 'bg-green-100 text-green-700'
//                       }`}>
//                       {lead.priority}
//                     </span>
//                   ) : '-'
//                 }
//               />
//               <InfoCard label="Last Follow-Up" value={lead.lastFollowUp} />
//               <InfoCard label="Active" value={lead.isActive ? 'Yes' : 'No'} />
//             </div>

//             {/* Address */}
//             {lead.address && <InfoCard label="Address" value={lead.address} />}

//             <div className="rounded-lg bg-gray-50 p-4">
//               <div className="mb-3 text-sm font-medium text-gray-600">Status</div>
//               <div className="flex flex-wrap gap-2">
//                 {statuses.map((s) => (
//                   <button
//                     key={s._id}
//                     onClick={() => setEditStatus(s._id)}
//                     className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${editStatus === s._id
//                         ? 'bg-secondary text-white shadow'
//                         : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
//                       }`}
//                   >
//                     {s.name}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Follow-up History */}
//             <div className="rounded-lg bg-gray-50 p-4">
//               <div className="mb-3 text-sm font-bold text-gray-800 flex items-center justify-between">
//                 <span>Follow-Up History</span>
//                 <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-normal">
//                   {lead.followUps?.length || 0} Records
//                 </span>
//               </div>

//               {/* Add New Follow-up Section */}
//               <div className="mb-6 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Follow-up</h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-xs font-medium text-gray-500">Date</label>
//                     <input
//                       type="date"
//                       value={editNextDate}
//                       onChange={(e) => setEditNextDate(e.target.value)}
//                       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none"
//                     />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-xs font-medium text-gray-500">Time</label>
//                     <input
//                       type="time"
//                       value={editNextTime}
//                       onChange={(e) => setEditNextTime(e.target.value)}
//                       className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none"
//                     />
//                   </div>
//                 </div>
//                 <div className="mt-3 space-y-1">
//                   <label className="text-xs font-medium text-gray-500">Note / Summary</label>
//                   <textarea
//                     value={followupNote}
//                     onChange={(e) => setFollowupNote(e.target.value)}
//                     placeholder="Describe the interaction..."
//                     rows={3}
//                     className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none"
//                   />
//                 </div>
//                 <button
//                   onClick={handleAddFollowup}
//                   disabled={!editNextDate || !followupNote || addingFollowup}
//                   className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                 >
//                   {addingFollowup ? 'Recording...' : 'Record Follow-up'}
//                 </button>
//               </div>

//               {/* Follow-up Table */}
//               {lead.followUps && lead.followUps.length > 0 ? (
//                 <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
//                   <table className="w-full text-left text-sm">
//                     <thead>
//                       <tr className="bg-gray-50 border-b border-gray-100">
//                         <th className="px-4 py-3 font-semibold text-gray-600">Date & Time</th>
//                         <th className="px-4 py-3 font-semibold text-gray-600">Note</th>
//                         <th className="px-4 py-3 font-semibold text-gray-600">Staff</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-50">
//                       {[...(lead.followUps || [])].reverse().map((f, i) => (
//                         <tr key={f._id || i} className="hover:bg-gray-50/50 transition-colors">
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="font-medium text-gray-900">{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</div>
//                             <div className="text-xs text-gray-500">{f.time || ''}</div>
//                           </td>
//                           <td className="px-4 py-3 max-w-xs overflow-hidden">
//                             <p className="text-gray-700 break-words leading-relaxed">{f.note}</p>
//                           </td>
//                           <td className="px-4 py-3 whitespace-nowrap">
//                             <div className="flex items-center gap-2">
//                               <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
//                                 {f.staff?.fullName?.charAt(0) || 'U'}
//                               </div>
//                               <span className="text-gray-600">{f.staff?.fullName || 'System'}</span>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="py-8 text-center bg-white rounded-xl border border-gray-100 border-dashed">
//                   <p className="text-gray-400">No follow-up history available yet.</p>
//                 </div>
//               )}
//             </div>

//             {/* Labels */}
//             {lead.leadLabel && lead.leadLabel.length > 0 && (
//               <div className="rounded-lg bg-gray-50 p-4">
//                 <div className="mb-2 text-sm font-medium text-gray-600">Labels</div>
//                 <div className="flex flex-wrap gap-2">
//                   {lead.leadLabel.map((l) => (
//                     <span
//                       key={l._id}
//                       style={{ backgroundColor: l.color }}
//                       className="rounded-md px-2 py-1 text-xs font-medium text-white"
//                     >
//                       {l.name}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Note */}
//             {lead.note && (
//               <div className="rounded-lg bg-gray-50 p-4">
//                 <div className="mb-1 text-sm font-medium text-gray-600">Primary Note</div>
//                 <p className="text-gray-800 whitespace-pre-wrap">{lead.note}</p>
//               </div>
//             )}

//             {/* Attachments */}
//             {lead.attachments && lead.attachments.length > 0 && (
//               <div className="rounded-lg bg-gray-50 p-4">
//                 <div className="mb-3 text-sm font-medium text-gray-600 flex items-center gap-2">
//                   <span>Attachments</span>
//                   <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
//                     {lead.attachments.length}
//                   </span>
//                 </div>
//                 <div className="space-y-2">
//                   {lead.attachments.map((att: any, idx) => {
//                     const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att?.filename || "");

//                     return (
//                       <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
//                         {/* File Icon/Thumbnail */}
//                         <div className="flex-shrink-0">
//                           {isImage ? (
//                             <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200">
//                               <img
//                                 src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${att?.path}`}
//                                 alt={att?.originalName}
//                                 className="w-full h-full object-cover"
//                               />
//                             </div>
//                           ) : (
//                             <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
//                               {getFileIcon(att?.filename || "")}
//                             </div>
//                           )}
//                         </div>

//                         {/* File Info */}
//                         <div className="flex-1 min-w-0">
//                           <p className="text-sm font-medium text-gray-900 truncate">{att.originalName}</p>
//                           <p className="text-xs text-gray-500">
//                             {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''} •
//                             {att.filename?.split('.').pop()?.toUpperCase()}
//                           </p>
//                         </div>

//                         {/* Action Buttons */}
//                         <div className="flex items-center gap-1">
//                           <button
//                             onClick={() => handleView(att)}
//                             className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
//                             title="View"
//                           >
//                             <Eye className="h-4 w-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDownload(att)}
//                             className="p-2 hover:bg-green-50 rounded-lg transition-colors text-gray-600 hover:text-green-600"
//                             title="Download"
//                           >
//                             <Download className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* Lost info */}
//             {lead.isLost && (
//               <div className="rounded-lg bg-red-50 p-4">
//                 <div className="mb-2 text-sm font-semibold text-red-600">Lost Information</div>
//                 <div className="space-y-1 text-sm text-red-800">
//                   <div>Lost Date: {lead.lostDate ? new Date(lead.lostDate).toLocaleDateString() : 'N/A'}</div>
//                   <div>Reason: {lead.lostReason || 'Not specified'}</div>
//                 </div>
//               </div>
//             )}

//             {/* Won info */}
//             {lead.isWon && (
//               <div className="rounded-lg bg-green-50 p-4">
//                 <div className="mb-2 text-sm font-semibold text-green-700">Won Information</div>
//                 <div className="space-y-1 text-sm text-green-800">
//                   <div>Won Date: {lead.wonDate ? new Date(lead.wonDate).toLocaleDateString() : 'N/A'}</div>
//                   <div>Amount: {lead.amount ? `₹${lead.amount.toLocaleString()}` : 'Not specified'}</div>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </Dialog>

//       {/* Image Preview Modal */}
//       {previewAttachment && (
//         <CenterDialog
//           isOpen={true}
//           onClose={() => setPreviewAttachment(null)}
//         >
//           <div className="relative">
//             <img
//               src={previewAttachment.url}
//               alt={previewAttachment.name}
//               className="max-w-full max-h-[70vh] object-contain mx-auto"
//             />
//             <div className="absolute top-4 right-4 flex gap-2">
//               <a
//                 href={previewAttachment.url}
//                 download={previewAttachment.name}
//                 className="bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg transition-colors"
//                 title="Download"
//               >
//                 <Download className="h-5 w-5 text-gray-700" />
//               </a>
//             </div>
//           </div>
//         </CenterDialog>
//       )}
//     </>
//   );
// }

// function InfoCard({
//   label,
//   value,
// }: {
//   label: string;
//   value?: string | React.ReactNode | null;
// }) {
//   return (
//     <div className="rounded-lg bg-gray-50 p-3">
//       <div className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
//       <div className="text-gray-900">
//         {typeof value === 'string' || value === undefined || value === null
//           ? value || '-'
//           : value}
//       </div>
//     </div>
//   );
// }
// components/leads/LeadViewDialog.tsx
// View dialog with editable Status + Next Follow-up (shared by List and Kanban)

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Dialog, { CenterDialog } from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';
import { FiPhone, FiMail, FiMapPin, FiCalendar, FiClock, FiCheckSquare, FiMessageSquare, FiList, FiEdit2, FiX, FiCheck, FiFileText } from 'react-icons/fi';
import CustomTimePicker from '../ui/CustomTimePicker';
import { Eye, Download, FileText, Image, File, FileSpreadsheet, Search, Trash2, MessageCircle, CheckCircle2 } from 'lucide-react';
import { getFileIcon } from '@/utills/utill';
import LeadQuotationDialog from './LeadQuotationDialog';
import { FormSelect } from '../ui/FormSelect';
import { generateQuotationPDF } from '@/utills/quotationPdfGenerator';
import DatePicker from 'react-datepicker';
import Swal from 'sweetalert2';
import moment from 'moment';
interface Props {
  lead: ApiLead | null;
  statuses: ApiStatus[];
  onClose: () => void;
  onRefresh: () => void;
  currentUser?: any;
  isAdmin?: boolean;
  permissions?: {
    create: boolean;
    readAll: boolean;
    readOwn: boolean;
    update: boolean;
    delete: boolean;
    assign: boolean;
    transfer: boolean;
    convert: boolean;
  };
}

// Interface for follow-up
interface FollowUp {
  _id?: string;
  date: string;
  time?: string;
  note: string;
  staff?: {
    _id: string;
    fullName: string;
  };
  createdAt?: string;
}

export default function LeadViewDialog({ lead, statuses, onClose, onRefresh, currentUser, isAdmin, permissions }: Props) {
  const [editStatus, setEditStatus] = useState('');
  const [editNextDate, setEditNextDate] = useState('');
  const [editNextTime, setEditNextTime] = useState('');
  const [followupNote, setFollowupNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingFollowup, setAddingFollowup] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [localFollowUps, setLocalFollowUps] = useState<FollowUp[]>([]);
  const [localAttachments, setLocalAttachments] = useState<any[]>([]);
  const [localActivities, setLocalActivities] = useState<any[]>([]);
  const [localQuotations, setLocalQuotations] = useState<any[]>([]);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [editQuotationIndex, setEditQuotationIndex] = useState<number | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignUsers, setReassignUsers] = useState<any[]>([]);
  const [selectedReassignUser, setSelectedReassignUser] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [localAssignedTo, setLocalAssignedTo] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [visitDone, setVisitDone] = useState<boolean | null>(null);
  const [localVisitDate, setLocalVisitDate] = useState<string>('');
  const canUpdateLead = useMemo(() => {
    if (isAdmin) return true;
    if (!permissions?.update) return false;
    if (permissions.readAll) return true;
    if (permissions.readOwn) {
      const userId = currentUser?._id;
      if (!userId) return false;
      const assignedId = typeof lead?.assignedTo === 'object' ? lead?.assignedTo?._id : lead?.assignedTo;
      const createdById = typeof lead?.createdBy === 'object' ? lead?.createdBy?._id : lead?.createdBy;
      return String(assignedId) === String(userId) || String(createdById) === String(userId);
    }
    return false;
  }, [lead, permissions, currentUser, isAdmin]);

  const isWon = useMemo(() => lead?.leadStatus?.name?.toLowerCase() === 'won', [lead]);

  useEffect(() => {
    if (lead) {
      setEditStatus(lead.leadStatus?._id || '');
      setEditNextDate(lead.nextFollowupDate || '');
      setEditNextTime(lead.nextFollowupTime || '');
      setLocalFollowUps(lead.followUps || []);
      setLocalAttachments(lead.attachments || []);
      setLocalActivities(lead.activities || []);
      setLocalAssignedTo(lead.assignedTo || null);
      setLocalQuotations(lead.quotations || []);
      setVisitDone(lead.isVisitDone ?? null);
      if (lead.visitDate) {
        setLocalVisitDate(lead.visitDate.toString().split('T')[0]);
      } else {
        setLocalVisitDate('');
      }
    }
  }, [lead]);

  const filteredFollowUps = useMemo(() => {
    if (!followUpSearch.trim()) return localFollowUps;
    const search = followUpSearch.toLowerCase();
    return localFollowUps.filter(f => 
      (f.note?.toLowerCase() || '').includes(search) ||
      (f.date?.toLowerCase() || '').includes(search) ||
      (f.time?.toLowerCase() || '').includes(search) ||
      (f.staff?.fullName?.toLowerCase() || '').includes(search)
    );
  }, [localFollowUps, followUpSearch]);

  // Get current staff info and departments
  const currentStaff = useAppSelector((state: any) => state.auth.currentStaff);
  useEffect(() => {
    if (currentStaff) {
      setStaffInfo(currentStaff);
    }
  }, [currentStaff]);

  useEffect(() => {
    if (!lead) return;
    const fetchDepartments = async () => {
      try {
        const headers = { Authorization: `Bearer ${getAuthToken()}` };
        const deptRes = await axios.get(baseUrl.department, { headers }).catch(() => ({ data: { data: [] } }));
        setDepartments(deptRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch departments', error);
      }
    };
    fetchDepartments();
  }, [lead]);

  const assignedToDeptName = useMemo(() => {
    if (!localAssignedTo?.department) return '';
    const d = departments.find(dept => dept._id === localAssignedTo.department);
    return d ? (d.roleName || d.name) : '';
  }, [localAssignedTo, departments]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const res = await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        {
          leadStatus: editStatus,
          isVisitDone: visitDone,
          visitDate: visitDone ? localVisitDate : null,
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      if (res.data?.data?.activities) {
        setLocalActivities(res.data.data.activities);
      }
      toast.success('Lead status updated');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const handleVisitChange = (value: boolean) => {
    if (!lead || !canUpdateLead) return;
    setVisitDone(value);
    
    // If setting to false, clear the visit date
    if (!value) {
      setLocalVisitDate('');
    }
  };

  const handleVisitDateChange = (dateStr: string) => {
    if (!lead || !canUpdateLead) return;
    setLocalVisitDate(dateStr);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lead || !e.target.files || e.target.files.length === 0) return;
    
    setSaving(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      if (response.data?.data?.attachments) {
        setLocalAttachments(response.data.data.attachments);
      }
      
      toast.success('Attachments uploaded successfully');
      onRefresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload attachments');
    } finally {
      setSaving(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleAddFollowup = async () => {
    if (!lead || !editNextDate || !followupNote) return;
    setAddingFollowup(true);

    // Create temporary follow-up object with optimistic update
    const tempFollowUp: FollowUp = {
      date: editNextDate,
      time: editNextTime,
      note: followupNote,
      staff: staffInfo ? {
        _id: staffInfo._id,
        fullName: staffInfo.fullName || 'Current User'
      } : undefined,
      _id: `temp_${Date.now()}`, // Temporary ID
      createdAt: new Date().toISOString()
    };

    // Optimistically add to local state
    setLocalFollowUps(prev => [tempFollowUp, ...prev]);

    // Clear form fields
    setFollowupNote('');
    setEditNextDate('');
    setEditNextTime('');

    try {
      const newFollowup = {
        date: editNextDate,
        time: editNextTime,
        note: followupNote,
      };

      const cleanLocalFollowUps = localFollowUps
        .filter(f => !f._id?.startsWith('temp_'))
        .map(f => ({
          date: f.date,
          time: f.time,
          note: f.note,
          staff: f.staff?._id || f.staff
        }));

      const updatedFollowUps = [...cleanLocalFollowUps, newFollowup];

      const response = await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        {
          followUps: updatedFollowUps,
          nextFollowupDate: editNextDate,
          nextFollowupTime: editNextTime,
          lastFollowUp: new Date().toISOString().split('T')[0]
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      // Update with actual data from server
      if (response.data?.data?.followUps) {
        setLocalFollowUps(response.data.data.followUps);
      }

      toast.success('Follow-up recorded successfully');
      onRefresh();
    } catch (e: any) {
      // Remove the temporary follow-up on error
      setLocalFollowUps(prev => prev.filter(f => f._id !== tempFollowUp._id));
      toast.error(e?.response?.data?.message || 'Failed to add follow-up');
    } finally {
      setAddingFollowup(false);
    }
  };

  const handleDeleteFollowup = async (fId: string) => {
    if (!lead) return;
    const result = await Swal.fire({
      html: `
        <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[#A63C71]/10 text-[#A63C71] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </div>
            <h2 class="text-lg font-bold text-[#1f2937] mb-1">Delete Follow-up?</h2>
            <p class="text-[14px] text-gray-500 leading-relaxed">Are you sure you want to delete<br/>this follow-up record?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      background: '#ffffff',
      width: '340px',
      padding: '24px',
      backdrop: 'rgba(0,0,0,0.5)',
      customClass: {
        popup: 'rounded-[24px] shadow-2xl border border-gray-100',
        htmlContainer: 'm-0 p-0',
        actions: 'flex w-full gap-3 mt-6 mb-0 p-0',
        confirmButton: 'flex-1 bg-[#A63C71] text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-[#8f325f] transition-all m-0 outline-none focus:ring-2 focus:ring-[#A63C71]/50 focus:ring-offset-1 border-0',
        cancelButton: 'flex-1 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all m-0 outline-none focus:ring-2 focus:ring-gray-200'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const updatedFollowUps = localFollowUps
        .filter(f => f._id !== fId)
        .map(f => ({
          date: f.date,
          time: f.time,
          note: f.note,
          staff: f.staff?._id || f.staff
        }));

      const response = await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        { followUps: updatedFollowUps },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      if (response.data?.data?.followUps) {
        setLocalFollowUps(response.data.data.followUps);
      }
      toast.success('Follow-up deleted successfully');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete follow-up');
    }
  };

  const handleView = (attachment: any) => {
    const fileUrl = attachment.path?.startsWith('http') ? attachment.path : `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(attachment.filename || attachment.path);

    if (isImage) {
      setPreviewAttachment({
        url: fileUrl,
        name: attachment.originalName,
        type: 'image'
      });
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  const handleDeleteAttachment = async (attachment: any) => {
    const result = await Swal.fire({
      html: `
        <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[#A63C71]/10 text-[#A63C71] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </div>
            <h2 class="text-lg font-bold text-[#1f2937] mb-1">Delete Attachment?</h2>
            <p class="text-[14px] text-gray-500 leading-relaxed">Are you sure you want to delete<br/>the attachment?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      background: '#ffffff',
      width: '340px',
      padding: '24px',
      backdrop: 'rgba(0,0,0,0.5)',
      customClass: {
        popup: 'rounded-[24px] shadow-2xl border border-gray-100',
        htmlContainer: 'm-0 p-0',
        actions: 'flex w-full gap-3 mt-6 mb-0 p-0',
        confirmButton: 'flex-1 bg-[#A63C71] text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-[#8f325f] transition-all m-0 outline-none focus:ring-2 focus:ring-[#A63C71]/50 focus:ring-offset-1 border-0',
        cancelButton: 'flex-1 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all m-0 outline-none focus:ring-2 focus:ring-gray-200'
      }
    });

    if (!result.isConfirmed) return;
    
    try {
      await axios.delete(
        `${baseUrl.getBaseUrl?.endsWith('/') ? baseUrl.getBaseUrl.slice(0, -1) : baseUrl.getBaseUrl}/lead/${lead?._id}/attachments/${attachment._id}`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setLocalAttachments(prev => prev.filter(a => a._id !== attachment._id));
      toast.success('Attachment deleted successfully');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete attachment');
    }
  };

  const handleDeleteQuotation = async (indexToDelete: number) => {
    if (!lead) return;
    const quotation = localQuotations[indexToDelete];
    const result = await Swal.fire({
      html: `
        <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[#A63C71]/10 text-[#A63C71] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </div>
            <h2 class="text-lg font-bold text-[#1f2937] mb-1">Delete Quotation?</h2>
            <p class="text-[14px] text-gray-500 leading-relaxed">Are you sure you want to delete the quotation<br/>for <b>${quotation.kw || lead.kwRequirement || 'this lead'}</b>?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      background: '#ffffff',
      width: '340px',
      padding: '24px',
      backdrop: 'rgba(0,0,0,0.5)',
      customClass: {
        popup: 'rounded-[24px] shadow-2xl border border-gray-100',
        htmlContainer: 'm-0 p-0',
        actions: 'flex w-full gap-3 mt-6 mb-0 p-0',
        confirmButton: 'flex-1 bg-[#A63C71] text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-[#8f325f] transition-all m-0 outline-none focus:ring-2 focus:ring-[#A63C71]/50 focus:ring-offset-1 border-0',
        cancelButton: 'flex-1 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all m-0 outline-none focus:ring-2 focus:ring-gray-200'
      }
    });

    if (!result.isConfirmed) return;

    try {
      if (quotation._id) {
        await axios.delete(
          `${baseUrl.updateLead}/${lead._id}/quotation/${quotation._id}`,
          { headers: { Authorization: `Bearer ${getAuthToken()}` } }
        );
      } else {
        const updatedQuotations = (localQuotations || []).filter((_, i) => i !== indexToDelete);
        await axios.put(
          `${baseUrl.updateLead}/${lead._id}`,
          { quotations: updatedQuotations },
          { headers: { Authorization: `Bearer ${getAuthToken()}` } }
        );
      }
      
      const updatedQuotations = (localQuotations || []).filter((_, i) => i !== indexToDelete);
      setLocalQuotations(updatedQuotations);
      toast.success('Quotation deleted successfully');
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const handleDownloadQuotation = async (index: number) => {
    if (!lead) return;
    const quotation = localQuotations[index];
    
    const toastId = toast.loading('Downloading PDF...');
    try {
      let qData = quotation;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';
      const response = await axios.post(`${apiUrl}quotation/generate`, {
        quotation: qData,
        lead: lead
      }, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      const clientName = (lead.fullName || lead.leadrefranceName || lead.leadrefrance || 'Client').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
      link.download = `Quotation_${clientName}_${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.update(toastId, { render: 'PDF Downloaded!', type: 'success', isLoading: false, autoClose: 3000 });
    } catch (e: any) {
      toast.update(toastId, { render: 'Failed to download PDF', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const handleSendWhatsApp = async (index: number) => {
    if (!lead) return;
    const quotation = localQuotations[index];
    
    const toastId = toast.loading('Sending Quotation via WhatsApp...');
    try {
      let qData = quotation;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';
      const response = await axios.post(`${apiUrl}quotation/whatsapp`, {
        quotation: qData,
        lead: lead
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      if (response.data.success) {
        toast.update(toastId, { render: 'WhatsApp Sent Successfully!', type: 'success', isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: response.data.message || 'Failed to send WhatsApp', type: 'error', isLoading: false, autoClose: 3000 });
      }
    } catch (e: any) {
      toast.update(toastId, { render: 'Failed to send WhatsApp', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const handleOpenReassign = async () => {
    setReassignOpen(true);
    setSelectedReassignUser(lead?.assignedTo?._id || '');
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };
      const [usersRes, deptRes] = await Promise.all([
        axios.get(baseUrl.getAllUsers, { headers }),
        departments.length === 0 ? axios.get(baseUrl.department, { headers }) : Promise.resolve({ data: { data: departments } })
      ]);
      const depts = deptRes.data?.data || [];
      if (departments.length === 0) setDepartments(depts);

      const users = usersRes.data?.data || [];
      const usersWithDepts = users.map((u: any) => {
        const d = depts.find((dept: any) => dept._id === u.department);
        return { ...u, departmentName: d ? (d.roleName || d.name) : '' };
      });
      setReassignUsers(usersWithDepts);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleReassign = async () => {
    if (!lead || !selectedReassignUser) return;
    setReassigning(true);
    try {
      const res = await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        { assignedTo: selectedReassignUser },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      // We can optimistically update local activities if needed
      if (res.data?.data?.activities) {
        setLocalActivities(res.data.data.activities);
      }
      if (res.data?.data?.assignedTo) {
        setLocalAssignedTo(res.data.data.assignedTo);
      } else {
        // Fallback: manually update if population didn't happen
        const newAssignee = reassignUsers.find(u => u._id === selectedReassignUser);
        if (newAssignee) setLocalAssignedTo(newAssignee);
      }
      toast.success('Lead reassigned successfully');
      setReassignOpen(false);
      onClose();
      onRefresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to reassign lead');
    } finally {
      setReassigning(false);
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      const fileUrl = attachment.path?.startsWith('http') ? attachment.path : `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
      const token = getAuthToken() || '';
      
      // Use the proxy API route to guarantee a forced download
      const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(attachment.originalName || 'download')}&token=${encodeURIComponent(token)}`;
      
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = attachment.originalName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      const fileUrl = attachment.path?.startsWith('http') ? attachment.path : `${process.env.NEXT_PUBLIC_IMAGE_URL}${attachment.path}`;
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <>
      <Dialog
        isOpen={!!lead}
        onClose={onClose}
        title="Lead Details"
        size="lg"
        footer={
          <>
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            {canUpdateLead && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[#a63c71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f325f] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </>
        }
      >
        {lead && (
          <div className="space-y-4 text-sm">
            <h2 className="text-xl font-bold text-gray-900">{lead.fullName}</h2>

            {/* Info grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoCard label="KW Requirement" value={lead.kwRequirement} />
              <InfoCard label="Phone" value={lead.contact} />
              <InfoCard label="Email" value={lead.email} />
              <InfoCard label="Discom Name" value={lead.discomName} />
              <InfoCard label="Lead Reference" value={lead.leadrefranceName || (lead.leadrefrance && !/^[a-fA-F0-9]{24}$/.test(lead.leadrefrance) ? lead.leadrefrance : '-')} />
              <InfoCard label="Project Type" value={lead.projecttype} />
              <InfoCard label="Last Follow-Up" value={lead.lastFollowUp} />
              <InfoCard label="Active" value={lead.isActive ? 'Yes' : 'No'} />
            </div>

            {/* Address */}
            {lead.address && <InfoCard label="Address" value={lead.address} />}

            {/* Location Link */}
            {lead.locationLink && (
              <InfoCard 
                label="Location Link" 
                value={
                  <a href={lead.locationLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {lead.locationLink}
                  </a>
                } 
              />
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-bold text-gray-800">Assigned</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {localAssignedTo?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{localAssignedTo?.fullName || 'Unassigned'}</div>
                    <div className="text-xs text-gray-500">{assignedToDeptName || localAssignedTo?.role?.name || 'Sales Executive'}</div>
                  </div>
                </div>
                {canUpdateLead && (
                  <button
                    onClick={handleOpenReassign}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Reassign
                  </button>
                )}
              </div>
            </div>

            {/* Visit Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-bold text-gray-800">Visit</div>
              {lead?.isVisitCompleted ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    Visit Done
                  </div>
                  {localVisitDate && (
                    <div className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg">
                      Date: {moment(localVisitDate).format("DD-MM-YYYY")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visit"
                        checked={visitDone === true}
                        onChange={() => handleVisitChange(true)}
                        className="w-4 h-4 accent-[#a63c71] cursor-pointer"
                        disabled={!canUpdateLead}
                      />
                      <span className="text-sm font-medium text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visit"
                        checked={visitDone === false}
                        onChange={() => handleVisitChange(false)}
                        className="w-4 h-4 accent-[#a63c71] cursor-pointer"
                        disabled={!canUpdateLead}
                      />
                      <span className="text-sm font-medium text-gray-700">No</span>
                    </label>
                  </div>
                  {visitDone === true && (
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                      <span className="text-sm font-bold text-gray-700">Date:</span>
                      <DatePicker
                        selected={localVisitDate ? new Date(localVisitDate) : null}
                        onChange={(date: Date | null) => {
                          if (!date) {
                            handleVisitDateChange('');
                            return;
                          }
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          handleVisitDateChange(`${year}-${month}-${day}`);
                        }}
                        placeholderText="mm/dd/yyyy"
                        dateFormat="MM/dd/yyyy"
                        className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-[#a63c71] cursor-pointer"
                        wrapperClassName="w-[140px]"
                        popperPlacement="bottom-start"
                        disabled={!canUpdateLead}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {visitDone !== null && (
              <>
                <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm font-medium text-gray-600">Status</div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => (!isWon) && canUpdateLead && setEditStatus(s._id)}
                    disabled={!canUpdateLead || isWon}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${editStatus === s._id
                      ? 'bg-secondary text-white shadow'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      } ${(!canUpdateLead || isWon) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up History */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm font-bold text-gray-800 flex items-center justify-between">
                <span>Follow-Up History</span>
                <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-normal">
                  {localFollowUps.length} Records
                </span>
              </div>

              {/* Add New Follow-up Section */}
              {canUpdateLead && (
                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Follow-up</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Date</label>
                      <DatePicker
                        selected={editNextDate ? new Date(editNextDate) : null}
                        onChange={(date: Date | null) => setEditNextDate(date ? date.toISOString().split('T')[0] : '')}
                        placeholderText="mm/dd/yyyy"
                        dateFormat="MM/dd/yyyy"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-secondary transition-all outline-none cursor-pointer"
                        wrapperClassName="w-full"
                        popperPlacement="bottom-start"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">Time</label>
                      <CustomTimePicker
                        value={editNextTime}
                        onChange={(val) => setEditNextTime(val)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <label className="text-xs font-medium text-gray-500">Note / Summary</label>
                    <textarea
                      value={followupNote}
                      onChange={(e) => setFollowupNote(e.target.value)}
                      placeholder="Describe the interaction..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-1 focus:ring-[#A63C71] focus:border-[#A63C71] transition-all outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={handleAddFollowup}
                    disabled={!editNextDate || !followupNote || addingFollowup}
                    className="mt-3 w-full rounded-lg bg-[#A63C71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f325f] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {addingFollowup ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Recording...
                      </span>
                    ) : 'Record Follow-up'}
                  </button>
                </div>
              )}

              {/* Follow-up Table */}
              {localFollowUps && localFollowUps.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white">
                  {/* Search Bar */}
                  <div className="border-b border-gray-200 px-4 py-3">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search follow-ups..."
                        value={followUpSearch}
                        onChange={(e) => setFollowUpSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 hover:border-gray-300"
                      />
                    </div>
                    {followUpSearch && (
                      <p className="mt-2 text-xs text-gray-500">
                        Showing {filteredFollowUps.length} of {localFollowUps.length} records
                      </p>
                    )}
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto relative">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 font-semibold text-gray-600 bg-gray-100 sticky top-0 z-10">Date & Time</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 bg-gray-100 sticky top-0 z-10">Note</th>
                          <th className="px-4 py-3 font-semibold text-gray-600 bg-gray-100 sticky top-0 z-10">Staff</th>
                          {canUpdateLead && (
                            <th className="px-4 py-3 font-semibold text-gray-600 bg-gray-100 sticky top-0 z-10 text-right pr-6">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(followUpSearch ? filteredFollowUps : localFollowUps).map((f, i) => (
                          <tr key={f._id || i} className={`hover:bg-gray-50/50 transition-colors ${f._id?.startsWith('temp_') ? 'animate-pulse bg-blue-50/30' : ''}`}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {f.date ? new Date(f.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                              </div>
                              {f.time && (
                                <div className="text-xs text-gray-500">{f.time}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs overflow-hidden">
                              <p className="text-gray-700 break-words leading-relaxed">{f.note}</p>
                              {f._id?.startsWith('temp_') && (
                                <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                  {f.staff?.fullName?.charAt(0) || staffInfo?.fullName?.charAt(0) || 'U'}
                                </div>
                                <span className="text-gray-600">{f.staff?.fullName || staffInfo?.fullName || 'Current User'}</span>
                              </div>
                            </td>
                            {canUpdateLead && (
                              <td className="px-4 py-3 text-right pr-6 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => f._id && handleDeleteFollowup(f._id)}
                                  disabled={f._id?.startsWith('temp_')}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                  title="Delete Follow-up"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {followUpSearch && filteredFollowUps.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        <p className="text-sm">No follow-ups match your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                  <p className="text-gray-400">No follow-up history available yet.</p>
                </div>
              )}
            </div>

            {/* Labels */}
            {lead.leadLabel && lead.leadLabel.length > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-2 text-sm font-medium text-gray-600">Labels</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(lead.leadLabel) && lead.leadLabel.map((l: any) => (
                    <span
                      key={l._id}
                      style={{ backgroundColor: l.color }}
                      className="rounded-md px-2 py-1 text-xs font-medium text-white"
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {lead.note && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 text-sm font-medium text-gray-600">Primary Note</div>
                <p className="text-gray-800 whitespace-pre-wrap">{lead.note}</p>
              </div>
            )}

            {/* Attachments */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span>Attachments</span>
                  <span className="bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-normal">
                    {localAttachments?.length || 0}
                  </span>
                </div>
                {canUpdateLead && (
                  <div className="relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title="Upload Attachments"
                    />
                    <button
                      type="button"
                      disabled={saving}
                      className="rounded-lg bg-[#a63c71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f325f] flex items-center justify-center gap-2 transition-colors pointer-events-none relative z-0"
                    >
                      + Add Attachments
                    </button>
                  </div>
                )}
              </div>
              
              {localAttachments && localAttachments.length > 0 ? (
                <div className="space-y-2">
                  {localAttachments.map((att: any, idx) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(att?.filename || "");

                    return (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                        {/* File Icon/Thumbnail */}
                        <div className="flex-shrink-0">
                          {isImage ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden border border-gray-200">
                              <img
                                src={att?.path?.startsWith('http') ? att.path : `${process.env.NEXT_PUBLIC_IMAGE_URL}${att?.path}`}
                                alt={att?.originalName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getFileIcon(att?.filename || "")}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{att.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {att.size ? `${(att.size / 1024).toFixed(1)} KB` : ''} •
                            {att.filename?.split('.').pop()?.toUpperCase()}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(att)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-600 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(att)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors text-gray-600 hover:text-green-600"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {canUpdateLead && (
                            <button
                              onClick={() => handleDeleteAttachment(att)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                  <p className="text-gray-400 text-sm">No attachments available.</p>
                </div>
              )}
            </div>
          </>
        )}

            {/* Lost info */}
            {lead.isLost && (
              <div className="rounded-lg bg-red-50 p-4">
                <div className="mb-2 text-sm font-semibold text-red-600">Lost Information</div>
                <div className="space-y-1 text-sm text-red-800">
                  <div>Lost Date: {lead.lostDate ? new Date(lead.lostDate).toLocaleDateString() : 'N/A'}</div>
                  <div>Reason: {lead.lostReason || 'Not specified'}</div>
                </div>
              </div>
            )}

            {/* Won info */}
            {lead.isWon && (
              <div className="rounded-lg bg-green-50 p-4">
                <div className="mb-2 text-sm font-semibold text-green-700">Won Information</div>
                <div className="space-y-1 text-sm text-green-800">
                  <div>Won Date: {lead.wonDate ? new Date(lead.wonDate).toLocaleDateString() : 'N/A'}</div>
                  <div>Amount: {lead.amount ? `₹${lead.amount.toLocaleString()}` : 'Not specified'}</div>
                </div>
              </div>
            )}

            {/* Quotation */}
            <div className="rounded-lg bg-gray-50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-800">Quotations</div>
                {canUpdateLead && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditQuotationIndex(null);
                      setQuotationOpen(true);
                    }}
                    className="rounded-lg bg-[#a63c71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f325f] flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText className="h-4 w-4" /> Add Quotation
                  </button>
                )}
              </div>

              {localQuotations && localQuotations.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-4 py-2.5 font-semibold text-gray-600 text-center w-12">#</th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600">Solar Module</th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600">Inverter</th>
                        <th className="px-4 py-2.5 font-semibold text-gray-600 text-right pr-6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {localQuotations.map((q, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {q.createdAt
                              ? new Date(q.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '').toUpperCase()
                              : (q.date
                                ? new Date(q.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '').toUpperCase()
                                : 'N/A')}
                          </td>
                          <td className="px-4 py-3 text-gray-700 truncate max-w-[150px]" title={q.solarModule}>{q.solarModule || '-'}</td>
                          <td className="px-4 py-3 text-gray-700 truncate max-w-[150px]" title={q.inverter}>{q.inverter || '-'}</td>
                          <td className="px-4 py-3 text-right pr-6 whitespace-nowrap">
                            <div className="inline-flex gap-2">
                              {/* <button
                                type="button"
                                onClick={() => handleDownloadQuotation(idx)}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(idx)}
                                className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Send via WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button> */}
                              {canUpdateLead && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditQuotationIndex(idx);
                                      setQuotationOpen(true);
                                    }}
                                    className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Edit Quotation"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuotation(idx)}
                                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Quotation"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                  <p className="text-gray-400 text-sm">No quotations added yet.</p>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="mb-3 text-sm font-bold text-gray-800">Activity Log</div>
              {localActivities && localActivities.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-secondary text-white">
                        <th className="px-4 py-3 font-semibold w-12 text-center">#</th>
                        <th className="px-4 py-3 font-semibold">MESSAGE</th>
                        <th className="px-4 py-3 font-semibold">BY</th>
                        <th className="px-4 py-3 font-semibold">DATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...localActivities].reverse().map((act, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-center text-gray-500">{localActivities.length - i}</td>
                          <td className="px-4 py-3 text-gray-700">{act.message}</td>
                          <td className="px-4 py-3 text-gray-600">{act.by?.fullName || 'System'}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(act.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center bg-white rounded-xl border border-gray-100 border-dashed">
                  <p className="text-gray-400">No activity history available yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {lead && (
        <LeadQuotationDialog
          isOpen={quotationOpen}
          onClose={() => {
            setQuotationOpen(false);
            setEditQuotationIndex(null);
          }}
          lead={{ ...lead, quotations: localQuotations }}
          onRefresh={async () => {
            try {
              const res = await axios.get(`${baseUrl.findLeadById}/${lead._id}`, {
                headers: { Authorization: `Bearer ${getAuthToken()}` }
              });
              const updatedLead = res.data.data;
              if (updatedLead) {
                setLocalQuotations(updatedLead.quotations || []);
                setLocalActivities(updatedLead.activities || []);
              }
            } catch (err) {
              console.error("Failed to refetch lead details", err);
            }
            onRefresh();
          }}
          editIndex={editQuotationIndex}
        />
      )}

      {/* Reassign Dialog */}
      <Dialog
        isOpen={reassignOpen}
        onClose={() => setReassignOpen(false)}
        title={
          <div className="bg-secondary  p-4 rounded-t-lg text-white font-bold uppercase">
            REASSIGN
          </div>
        }
        size="md"
        footer={
          <>
            <button
              onClick={() => setReassignOpen(false)}
              disabled={reassigning}
              className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={reassigning || !selectedReassignUser}
              className="rounded bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {reassigning ? 'Saving...' : 'Reassign'}
            </button>
          </>
        }
      >
        <div className="p-2 space-y-2">
          <FormSelect
            label="Select Staff"
            name="selectedReassignUser"
            value={selectedReassignUser}
            onChange={(val) => setSelectedReassignUser(val)}
            options={reassignUsers.map((u) => ({ value: u._id, label: `${u.fullName || u.name}${u.departmentName ? ` (${u.departmentName})` : ''}` }))}
            placeholder="-- Select --"
          />
        </div>
      </Dialog>

      {/* Image Preview Modal */}
      {previewAttachment && (
        <CenterDialog
          isOpen={true}
          onClose={() => setPreviewAttachment(null)}
        >
          <div className="relative">
            <img
              src={previewAttachment.url}
              alt={previewAttachment.name}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <a
                href={previewAttachment.url}
                download={previewAttachment.name}
                className="bg-white rounded-full p-2 hover:bg-gray-100 shadow-lg transition-colors"
                title="Download"
              >
                <Download className="h-5 w-5 text-gray-700" />
              </a>
            </div>
          </div>
        </CenterDialog>
      )}
    </>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value?: string | React.ReactNode | null;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-gray-900">
        {typeof value === 'string' || value === undefined || value === null
          ? value || '-'
          : value}
      </div>
    </div>
  );
}