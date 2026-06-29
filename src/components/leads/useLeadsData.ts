// components/leads/useLeadsData.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { ApiLead, ApiSource, ApiStatus, ApiUser, LeadLabel, LeadCountSummary } from './types';
import { useAppSelector } from '@/redux/hooks';

type Filters = {
  search?: string;
  status?: string;
  source?: string;
  staff?: string;
  from?: string;
  to?: string;
};

export function useLeadsData(
  activeTab: 'all' | 'my' = 'all',
  filters: Filters = {},
  viewMode: 'list' | 'kanban' = 'list',
  kanbanSubView: 'board' | 'lost' | 'won' = 'board'
) {
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [leadsList, setLeadsList] = useState<ApiLead[]>([]);
  const [lostLeads, setLostLeads] = useState<ApiLead[]>([]);
  const [wonLeads, setWonLeads] = useState<ApiLead[]>([]);

  const [sources, setSources] = useState<ApiSource[]>([]);
  const [statuses, setStatuses] = useState<ApiStatus[]>([]);
  const [staffMembers, setStaffMembers] = useState<ApiUser[]>([]);
  const [leadLabels, setLeadLabels] = useState<LeadLabel[]>([]);
  const [counts, setCounts] = useState<LeadCountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    create: false, update: false, delete: false, readAll: false, readOwn: false,
  });

  const currentStaff = useAppSelector((state) => state.auth.currentStaff);
  const leadStatusesData = useAppSelector((state) => state.leadStatus.data);

  useEffect(() => {
    if (currentStaff) {
      const role: any = currentStaff.role || {};
      const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
      const lp = rawPerms.lead || {};
      setPermissions({
        create: !!lp.create, update: !!lp.update, delete: !!lp.delete,
        readAll: !!lp.readAll, readOwn: !!lp.readOwn,
      });
    }
  }, [currentStaff]);

  useEffect(() => {
    setStatuses(leadStatusesData || []);
  }, [leadStatusesData]);

  // List pagination
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [listTotalItems, setListTotalItems] = useState(0);

  // Lost pagination
  const [lostPage, setLostPage] = useState(1);
  const [lostTotalPages, setLostTotalPages] = useState(1);
  const [lostTotalItems, setLostTotalItems] = useState(0);

  // Won pagination
  const [wonPage, setWonPage] = useState(1);
  const [wonTotalPages, setWonTotalPages] = useState(1);
  const [wonTotalItems, setWonTotalItems] = useState(0);

  const LIMIT = 10;

  const getHeaders = () => ({ Authorization: `Bearer ${getAuthToken()}` });

  // Keep latest values in a ref so callbacks always read fresh values
  const stateRef = useRef({
    activeTab, filters, viewMode, kanbanSubView,
    listPage, lostPage, wonPage,
  });
  useEffect(() => {
    stateRef.current = {
      activeTab, filters, viewMode, kanbanSubView,
      listPage, lostPage, wonPage,
    };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FETCH FUNCTIONS — accept explicit params so they never use stale closures
  // ─────────────────────────────────────────────────────────────────────────

  const fetchKanbanLeads = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    signal?: AbortSignal
  ) => {
    try {
      const useKanbanEndpoint = !!baseUrl.getKanbanData;

      if (useKanbanEndpoint) {
        const res = await axios.get(baseUrl.getKanbanData, {
          headers: getHeaders(),
          params: {
            my: tab === 'my' || undefined,
            search: f.search || undefined,
            status: f.status || undefined,
            source: f.source || undefined,
            staff: f.staff || undefined,
            from: f.from || undefined,
            to: f.to || undefined,
            limit: LIMIT,
          },
          signal,
        });

        const data = res.data?.data;

        if (Array.isArray(data)) {
          // Shape A: grouped → [{ leads: [...] }, ...]
          // Shape B: flat array of leads
          const isGrouped = data.length > 0 && Array.isArray((data[0] as any)?.leads);
          setLeads(isGrouped ? (data as any[]).flatMap((g: any) => g.leads || []) : (data as ApiLead[]));
        } else {
          setLeads([]);
        }
      } else {
        // Fallback: no dedicated kanban endpoint
        const url = tab === 'my' ? baseUrl.myLeads : baseUrl.getAllLeads;
        const res = await axios.get(url, {
          headers: getHeaders(),
          params: {
            search: f.search || undefined,
            status: f.status || undefined,
            source: f.source || undefined,
            staff: f.staff || undefined,
            from: f.from || undefined,
            to: f.to || undefined,
            limit: 100,
          },
          signal,
        });
        setLeads(res.data?.data || []);
      }
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error('fetchKanbanLeads error:', e);
      setLeads([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeadsList = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    page = stateRef.current.listPage,
    signal?: AbortSignal
  ) => {
    try {
      const url = tab === 'my' ? baseUrl.myLeads : baseUrl.getAllLeads;
      const res = await axios.get(url, {
        headers: getHeaders(),
        params: {
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
          page,
          limit: LIMIT,
        },
        signal,
      });
      const arr = res.data?.data || [];
      const p = res.data?.pagination || {};
      setLeadsList(arr);
      setListTotalItems(p.totalRecords ?? p.total ?? p.count ?? arr.length);
      setListTotalPages(p.totalPages ?? (p.totalRecords ? Math.ceil(p.totalRecords / LIMIT) : 1));
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error('fetchLeadsList error:', e);
      setLeadsList([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLostLeads = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    page = stateRef.current.lostPage,
    signal?: AbortSignal
  ) => {
    try {
      const res = await axios.get(baseUrl.getLostLeads, {
        headers: getHeaders(),
        params: {
          my: tab === 'my' || undefined,
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
          page,
          limit: LIMIT,
        },
        signal,
      });
      const raw = res.data?.data;
      const arr: ApiLead[] = Array.isArray(raw) ? raw : (raw?.data || []);
      const p = res.data?.pagination || {};
      setLostLeads(arr);
      setLostTotalItems(p.totalRecords ?? p.total ?? p.count ?? arr.length);
      setLostTotalPages(p.totalPages ?? (p.totalRecords ? Math.ceil(p.totalRecords / LIMIT) : 1));
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error('fetchLostLeads error:', e);
      setLostLeads([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWonLeads = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters,
    page = stateRef.current.wonPage,
    signal?: AbortSignal
  ) => {
    try {
      const res = await axios.get(baseUrl.getWonLeads, {
        headers: getHeaders(),
        params: {
          my: tab === 'my' || undefined,
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
          page,
          limit: LIMIT,
        },
        signal,
      });
      const raw = res.data?.data;
      const arr: ApiLead[] = Array.isArray(raw) ? raw : (raw?.data || []);
      const p = res.data?.pagination || {};
      setWonLeads(arr);
      setWonTotalItems(p.totalRecords ?? p.total ?? p.count ?? arr.length);
      setWonTotalPages(p.totalPages ?? (p.totalRecords ? Math.ceil(p.totalRecords / LIMIT) : 1));
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error('fetchWonLeads error:', e);
      setWonLeads([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCounts = useCallback(async (
    tab = stateRef.current.activeTab,
    f: Filters = stateRef.current.filters
  ) => {
    try {
      const url = tab === 'my' ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
      const res = await axios.get(url, {
        headers: getHeaders(),
        params: {
          search: f.search || undefined,
          status: f.status || undefined,
          source: f.source || undefined,
          staff: f.staff || undefined,
          from: f.from || undefined,
          to: f.to || undefined,
        },
      });
      setCounts(res.data?.data || null);
    } catch (e) {
      if (axios.isCancel(e)) return;
      console.error('fetchCounts error:', e);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchMeta = useCallback(async () => {
    try {
      try {
        const staffRes = await axios.get(baseUrl.getSalesExecutives || baseUrl.getAllStaff || baseUrl.getAllUsers, { headers: getHeaders() });
        setStaffMembers(staffRes.data?.data ?? []);
      } catch (err) {
        console.error('Failed to fetch staff members, falling back to current user:', err);
        if (currentStaff) {
          setStaffMembers([
            {
              _id: currentStaff._id,
              fullName: currentStaff.fullName,
              email: currentStaff.email,
              phone: currentStaff.phone,
              status: currentStaff.status,
            } as any
          ]);
        } else {
          setStaffMembers([]);
        }
      }
    } catch (e) {
      console.error('fetchMeta error:', e);
    }
  }, [currentStaff]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────
  // refetchAll — always reads latest values from ref, no stale closures
  // ─────────────────────────────────────────────────────────────────────────
  const refetchAll = useCallback(async () => {
    const { activeTab: tab, filters: f, viewMode: vm, kanbanSubView: ksv,
            listPage: lp, lostPage: lsp, wonPage: wp } = stateRef.current;

    if (vm === 'list') {
      await Promise.all([fetchLeadsList(tab, f, lp), fetchCounts(tab, f)]);
    } else {
      const calls: Promise<void>[] = [
        fetchKanbanLeads(tab, f),
        fetchCounts(tab, f),
        fetchLostLeads(tab, f, lsp),
        fetchWonLeads(tab, f, wp)
      ];
      await Promise.all(calls);
    }
  }, [fetchLeadsList, fetchKanbanLeads, fetchLostLeads, fetchWonLeads, fetchCounts]);

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // 1. Meta — once
  useEffect(() => { fetchMeta(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Unified load & Re-fetch when viewMode / activeTab / filters / pagination change
  const prevKey = useRef('');
  const prevFiltersKey = useRef('');
  
  useEffect(() => {
    const filtersKey = JSON.stringify({ viewMode, activeTab, filters });
    let pageResetNeeded = false;
    
    if (filtersKey !== prevFiltersKey.current) {
      prevFiltersKey.current = filtersKey;
      if (listPage !== 1 || lostPage !== 1 || wonPage !== 1) {
        setListPage(1);
        setLostPage(1);
        setWonPage(1);
        pageResetNeeded = true;
      }
    }

    if (pageResetNeeded) return; // Exit early, the state updates will trigger an immediate re-render

    const key = JSON.stringify({ viewMode, activeTab, filters, kanbanSubView, listPage, lostPage, wonPage });
    if (key === prevKey.current) return;
    
    const prevParsed = prevKey.current ? JSON.parse(prevKey.current) : null;
    prevKey.current = key;

    const controller = new AbortController();
    const signal = controller.signal;

    const load = async () => {
      setLoading(true);
      const calls: Promise<void>[] = [];
      
      const filtersChanged = !prevParsed || prevParsed.activeTab !== activeTab || JSON.stringify(prevParsed.filters) !== JSON.stringify(filters);
      const viewModeChanged = prevParsed && prevParsed.viewMode !== viewMode;
      
      if (filtersChanged || viewModeChanged) {
        calls.push(fetchCounts(activeTab, filters));
      }

      if (viewMode === 'list') {
        const listPageChanged = !prevParsed || prevParsed.listPage !== listPage;
        if (filtersChanged || viewModeChanged || listPageChanged) {
          calls.push(fetchLeadsList(activeTab, filters, listPage, signal));
        }
      } else {
        const lostPageChanged = !prevParsed || prevParsed.lostPage !== lostPage;
        const wonPageChanged = !prevParsed || prevParsed.wonPage !== wonPage;
        const kanbanSubViewChanged = !prevParsed || prevParsed.kanbanSubView !== kanbanSubView;
        
        if (filtersChanged || viewModeChanged || kanbanSubViewChanged) {
          if (kanbanSubView === 'board') {
            calls.push(fetchKanbanLeads(activeTab, filters, signal));
          } else if (kanbanSubView === 'lost') {
            calls.push(fetchLostLeads(activeTab, filters, lostPage, signal));
          } else if (kanbanSubView === 'won') {
            calls.push(fetchWonLeads(activeTab, filters, wonPage, signal));
          }
        } else {
          // Pagination changes for lost/won while staying on the same subview
          if (kanbanSubView === 'lost' && lostPageChanged) calls.push(fetchLostLeads(activeTab, filters, lostPage, signal));
          if (kanbanSubView === 'won' && wonPageChanged) calls.push(fetchWonLeads(activeTab, filters, wonPage, signal));
        }
      }
      
      if (calls.length > 0) {
        await Promise.all(calls);
      }
      
      if (!signal.aborted) setLoading(false);
    };
    
    load();
    return () => { controller.abort(); };
  }, [viewMode, activeTab, filters, kanbanSubView, listPage, lostPage, wonPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────────────

  const findLeadById = useCallback(
    (id: string) =>
      leads.find(l => l._id === id) ||
      leadsList.find(l => l._id === id) ||
      lostLeads.find(l => l._id === id) ||
      wonLeads.find(l => l._id === id),
    [leads, leadsList, lostLeads, wonLeads]
  );

  return {
    leads, setLeads,
    leadsList, setLeadsList,
    lostLeads, wonLeads,
    sources, statuses, staffMembers, leadLabels,
    counts, loading, permissions,
    refetchAll,
    fetchLeadsList,
    fetchKanbanLeads,
    findLeadById,

    listPagination: {
      currentPage: listPage,
      rowsPerPage: LIMIT,
      totalPages: listTotalPages,
      totalItems: listTotalItems,
      handlePageChange: (p: number) => setListPage(p),
      handleRowsPerPageChange: (_: number) => setListPage(1),
    },
    lostPagination: {
      currentPage: lostPage,
      rowsPerPage: LIMIT,
      totalPages: lostTotalPages,
      totalItems: lostTotalItems,
      handlePageChange: (p: number) => setLostPage(p),
      handleRowsPerPageChange: (_: number) => setLostPage(1),
    },
    wonPagination: {
      currentPage: wonPage,
      rowsPerPage: LIMIT,
      totalPages: wonTotalPages,
      totalItems: wonTotalItems,
      handlePageChange: (p: number) => setWonPage(p),
      handleRowsPerPageChange: (_: number) => setWonPage(1),
    },
    pagination: {
      currentPage: listPage,
      rowsPerPage: LIMIT,
      totalPages: listTotalPages,
      totalItems: listTotalItems,
      handlePageChange: (p: number) => setListPage(p),
      handleRowsPerPageChange: (_: number) => setListPage(1),
    },
  };
}