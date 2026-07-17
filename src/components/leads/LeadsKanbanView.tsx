// components/leads/LeadsKanbanView.tsx
// Kanban board with Board / Lost / Won sub-views + drag-and-drop

import { useState, useCallback, useEffect } from 'react';
import { FiSearch, FiPhone, FiMail } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead } from './types';
import { RefreshCw, Plus, FileText, Calendar, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DataTable, { Column } from '@/components/DataTable';
import KanbanCard from './KanbanCard';
import Swal from 'sweetalert2';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import PaymentModal from './PaymentModal';
import LeadDocumentsModal from './LeadDocumentsModal';
import LeadAssignStockDialog from './LeadAssignStockDialog';

type PaginationShape = {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    totalItems: number;
    handlePageChange: (page: number) => void;
    handleRowsPerPageChange: (rows: number) => void;
};

interface Props {
    leads: ApiLead[];
    lostLeads: ApiLead[];
    wonLeads: ApiLead[];
    statuses: any[];
    staffMembers?: any[];
    onEdit?: (lead: ApiLead) => void;
    onView?: (lead: ApiLead) => void;
    onRefresh: () => void;
    counts?: Record<string, number>;
    permissions?: {
        create: boolean;
        update: boolean;
        delete: boolean;
        readAll?: boolean;
        readOwn?: boolean;
        assign?: boolean;
        transfer?: boolean;
        convert?: boolean;
    };
    scope?: 'all' | 'my';
    filters: {
        search: string;
        status: string;
        staff: string;
        source: string;
        from?: Date | null;
        to?: Date | null;
    };
    lostPagination?: PaginationData;
    wonPagination?: PaginationData;
    onSubViewChange?: (view: SubView) => void;
    refreshKey?: number;
    currentUser?: ApiUser | null;
    isAdmin?: boolean;
    onSearch?: (value: string) => void;
    loading?: boolean;
}

type SubView = 'board' | 'lost' | 'won';

export default function LeadsKanbanView({
    leads,
    lostLeads,
    wonLeads,
    statuses,
    staffMembers,
    onEdit,
    onView,
    onRefresh,
    counts,
    permissions,
    scope = 'all',
    filters,
    lostPagination,
    wonPagination,
    onSubViewChange,
    refreshKey = 0,
    currentUser,
    isAdmin,
    onSearch,
    loading = false,
}: Props) {
    const [subView, setSubView] = useState<SubView>('board');
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [projectDetailLead, setProjectDetailLead] = useState<ApiLead | null>(null);
    const [paymentLead, setPaymentLead] = useState<ApiLead | null>(null);
    const [documentLead, setDocumentLead] = useState<ApiLead | null>(null);
    const [stockLead, setStockLead] = useState<ApiLead | null>(null);
    
    // Custom Modal for Mark Lost
    const [lostModalLeadId, setLostModalLeadId] = useState<string | null>(null);
    const [lostModalData, setLostModalData] = useState({ reason: '', date: '' });

    const canEditLead = (lead: ApiLead) => {
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
    };
    
    // Board state
    const [boardLeads, setBoardLeads] = useState<Record<string, ApiLead[]>>({});
    const [columnLoading, setColumnLoading] = useState<Record<string, boolean>>({});
    const [pageMap, setPageMap] = useState<Record<string, number>>({});
    const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
    const [loadingMoreMap, setLoadingMoreMap] = useState<Record<string, boolean>>({});
    const [columnCounts, setColumnCounts] = useState<Record<string, number>>({});

    const [kanbanVisibleStatusNames, setKanbanVisibleStatusNames] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('kanbanVisibleStatusNames');
            if (stored) {
                const parsed = JSON.parse(stored);
                setKanbanVisibleStatusNames(Array.isArray(parsed) ? parsed : []);
            }
        } catch {
            setKanbanVisibleStatusNames([]);
        }
    }, []);

    const token = () => getAuthToken();

    // Notify parent when sub-view changes
    const handleSubViewChange = (v: SubView) => {
        setSubView(v);
        onSubViewChange?.(v);
    };

    // Fetch leads for a specific status
    const fetchStatusLeads = useCallback(
        async (statusId: string, page = 1, isLoadMore = false, isSilent = false) => {
            if (isLoadMore) {
                setLoadingMoreMap((p) => ({ ...p, [statusId]: true }));
            } else if (!isSilent) {
                setColumnLoading((p) => ({ ...p, [statusId]: true }));
            }

            try {
                const res = await axios.get(baseUrl.getKanbanStatusLeads, {
                    headers: { Authorization: `Bearer ${token()}` },
                    params: {
                        statusId,
                        page,
                        limit: 10,
                        my: scope === 'my' || undefined,
                        search: filters.search || undefined,
                        source: filters.source || undefined,
                        staff: filters.staff || undefined,
                        from: filters.from || undefined,
                        to: filters.to || undefined,
                    },
                });

                const newData: ApiLead[] = res.data?.data || [];
                const pagination = res.data?.pagination || {};

                setBoardLeads((prev) => ({
                    ...prev,
                    [statusId]: isLoadMore ? [...(prev[statusId] || []), ...newData] : newData,
                }));

                const totalRecords = pagination.totalRecords ?? pagination.total ?? pagination.count ?? (isLoadMore ? (columnCounts[statusId] || 0) : newData.length);
                setColumnCounts((prev) => ({ ...prev, [statusId]: totalRecords }));

                setPageMap((prev) => ({ ...prev, [statusId]: page }));
                setHasMoreMap((prev) => ({
                    ...prev,
                    [statusId]: page < (pagination.totalPages || 1),
                }));
            } catch (error) {
                console.error(`Failed to fetch leads for status ${statusId}:`, error);
            } finally {
                setColumnLoading((p) => ({ ...p, [statusId]: false }));
                setLoadingMoreMap((p) => ({ ...p, [statusId]: false }));
            }
        },
        [scope, filters]
    );

    // Initial fetch and re-fetch on filter/scope/refreshKey change
    useEffect(() => {
        if (subView !== 'board') return;
        statuses.forEach((s) => {
            const isVisible = kanbanVisibleStatusNames.length === 0 || kanbanVisibleStatusNames.includes(s.name);
            const isFiltered = filters.status ? filters.status.split(',').includes(s._id) : true;
            if (isVisible && isFiltered) {
                fetchStatusLeads(s._id, 1);
            }
        });
    }, [subView, statuses, kanbanVisibleStatusNames, scope, filters, fetchStatusLeads, refreshKey]);

    const loadMore = useCallback(
        async (statusId: string) => {
            if (loadingMoreMap[statusId] || hasMoreMap[statusId] === false) return;
            const nextPage = (pageMap[statusId] || 1) + 1;
            fetchStatusLeads(statusId, nextPage, true);
        },
        [loadingMoreMap, hasMoreMap, pageMap, fetchStatusLeads]
    );

    const handleDrop = async (newStatusId: string) => {
        if (!draggingId) return;

        let sourceStatusId = '';
        let draggingLead: ApiLead | null = null;
        const entries = Object.entries(boardLeads);
        for (let i = 0; i < entries.length; i++) {
            const [sId, leadsArr] = entries[i];
            const found = leadsArr.find(l => l._id === draggingId);
            if (found) {
                sourceStatusId = sId;
                draggingLead = found;
                break;
            }
        }

        if (!draggingLead || !canEditLead(draggingLead) || sourceStatusId === newStatusId || !sourceStatusId) {
            setDraggingId(null);
            return;
        }

        const targetStatus = statuses.find((s) => s._id === newStatusId);
        if (!targetStatus) return;
        
        const currentDropId = draggingId;
        setDraggingId(null);
        setUpdatingId(currentDropId);
        
        // Optimistic UI update
        setBoardLeads(prev => {
            const next = { ...prev };
            const sourceLeads = [...(next[sourceStatusId] || [])];
            const leadIndex = sourceLeads.findIndex(l => l._id === currentDropId);
            if (leadIndex > -1) {
                const [lead] = sourceLeads.splice(leadIndex, 1);
                next[sourceStatusId] = sourceLeads;
                next[newStatusId] = [lead, ...(next[newStatusId] || [])];
                lead.leadStatus = targetStatus;
            }
            return next;
        });

        try {
            await axios.put(
                `${baseUrl.updateKanbanStatus}/${currentDropId}/kanban-status`,
                { leadStatus: newStatusId },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success(`Lead moved to ${targetStatus.name}`);
            
            // SILENT RE-FETCH: sync counts/order etc in background without showing loaders
            fetchStatusLeads(sourceStatusId, 1, false, true);
            fetchStatusLeads(newStatusId, 1, false, true);
            
            onRefresh();
        } catch {
            toast.error('Failed to update lead status');
            // Re-fetch with loader to show the revert
            fetchStatusLeads(sourceStatusId, 1);
            fetchStatusLeads(newStatusId, 1);
        } finally {
            setUpdatingId(null);
        }
    };

    const statusGroups = statuses
        .map((s) => ({
            id: s._id,
            title: s.name,
            leads: boardLeads[s._id] || [],
            count: columnCounts[s._id] ?? (counts ? counts[s._id] || 0 : 0),
            isLoading: columnLoading[s._id]
        }))
        .filter((group) => {
            if (kanbanVisibleStatusNames.length > 0 && !kanbanVisibleStatusNames.includes(group.title)) return false;
            if (filters.status && !filters.status.split(',').includes(group.id)) return false;
            return true;
        });

    const removeLeadFromBoard = (id: string) => {
        setBoardLeads(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(statusId => {
                next[statusId] = next[statusId].filter(l => l._id !== id);
            });
            return next;
        });
    };

    const markLost = (id: string) => {
        setLostModalData({ reason: '', date: '' });
        setLostModalLeadId(id);
    };

    const confirmMarkLost = async () => {
        if (!lostModalLeadId || !lostModalData.reason || !lostModalData.date) return;
        
        try {
            const lostStatusId = statuses.find(s => s.name.match(/^lost$/i))?._id;
            await axios.put(`${baseUrl.updateLead}/${lostModalLeadId}`, 
                { leadStatus: lostStatusId, lostReason: lostModalData.reason, lostDate: lostModalData.date }, 
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            toast.success('Lead marked as lost');
            removeLeadFromBoard(lostModalLeadId);
            onRefresh();
        } catch { toast.error('Failed to update lead'); }
        
        setLostModalLeadId(null);
    };

    const markWon = async (id: string) => {
        try {
            await axios.put(`${baseUrl.updateLead}/${id}`, { isWon: true, wonDate: new Date().toISOString() }, { headers: { Authorization: `Bearer ${token()}` } });
            toast.success('Lead marked as won');
            removeLeadFromBoard(id);
            onRefresh();
        } catch { toast.error('Failed to update lead'); }
    };

    const reactivate = async (id: string) => {
        const result = await Swal.fire({
            html: `
                <div class="flex flex-col items-center text-center">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[#A63C71]/10 text-[#A63C71] mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                        </svg>
                    </div>
                    <h2 class="text-lg font-bold text-[#1f2937] mb-1">Reactivate Lead?</h2>
                    <p class="text-[14px] text-gray-500 leading-relaxed">This will move the lead back to<br/>the first stage.</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Reactivate',
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

        if (result.isConfirmed) {
            try {
                const newLeadStatusId = statuses.find(s => s.name.match(/^new lead$/i) || s.name.match(/^new$/i))?._id || statuses[0]?._id;
                await axios.put(`${baseUrl.updateLead}/${id}`, { leadStatus: newLeadStatusId }, { headers: { Authorization: `Bearer ${token()}` } });
                toast.success('Lead reactivated');
                
                removeLeadFromBoard(id);
                if (newLeadStatusId) {
                    fetchStatusLeads(newLeadStatusId, 1, false, true);
                }
                
                onRefresh();
            } catch { toast.error('Failed to reactivate lead'); }
        }
    };

    const lostLeadsColumns: Column<ApiLead>[] = [
        { key: 'fullName', label: 'LEAD NAME', render: (v) => (<div><div className="font-semibold text-gray-900">{v}</div><span className="text-xs text-red-500">• Lost</span></div>) },
        { key: 'kwRequirement', label: 'KW REQ', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'discomName', label: 'DISCOM', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'address', label: 'LOCATION', render: (v) => (
            <div className="group relative flex items-center">
                <div className="text-sm max-w-[150px] truncate cursor-pointer text-gray-700">
                    {v || '-'}
                </div>
                {v && (
                    <div className="absolute bottom-full left-0 z-[9999] mb-1 hidden group-hover:block w-max max-w-[250px] whitespace-normal rounded-md bg-gray-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl">
                        {v}
                    </div>
                )}
            </div>
        ) },
        { key: 'contact', label: 'CONTACT', render: (v, row) => <ContactCell phone={v} /> },
        { key: 'lostDate', label: 'LOST DATE', render: (v, row) => {
            const dateStr = v || row.lostDate || row.updatedAt;
            return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
        } },
        { key: 'createdBy', label: 'CREATED BY', render: (v, row) => {
            if (typeof row.createdBy === 'object' && row.createdBy?.fullName) return row.createdBy.fullName;
            if (typeof row.createdBy === 'object' && row.createdBy?.name) return row.createdBy.name;
            const found = staffMembers?.find((s: any) => s._id === (v || row.createdBy));
            return found?.fullName || found?.name || '-';
        } },
        { key: 'lostReason', label: 'REASON', render: (v) => v || 'Not specified' },
    ];

    const wonLeadsColumns: Column<ApiLead>[] = [
        { key: 'fullName', label: 'LEAD NAME', render: (v) => <span className="font-semibold text-gray-900">{v}</span> },
        { key: 'kwRequirement', label: 'KW REQ', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'discomName', label: 'DISCOM', render: (v) => <span className="text-sm">{v || '-'}</span> },
        { key: 'address', label: 'LOCATION', render: (v) => (
            <div className="group relative flex items-center">
                <div className="text-sm max-w-[150px] truncate cursor-pointer text-gray-700">
                    {v || '-'}
                </div>
                {v && (
                    <div className="absolute bottom-full left-0 z-[9999] mb-1 hidden group-hover:block w-max max-w-[250px] whitespace-normal rounded-md bg-gray-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl">
                        {v}
                    </div>
                )}
            </div>
        ) },
        { key: 'contact', label: 'CONTACT', render: (v, row) => <ContactCell phone={v} /> },
        { key: 'wonDate', label: 'WON DATE', render: (v, row) => {
            const dateStr = v || row.wonDate || row.updatedAt;
            return dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
        } },
        { key: 'createdBy', label: 'CREATED BY', render: (v, row) => {
            if (typeof row.createdBy === 'object' && row.createdBy?.fullName) return row.createdBy.fullName;
            if (typeof row.createdBy === 'object' && row.createdBy?.name) return row.createdBy.name;
            const found = staffMembers?.find((s: any) => s._id === (v || row.createdBy));
            return found?.fullName || found?.name || '-';
        } },
        /* { key: 'paymentAmount', label: 'AMOUNT', render: (v) => (v ? `₹${v.toLocaleString()}` : '-') }, */
        { 
            key: 'docs', 
            label: 'DOCS', 
            render: (v, row) => {
                const roleName = currentUser?.role?.roleName?.toLowerCase() || '';
                const isDocDept = currentUser?.department?.toLowerCase().includes('document') || roleName.includes('document');
                const isAdmin = roleName.includes('admin');
                return (isDocDept || isAdmin) ? (
                    <button 
                        onClick={() => setDocumentLead(row)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                        title="View Documents"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                ) : <span className="text-gray-400">-</span>;
            }
        },
    ];

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                    {(['board', 'lost', 'won'] as SubView[]).map((v) => {
                        const lostStatusGrp = statusGroups.find(g => g.title.toLowerCase() === 'lost' || g.title.toLowerCase() === 'lost leads');
                        const wonStatusGrp = statusGroups.find(g => g.title.toLowerCase() === 'won' || g.title.toLowerCase() === 'won leads');
                        const lostCount = lostPagination?.totalItems || lostLeads.length || Math.max(lostStatusGrp?.count || 0, lostStatusGrp?.leads?.length || 0);
                        const wonCount = wonPagination?.totalItems || wonLeads.length || Math.max(wonStatusGrp?.count || 0, wonStatusGrp?.leads?.length || 0);
                        const label = v === 'board' ? 'Kanban View' : v === 'lost' ? 'Lost Leads' : 'Won Leads';
                        const count = v === 'lost' ? lostCount : v === 'won' ? wonCount : null;
                        return (
                        <button
                            key={v}
                            onClick={() => handleSubViewChange(v)}
                            className={`flex items-center gap-2 rounded-lg cursor-pointer px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                                subView === v
                                    ? 'border border-primary text-primary bg-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                            }`}
                        >
                            {label}
                            {count !== null && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    v === 'lost'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                        );
                    })}
                </div>
            </div>

            {subView === 'board' && (
                <div className="overflow-x-auto w-full pb-4">
                    <div className="flex gap-4 h-[calc(100vh-280px)] min-w-max">
                        {statusGroups.map((group) => (
                            <div key={group.id} className="w-80 flex-shrink-0 flex flex-col">
                                <div className="rounded-t-xl bg-secondary px-5 py-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-white capitalize">{group.title}</h3>
                                        <span className="rounded-full bg-white px-3 py-0.5 text-sm font-semibold text-secondary">
                                            {group.count}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className="flex-1 overflow-y-auto rounded-b-lg bg-[#f4f7fb] p-3 space-y-3"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(group.id)}
                                    onScroll={(e) => {
                                        const t = e.target as HTMLDivElement;
                                        if (Math.ceil(t.scrollTop + t.clientHeight) >= t.scrollHeight - 20) {
                                            loadMore(group.id);
                                        }
                                    }}
                                >
                                    {group.isLoading ? (
                                        <div className="flex h-full items-center justify-center py-10">
                                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
                                        </div>
                                    ) : group.leads.length === 0 ? (
                                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                            No leads
                                        </div>
                                    ) : (
                                        group.leads.map((lead: ApiLead) => (
                                            <KanbanCard
                                                key={lead._id}
                                                lead={lead}
                                                isUpdating={updatingId === lead._id}
                                                onDragStart={canEditLead(lead) && lead.leadStatus?.name?.toLowerCase() !== 'won' && !lead.leadStatus?.name?.toLowerCase().includes('lost') ? () => setDraggingId(lead._id) : undefined}
                                                onView={() => onView?.(lead)}
                                                onEdit={canEditLead(lead) ? () => onEdit?.(lead) : undefined}
                                                onMarkLost={canEditLead(lead) && lead.leadStatus?.name?.toLowerCase() !== 'won' && !lead.leadStatus?.name?.toLowerCase().includes('lost') ? () => markLost(lead._id) : undefined}
                                                onMarkWon={canEditLead(lead) && lead.leadStatus?.name?.toLowerCase() !== 'won' ? () => markWon(lead._id) : undefined}
                                                onReactivate={canEditLead(lead) && lead.leadStatus?.name?.toLowerCase().includes('lost') ? () => reactivate(lead._id) : undefined}
                                                onMarkStock={canEditLead(lead) && lead.leadStatus?.name?.toLowerCase() === 'won' ? () => setStockLead(lead) : undefined}
                                            />
                                        ))
                                    )}
                                    {loadingMoreMap[group.id] && (
                                        <div className="flex justify-center py-2">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subView === 'lost' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-red-200 text-red-700 flex items-center justify-center font-bold text-lg">×</div>
                            <div>
                                <h2 className="text-xl font-semibold text-red-800">Lost Leads</h2>
                                <p className="text-sm text-red-800 opacity-80">Leads that were not converted</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-semibold text-red-800">
                            {lostPagination?.totalItems ?? lostLeads.length} Total
                        </span>
                    </div>
                    <DataTable
                        data={lostLeads}
                        columns={lostLeadsColumns}
                        loading={loading}
                        pagination
                        searchValue={filters.search}
                        onSearch={onSearch}
                        currentPage={lostPagination?.currentPage ?? 1}
                        totalPages={lostPagination?.totalPages ?? 1}
                        totalRecords={lostPagination?.totalItems ?? lostLeads.length}
                        pageSize={lostPagination?.rowsPerPage ?? 10}
                        onPageChange={lostPagination?.handlePageChange}
                        onPageSizeChange={lostPagination?.handleRowsPerPageChange}
                        actions
                        onView={(row) => onView?.(row)}
                        onEdit={permissions?.update || permissions?.readOwn ? (row) => onEdit?.(row) : undefined}
                        canEdit={canEditLead}
                        extraActions={permissions?.update || permissions?.readOwn ? [{ label: 'Reactivate', onClick: (row) => reactivate(row._id), icon: <RefreshCw className="h-4 w-4" />, color: 'orange', show: (row) => canEditLead(row) }] : undefined}
                    />
                </div>
            )}

            {subView === 'won' && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-200 text-green-700 flex items-center justify-center font-bold text-lg">✓</div>
                            <div>
                                <h2 className="text-xl font-semibold text-green-800">Won Leads</h2>
                                <p className="text-sm text-green-800 opacity-80">Leads that were converted</p>
                            </div>
                        </div>
                        <span className="rounded-full bg-green-200 px-3 py-1 text-sm font-semibold text-green-800">
                            {wonPagination?.totalItems ?? wonLeads.length} Total
                        </span>
                    </div>
                    <DataTable
                        data={wonLeads}
                        columns={wonLeadsColumns}
                        loading={loading}
                        pagination
                        searchValue={filters.search}
                        onSearch={onSearch}
                        currentPage={wonPagination?.currentPage ?? 1}
                        totalPages={wonPagination?.totalPages ?? 1}
                        totalRecords={wonPagination?.totalItems ?? wonLeads.length}
                        pageSize={wonPagination?.rowsPerPage ?? 10}
                        onPageChange={wonPagination?.handlePageChange}
                        onPageSizeChange={wonPagination?.handleRowsPerPageChange}
                        actions
                        onView={(row) => onView?.(row)}
                        onEdit={permissions?.update || permissions?.readOwn ? (row) => onEdit?.(row) : undefined}
                        canEdit={canEditLead}
                        extraActions={permissions?.update || permissions?.readOwn ? [
                            {
                                label: 'Add',
                                icon: <Plus className="h-3.5 w-3.5" />,
                                color: 'emerald',
                                onClick: (row) => setProjectDetailLead(row),
                                show: (row) => canEditLead(row),
                            },
                            {
                                label: 'Pay',
                                icon: <span className="text-xs font-bold">₹</span>,
                                color: 'emerald',
                                onClick: (row) => setPaymentLead(row),
                                show: (row) => canEditLead(row),
                            },
                            {
                                label: 'Stock',
                                icon: <span className="text-xs font-bold font-serif text-blue-600">📦</span>,
                                color: 'blue',
                                onClick: (row) => setStockLead(row),
                                show: (row) => canEditLead(row),
                            }
                        ] : undefined}
                    />
                </div>
            )}

            {/* Project Detail Drawer */}
            <ProjectDetailDrawer
                isOpen={!!projectDetailLead}
                lead={projectDetailLead}
                onClose={() => setProjectDetailLead(null)}
                onSaved={() => { onRefresh(); setProjectDetailLead(null); }}
            />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={!!paymentLead}
                lead={paymentLead}
                onClose={() => setPaymentLead(null)}
                onPaymentAdded={onRefresh}
            />

            {/* Document Viewer Modal */}
            <LeadDocumentsModal
                isOpen={!!documentLead}
                onClose={() => setDocumentLead(null)}
                lead={documentLead}
            />

            {/* Assign Stock Modal */}
            <LeadAssignStockDialog
                isOpen={!!stockLead}
                lead={stockLead}
                onClose={() => setStockLead(null)}
                onSuccess={onRefresh}
            />

            {lostModalLeadId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center text-gray-800 text-2xl font-bold border-b border-gray-100">
                            Mark Lead as Lost?
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1 text-left">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <X className="w-4 h-4 text-[#A63C71]" /> Remove Reason
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter reason for marking lead as lost"
                                    value={lostModalData.reason}
                                    onChange={e => setLostModalData(p => ({ ...p, reason: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A63C71] focus:border-[#A63C71]"
                                />
                            </div>
                            <div className="space-y-1 text-left">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#A63C71]" /> Lost Date
                                </label>
                                <DatePicker
                                    selected={lostModalData.date ? new Date(lostModalData.date) : null}
                                    onChange={(date: Date | null) => setLostModalData(p => ({ ...p, date: date ? date.toISOString().split('T')[0] : '' }))}
                                    placeholderText="dd-mm-yyyy"
                                    dateFormat="dd-MM-yyyy"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A63C71] focus:border-[#A63C71]"
                                    wrapperClassName="w-full"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-center gap-3">
                            <button
                                onClick={confirmMarkLost}
                                disabled={!lostModalData.reason || !lostModalData.date}
                                className="px-6 py-2 bg-[#A63C71] text-white font-medium rounded hover:bg-[#8f325f] disabled:opacity-50 transition-colors"
                            >
                                Yes, Confirm
                            </button>
                            <button
                                onClick={() => setLostModalLeadId(null)}
                                className="px-6 py-2 bg-[#6D7A86] text-white font-medium rounded hover:bg-[#5b6670] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ContactCell({ phone }: { phone: string }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm text-gray-700">
                <span>{phone || '-'}</span>
            </div>
        </div>
    );
}