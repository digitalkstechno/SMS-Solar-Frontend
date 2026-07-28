import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Phone, Mail, Plus, FileText } from 'lucide-react';
import { baseUrl, getAuthToken } from '@/config';
import { ApiSource, ApiStatus, ApiUser, ApiLead } from './types';
import DataTable, { Column } from '@/components/DataTable';
import DeleteDialog from '@/components/DeleteDialog';
import Swal from 'sweetalert2';
import ProjectDetailDrawer from './ProjectDetailDrawer';
import LeadDocumentsModal from './LeadDocumentsModal';
import PaymentModal from './PaymentModal';
import LeadAssignStockDialog from './LeadAssignStockDialog';
import { Package } from 'lucide-react';

function useDebounce<T>(value: T, delay = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type TableLead = {
  id: string;
  name: string;
  contact: string;
  email: string;
  kwRequirement?: string;
  discomName?: string;
  address?: string;
  locationLink?: string;
  status: string;
  staff: string;
  assignedTo?: string;
  lastFollowUp: string;
  isActive?: boolean;
  paymentAmount?: number;
  sourceId?: any;
  isVisitDone?: boolean;
  visitDate?: string;
  _raw?: any;
};

interface Props {
  statuses: ApiStatus[];
  sources: ApiSource[];
  staffMembers: ApiUser[];
  onEdit?: (lead: ApiLead) => void;
  onView?: (lead: ApiLead) => void;
  onRefresh: () => void;
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
    search?: string;
    status?: string;
    source?: string;
    staff?: string;
    date?: string;
  };
  externalLeads?: ApiLead[];
  loading?: boolean;

  pagination?: {
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;
    totalItems: number;
    handlePageChange: (page: number) => void;
    handleRowsPerPageChange: (rows: number) => void;
  };
  onSearch?: (value: string) => void;
  currentUser?: any;
}

function mapLead(item: any, staffMembers?: any[]): TableLead {

  let displayAmount = item.paymentAmount;
  if (item.quotations && Array.isArray(item.quotations) && item.quotations.length > 0) {
    const lastQuote = item.quotations[item.quotations.length - 1];
    if (lastQuote && lastQuote.rows) {
      const payableRow = lastQuote.rows.find((r: any) => 
        r.title && r.title.trim().toUpperCase() === 'CUSTOMER PAYABLE AMOUNT'
      );
      if (payableRow && payableRow.values && payableRow.values.length > 0) {
        const val = parseFloat(payableRow.values[0]);
        if (!isNaN(val)) displayAmount = val;
      }
    }
  }

  let staffName = item.createdBy?.fullName || item.createdBy?.name || '-';
  if (staffName === '-' && (typeof item.createdBy === 'string' || !item.createdBy) && staffMembers) {
    const createdById = typeof item.createdBy === 'string' ? item.createdBy : item.createdBy?._id;
    const found = staffMembers.find((s: any) => s._id === createdById || s._id === item.createdBy);
    if (found) staffName = found.fullName || found.name || '-';
  }

  let assignedToName = item.assignedTo?.fullName || item.assignedTo?.name || '-';
  if (assignedToName === '-' && (typeof item.assignedTo === 'string' || !item.assignedTo) && staffMembers) {
    const assignedId = typeof item.assignedTo === 'string' ? item.assignedTo : item.assignedTo?._id;
    const found = staffMembers.find((s: any) => s._id === assignedId || s._id === item.assignedTo);
    if (found) assignedToName = found.fullName || found.name || '-';
  }

  return {
    id: item._id,
    name: item.fullName,
    contact: item.contact || item.phone,
    email: item.email,
    kwRequirement: item.kwRequirement || '-',
    discomName: item.discomName || '-',
    isVisitDone: item.isVisitCompleted,
    visitDate: item.visitDate,
    address: item.address,
    locationLink: item.locationLink,
    status: item.leadStatus?.name || item.status?.name || '-',
    staff: staffName,
    assignedTo: assignedToName,
    lastFollowUp: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString()
      : '-',
    isActive: item.isActive,
    paymentAmount: displayAmount,
    sourceId: item.leadrefrance,
    _raw: item,
  };
}

export default function LeadsListView({
  statuses,
  sources,
  staffMembers,
  onEdit,
  onView,
  onRefresh,
  permissions,
  scope = 'all',
  filters = {},
  externalLeads,
  loading: loadingProp,
  pagination, 
  onSearch,
  currentUser,
}: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<TableLead[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TableLead | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [projectDetailLead, setProjectDetailLead] = useState<ApiLead | null>(null);
  const [documentLead, setDocumentLead] = useState<ApiLead | null>(null);
  const [paymentLead, setPaymentLead] = useState<ApiLead | null>(null);
  const [stockLead, setStockLead] = useState<ApiLead | null>(null);

  
  const loading = loadingProp !== undefined ? loadingProp : localLoading;

  
  useEffect(() => {
    if (externalLeads) {
      setLeads(externalLeads.map((l) => mapLead(l, staffMembers)));
    }
  }, [externalLeads, staffMembers]);


  const columns: Column<TableLead>[] = [
    {
      key: 'name',
      label: 'FULL NAME',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'contact',
      label: 'CONTACT',
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-sm text-gray-700">
            <span>{row.contact || '-'}</span>
          </div>
        </div>
      ),
    },
    { key: 'kwRequirement', label: 'KW REQ' },
    { key: 'discomName', label: 'DISCOM' },
    {
      key: 'isVisitDone',
      label: 'VISIT',
      render: (v) => v ? (
        <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-md">Done</span>
      ) : (
        <span className="text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded-md">Pending</span>
      )
    },
    {
      key: 'visitDate',
      label: 'VISIT DATE',
      render: (v) => v ? new Date(v).toLocaleDateString() : '-',
    },
    { 
      key: 'sourceId', 
      label: 'SOURCE',
      render: (v) => {
        if (!v) return '-';
        if (typeof v === 'object' && v.name) return v.name;
        const sourceObj = sources.find(s => s._id === v);
        return sourceObj ? sourceObj.name : '-';
      }
    },
    { key: 'status', label: 'STATUS' },
    { key: 'staff', label: 'CREATED BY' },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    { key: 'lastFollowUp', label: 'LAST FOLLOW-UP' },
    /* { 
      key: 'paymentAmount', 
      label: 'AMOUNT',
      render: (v) => (v ? <span className="font-bold text-emerald-600">₹{v.toLocaleString()}</span> : <span className="text-gray-400">-</span>)
    }, */
    {
      key: 'docs',
      label: 'DOCS',
      render: (_, row) => {
        const isWon = row.status?.toLowerCase() === 'won' || row.status?.toLowerCase() === 'won leads';
        const roleName = currentUser?.role?.roleName?.toLowerCase() || '';
        const isDocDept = currentUser?.department?.toLowerCase().includes('document') || roleName.includes('document');
        const isAdmin = roleName.includes('admin');
        
        return isWon && (isDocDept || isAdmin) ? (
          <button 
            onClick={(e) => { e.stopPropagation(); setDocumentLead(row._raw || row as unknown as ApiLead); }}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
            title="View Documents"
          >
            <FileText className="w-4 h-4" />
          </button>
        ) : <span className="text-gray-400">-</span>
      }
    },
  ];

  const handleView = async (row: TableLead) => {
    try {
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const d = res.data.data;
      onView?.(d);
    } catch {
      const apiLead: ApiLead = {
        _id: row.id,
        fullName: row.name,
        contact: row.contact,
        email: row.email,
      };
      onView?.(apiLead);
    }
  };

  const handleEdit = async (row: TableLead) => {
    try {
      const res = await axios.get(`${baseUrl.findLeadById}/${row.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const d = res.data.data;
      const apiLead: ApiLead = {
        ...d,
        _id: d._id,
        fullName: d.fullName,
        contact: d.contact,
        email: d.email,
        kwRequirement: d.kwRequirement,
        discomName: d.discomName,
        address: d.address,
        locationLink: d.locationLink,
        leadStatus: d.leadStatus,
        assignedTo: d.assignedTo,
        isActive: d.isActive,
      };
      onEdit?.(apiLead);
    } catch {
      console.error('Failed to fetch lead for edit');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${baseUrl.deleteLead}/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      toast.success('Lead deleted successfully');
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      onRefresh?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete lead');
    } finally {
      setShowDelete(false);
      setDeleteTarget(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (pagination) {
      pagination.handlePageChange(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (pagination) {
      pagination.handleRowsPerPageChange(newSize);
    }
  };

  return (
    <div className="space-y-4">
      <DataTable
        data={leads}
        columns={columns}
        loading={loading}
        pagination
        searchValue={filters.search}
        onSearch={onSearch}
        currentPage={pagination?.currentPage || 1}
        totalPages={pagination?.totalPages || 1}
        totalRecords={pagination?.totalItems || 0}
        pageSize={pagination?.rowsPerPage || 10}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        actions
        onView={handleView}
        onEdit={permissions?.update ? handleEdit : undefined}
        onDelete={permissions?.delete ? (row) => { setDeleteTarget(row); setShowDelete(true); } : undefined}
        extraActions={permissions?.update ? [
          {
            label: 'Add',
            icon: <Plus className="h-3.5 w-3.5" />,
            color: 'emerald',
            show: (row) => row.status?.toLowerCase() === 'won' || row.status?.toLowerCase() === 'won leads',
            onClick: (row) => {
              const rawLead: ApiLead = row._raw || row;
              setProjectDetailLead(rawLead);
            },
          },
          {
            label: 'Pay',
            icon: <span className="text-xs font-bold">₹</span>,
            color: 'emerald',
            show: (row) => row.status?.toLowerCase() === 'won' || row.status?.toLowerCase() === 'won leads',
            onClick: (row) => {
              const rawLead: ApiLead = row._raw || row;
              setPaymentLead(rawLead);
            }
          },
          {
            label: 'Stock',
            icon: <Package className="h-3.5 w-3.5" />,
            color: 'blue',
            show: (row) => row.status?.toLowerCase() === 'won' || row.status?.toLowerCase() === 'won leads',
            onClick: (row) => {
              const rawLead: ApiLead = row._raw || row;
              setStockLead(rawLead);
            }
          }
        ] : undefined}
      />

      <DeleteDialog
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeleteTarget(null); }}
        title="Delete Lead"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setShowDelete(false); setDeleteTarget(null); }}
              className="rounded-lg border cursor-pointer border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg bg-red-600 cursor-pointer px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="py-4 text-gray-700">
          Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>?
          This action cannot be undone.
        </p>
      </DeleteDialog>

      <ProjectDetailDrawer
        isOpen={!!projectDetailLead}
        lead={projectDetailLead}
        onClose={() => setProjectDetailLead(null)}
        onSaved={() => { onRefresh(); setProjectDetailLead(null); }}
      />
      
      <LeadDocumentsModal
        isOpen={!!documentLead}
        onClose={() => setDocumentLead(null)}
        lead={documentLead}
      />

      <PaymentModal
        isOpen={!!paymentLead}
        lead={paymentLead}
        onClose={() => setPaymentLead(null)}
        onPaymentAdded={onRefresh}
      />
      
      
      <LeadAssignStockDialog
        isOpen={!!stockLead}
        lead={stockLead}
        onClose={() => setStockLead(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}