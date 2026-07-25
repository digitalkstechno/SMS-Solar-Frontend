// components/leads/LeadsKanbanView.tsx
// Kanban board with Board / Lost / Won sub-views + drag-and-drop

import { useState, useCallback, useEffect } from 'react';
import { FiSearch, FiPhone, FiMail, FiEye, FiEdit, FiThumbsDown } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiStatus } from './types';
import { Edit, Eye, RefreshCw, Package } from 'lucide-react';
import DataTable, { Column } from '@/components/DataTable';

interface Props {
    leads: ApiLead[];
    lostLeads: ApiLead[];
    wonLeads: ApiLead[];
    statuses: any[];
    onEdit: (lead: ApiLead) => void;
    onView: (lead: ApiLead) => void;
    onRefresh: () => void;
    counts?: Record<string, number>;
    permissions?: { create: boolean; update: boolean; delete: boolean };
}

type SubView = 'board' | 'lost' | 'won';

export default function KanbanCard({
    lead, onDragStart, onView, onEdit, onMarkLost, onMarkWon, onReactivate, onMarkStock, isUpdating
}: {
    lead: ApiLead;
    onDragStart?: () => void;
    onView: () => void;
    onEdit?: () => void;
    onMarkLost?: () => void;
    onMarkWon?: () => void;
    onReactivate?: () => void;
    onMarkStock?: () => void;
    isUpdating?: boolean;
}) {
    return (
        <div
            draggable={!isUpdating && !!onDragStart}
            onDragStart={!isUpdating && onDragStart ? onDragStart : undefined}
            className={`relative rounded-xl bg-white p-3 shadow-sm transition-shadow ${
                isUpdating ? "opacity-60 pointer-events-none" : (onDragStart ? "cursor-move hover:shadow-md" : "hover:shadow-md")
            }`}
        >
            {isUpdating && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                </div>
            )}
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-center">
                    <div className="font-semibold text-gray-900 truncate leading-tight">{lead.fullName}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={onView}
                        title="View"
                        className="h-6 w-6 cursor-pointer rounded-full bg-blue-500 text-white flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                    >
                        <FiEye className="h-3 w-3" />
                    </button>
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            title="Edit"
                            className="h-6 w-6 cursor-pointer rounded-full bg-green-600 text-white flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                        >
                            <FiEdit className="h-3 w-3" />
                        </button>
                    )}
                    {onMarkLost && (
                        <button
                            onClick={onMarkLost}
                            title="Mark as Lost"
                            className="h-6 w-6 cursor-pointer rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                        >
                            <FiThumbsDown className="h-3 w-3" />
                        </button>
                    )}
                    {onReactivate && (
                        <button
                            onClick={onReactivate}
                            title="Reactivate Lead"
                            className="h-6 w-6 cursor-pointer rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                        >
                            <RefreshCw className="h-3 w-3" />
                        </button>
                    )}
                    {onMarkStock && (
                        <button
                            onClick={onMarkStock}
                            title="Assign Stock"
                            className="h-6 w-6 cursor-pointer rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:-translate-y-0.5 hover:shadow transition-all"
                        >
                            <Package className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-2 flex flex-col gap-1.5 border-t border-gray-100 pt-2 text-sm text-gray-600">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 text-gray-500">
                        <div className="flex items-center gap-1">
                            <FiPhone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate text-xs font-medium">{lead.contact}</span>
                        </div>
                        {lead.kwRequirement && (
                            <span className="text-[9px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 flex-shrink-0">
                                {lead.kwRequirement} KW
                            </span>
                        )}
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide flex-shrink-0 border ${
                        lead.isVisitCompleted
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                        {lead.isVisitCompleted ? 'VISIT DONE' : 'VISIT PENDING'}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    {lead.assignedTo?.avatar ? (
                        <img src={lead.assignedTo.avatar} className="h-4 w-4 rounded-full object-cover flex-shrink-0 border border-gray-200" alt="" />
                    ) : (
                        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-pink-300 via-pink-400 to-[#A63C71] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 shadow-sm ring-1 ring-pink-200/50">
                            {lead.assignedTo?.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                    <span className="truncate text-xs text-gray-700 font-medium">{lead.assignedTo?.fullName || 'Unassigned'}</span>
                </div>
            </div>
        </div>
    );
}