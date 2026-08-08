'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import Search from '@/components/Search';
import { TableSelect } from '@/components/ui/TableSelect';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { FiEye, FiClock, FiUser, FiActivity, FiFilter, FiSearch, FiX } from 'react-icons/fi';
import Dialog from '@/components/Dialog';

const moduleOptions = [
  { value: '', label: 'All Modules' },
  { value: 'Department', label: 'Department' },
  { value: 'User', label: 'User' },
  { value: 'Lead', label: 'Lead' },
];

const actionOptions = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
];

interface ActivityLogItem {
  _id: string;
  performedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: 'Department' | 'User' | 'Lead';
  entityId?: string;
  entityName?: string;
  details?: any;
  createdAt: string;
}

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const fetchLogs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedModule) params.module = selectedModule;
      if (selectedAction) params.action = selectedAction;

      const response = await axios.get(baseUrl.activityLog, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.status === 'Success') {
        setLogs(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalLogs(response.data.pagination?.totalLogs || 0);
      }
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedModule, selectedAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetails = (log: ActivityLogItem) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">DELETE</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{action}</span>;
    }
  };

  const getModuleBadge = (module: string) => {
    switch (module) {
      case 'Department':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200">Department</span>;
      case 'User':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">User</span>;
      case 'Lead':
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">Lead</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-50 text-gray-700 border border-gray-200">{module}</span>;
    }
  };

  const columns: Column<ActivityLogItem>[] = [
    {
      key: 'performedBy',
      label: 'Performed By',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 flex items-center gap-1.5">
            <FiUser className="text-gray-400 text-xs" />
            {row.userName || 'System'}
          </span>
          {row.userEmail && <span className="text-xs text-gray-500">{row.userEmail}</span>}
          {row.userRole && <span className="text-[11px] text-purple-600 font-medium">{row.userRole}</span>}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => getActionBadge(row.action),
    },
    {
      key: 'module',
      label: 'Module',
      render: (_, row) => getModuleBadge(row.module),
    },
    {
      key: 'entityName',
      label: 'Affected Record',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.entityName || row.entityId || '-'}</span>
          {row.entityId && <span className="text-[11px] text-gray-400 font-mono">ID: {row.entityId}</span>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: (val) => (
        <span className="text-xs text-gray-600 flex items-center gap-1">
          <FiClock className="text-gray-400" />
          {new Date(val).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#A63C71] hover:text-white bg-[#A63C71]/10 hover:bg-[#A63C71] rounded-lg transition-colors"
        >
          <FiEye className="w-3.5 h-3.5" /> View Details
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50  md:p-4">
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Header */}
    

        {/* Compact Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search user, email or record name..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-[#A63C71] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A63C71]/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full sm:w-44">
              <TableSelect
                value={selectedModule}
                onChange={(val) => {
                  setSelectedModule(val);
                  setPage(1);
                }}
                options={moduleOptions}
                placeholder="All Modules"
              />
            </div>

            <div className="w-full sm:w-40">
              <TableSelect
                value={selectedAction}
                onChange={(val) => {
                  setSelectedAction(val);
                  setPage(1);
                }}
                options={actionOptions}
                placeholder="All Actions"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable
            data={logs}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              page,
              limit,
              totalPages,
              totalRecords: totalLogs,
              onPageChange: setPage,
              onLimitChange: (newLimit) => {
                setLimit(newLimit);
                setPage(1);
              },
            }}
          />
        </div>
      </div>

      {/* Details Dialog */}
      {selectedLog && (
        <Dialog
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLog(null);
          }}
          title="Activity Log Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Action & Module</span>
                <div className="flex items-center gap-2 mt-1">
                  {getActionBadge(selectedLog.action)}
                  {getModuleBadge(selectedLog.module)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Date & Time</span>
                <p className="text-xs font-semibold text-gray-700 mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-gray-500 block">Performed By:</span>
                <span className="font-semibold text-gray-800">{selectedLog.userName}</span>
                {selectedLog.userEmail && <span className="block text-gray-500">{selectedLog.userEmail}</span>}
              </div>
              <div>
                <span className="text-gray-500 block">Affected Record:</span>
                <span className="font-semibold text-gray-800">{selectedLog.entityName || '-'}</span>
                {selectedLog.entityId && <span className="block text-gray-400 font-mono text-[11px]">ID: {selectedLog.entityId}</span>}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-2">Captured Details & Changes:</span>
              {selectedLog.details && typeof selectedLog.details === 'object' && Object.keys(selectedLog.details).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedLog.details.oldName !== undefined || selectedLog.details.newName !== undefined ? (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="font-semibold text-amber-900 flex items-center justify-between border-b border-amber-200/50 pb-1">
                        <span>Name Change</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Updated</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                          <span className="text-gray-400 text-[11px] block font-medium">Previous Value</span>
                          <span className="font-semibold text-rose-600 line-through">{selectedLog.details.oldName || '-'}</span>
                        </div>
                        <div className="bg-white/80 p-2 rounded-lg border border-amber-100">
                          <span className="text-gray-400 text-[11px] block font-medium">New Value</span>
                          <span className="font-semibold text-emerald-600">{selectedLog.details.newName || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {selectedLog.details.updatedFields && Array.isArray(selectedLog.details.updatedFields) ? (
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3 text-xs">
                      <span className="font-semibold text-blue-900 block mb-1.5">Modified Fields</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLog.details.updatedFields.map((field: string, idx: number) => (
                          <span key={idx} className="bg-white border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-[11px] font-medium shadow-xs">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Render any other key-value pairs */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-2">
                    {Object.entries(selectedLog.details)
                      .filter(([key]) => !['oldName', 'newName', 'updatedFields'].includes(key))
                      .map(([key, value], index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-1.5 last:border-0 last:pb-0 gap-1">
                          <span className="font-medium text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-semibold text-slate-800 break-all bg-white px-2 py-0.5 rounded border border-slate-200/60">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 text-center">
                  No additional change details recorded.
                </div>
              )}
            </div>

            {selectedLog.ipAddress && (
              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-2 flex justify-between">
                <span>IP Address: {selectedLog.ipAddress}</span>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
