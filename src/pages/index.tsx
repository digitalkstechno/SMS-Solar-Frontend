"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line,
  LineChart,
  AreaChart,
  Area
} from "recharts";
import {
  Users,
  Phone,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  TrendingUp,
  Activity,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Mail as MailIcon,
} from "lucide-react";
import axios from "axios";
import { baseUrl, getAuthToken } from "@/config";
import moment from "moment";
import { useAppSelector } from '@/redux/hooks';
import DashboardLeadUpdateDialog from "@/components/leads/DashboardLeadUpdateDialog";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';


interface StatusCount {
  statusId: string;
  statusName: string;
  count: number;
}

interface LeadSummary {
  totalLeads: number;
  currentMonthLeads: number;
  totalRevenue: number;
  statusWiseCounts: StatusCount[];
}

interface SummaryCard {
  key: string;
  label: string;
  value: number | string;
  Icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const CustomLightTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const color = entry.payload?.fill || entry.color || "#a63c71";
    const value = entry.value;
    const name = entry.name;
    return (
      <div className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100 min-w-[90px] text-left">
        <p className="font-bold text-xs text-gray-800">{name}</p>
        <p className="font-bold text-xs mt-0.5" style={{ color: color }}>
          {value} {value === 1 ? "Lead" : "Leads"}
        </p>
      </div>
    );
  }
  return null;
};

const LeadSourceTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const color = entry.payload?.fill || entry.color || "#a63c71";
    const value = entry.value;
    return (
      <div className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100 min-w-[90px] text-left">
        <p className="font-bold text-xs" style={{ color: color }}>
          {value} {value === 1 ? "Lead" : "Leads"}
        </p>
      </div>
    );
  }
  return null;
};

const YearSelect = ({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (val: number) => void;
  options: number[];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-750 shadow-sm focus:outline-none flex items-center gap-2 hover:bg-gray-50 cursor-pointer min-w-[100px] justify-between"
      >
        <span>{value}</span>
        <svg
          className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 min-w-[95px] py-1.5 overflow-hidden origin-top-right"
            style={{ animation: "fadeInScale 0.15s ease-out forwards" }}
          >
            {options.map((yr) => (
              <div
                key={yr}
                onClick={() => {
                  onChange(yr);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${value === yr
                  ? "bg-[#a63c71] text-white"
                  : "text-gray-700 hover:bg-[#a63c71]/10 hover:text-[#a63c71]"
                  }`}
              >
                {yr}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ITEMS_PER_PAGE = 20;

const CustomDarkTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 min-w-[150px]">
        <p className="font-semibold text-sm mb-2 pb-2 border-b border-slate-700">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span className="font-medium text-white">{entry.value}</span>
                  {payload.length > 1 && <span className="text-slate-500 text-[10px] w-8 text-right">{percentage}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomSalesTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs min-w-[130px] flex flex-col gap-1.5">
        <p className="font-bold text-gray-900 mb-1 pb-1 border-b border-gray-100">
          {payload[0].payload.name}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            return (
              <div key={index} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-500 font-medium">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};


export default function Dashboard() {
  const router = useRouter();

  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [staffPerformance, setStaffPerformance] = useState<
    { name: string; converted: number; pending: number; lost: number }[]
  >([]);

  const [kwGrowthData, setKwGrowthData] = useState<any>({ total: 0, chartData: [] });
  const [kwTimeframe, setKwTimeframe] = useState<string>("year");

  const [salesWinRateData, setSalesWinRateData] = useState<any[]>([]);
  const [salesTimeframe, setSalesTimeframe] = useState<string>("all");

  // Upcoming Follow-ups (paginated)
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1);
  const [upcomingFollowups, setUpcomingFollowups] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [visibleStatusNames, setVisibleStatusNames] = useState<string[] | null>(null);
  // Due Follow-ups (paginated)
  const [duePage, setDuePage] = useState(1);
  const [dueTotalPages, setDueTotalPages] = useState(1);
  const [dueFollowups, setDueFollowups] = useState<any[]>([]);
  const [dueLoading, setDueLoading] = useState(false);

  // Today's Tasks
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [chartType, setChartType] = useState<"pie" | "graph">("pie");
  const [revenueFilter, setRevenueFilter] = useState<number>(new Date().getFullYear());
  const [isRevenueYearClicked, setIsRevenueYearClicked] = useState(false);
  const [totalRevenueChart, setTotalRevenueChart] = useState<number>(0);
  const [revenueGrowthData, setRevenueGrowthData] = useState<any[]>([]);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);
  const [followupFilter, setFollowupFilter] = useState<number>(new Date().getFullYear());
  const [isKwYearClicked, setIsKwYearClicked] = useState(false);
  const [followupChartData, setFollowupChartData] = useState<any[]>([]);
  const [leadSourceChartData, setLeadSourceChartData] = useState<any[]>([]);
  const [visitChartData, setVisitChartData] = useState<any[]>([]);
  const [visitFilter, setVisitFilter] = useState<"today" | "this week" | "this month">("today");

  const [visitConfirmOpen, setVisitConfirmOpen] = useState(false);
  const [visitConfirmLeadId, setVisitConfirmLeadId] = useState<string | null>(null);

  const [visitLeads, setVisitLeads] = useState<any[]>([]);
  const [visitLeadsLoading, setVisitLeadsLoading] = useState(false);
  const [visitPage, setVisitPage] = useState(1);
  const [visitTotalPages, setVisitTotalPages] = useState(1);

  const [isUpdateLeadDialogOpen, setIsUpdateLeadDialogOpen] = useState(false);
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState<any>(null);

  const [permissions, setPermissions] = useState<{ readAll: boolean; readOwn: boolean; viewStaff: boolean }>({ readAll: false, readOwn: false, viewStaff: false });
  const [activeTab, setActiveTab] = useState<'overview' | 'stock'>('overview');
  const [stockProducts, setStockProducts] = useState<any[]>([]);
  const [stockSearch, setStockSearch] = useState("");
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isTelecaller =
    user?.role?.roleName?.toUpperCase() === "TELECALLING" ||
    user?.role?.roleName?.toUpperCase() === "CALLING" ||
    user?.role?.name?.toUpperCase() === "TELECALLING" ||
    user?.role?.name?.toUpperCase() === "CALLING";
  const [greeting, setGreeting] = useState("");
  const getInitialDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const format = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return { from: format(start), to: format(end) };
  };

  const initialDates = getInitialDates();
  const [fromDate, setFromDate] = useState(initialDates.from);
  const [toDate, setToDate] = useState(initialDates.to);
  const [activeFilter, setActiveFilter] = useState<'today' | 'month' | 'prev-month' | 'year' | 'custom' | ''>('month');
  const [kwFilter, setKwFilter] = useState<number>(new Date().getFullYear());
  const [allLeads, setAllLeads] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? getAuthToken() : null;
  const currentStaff = useAppSelector((state) => state.auth.currentStaff);

  // Fetch user info and permissions
  useEffect(() => {
    if (!currentStaff) return;
    const staff = currentStaff;
    setUser(staff);
    const role = staff.role || {} as any;
    const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
    const lp = rawPerms.lead || {};
    const sp = rawPerms.setup || {};
    setPermissions({
      readAll: !!lp.readAll,
      readOwn: !!lp.readOwn,
      viewStaff: !!sp.readAll,
    });

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [currentStaff]);

  // Redirect if no token
  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-700 border-blue-200",
      Contacted: "bg-purple-100 text-purple-700 border-purple-200",
      "Follow-Up": "bg-orange-100 text-orange-700 border-orange-200",
      Interested: "bg-green-100 text-green-700 border-green-200",
      Qualified: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Not Interested": "bg-gray-100 text-gray-700 border-gray-200",
      Lost: "bg-red-100 text-red-700 border-red-200",
      Won: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const fetchLeadSummary = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.dashboardStats, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: fromDate || undefined,
          to: toDate || undefined,
          revenueYear: isRevenueYearClicked ? revenueFilter : undefined,
          kwYear: isKwYearClicked ? kwFilter : undefined,
        }
      });
      const data = res.data.data;
      setSummary(data);
      if (data?.charts?.salesWinRate) {
        setSalesWinRateData(data.charts.salesWinRate);
      }
      if (data?.charts?.visits) {
        setVisitChartData(data.charts.visits);
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  };

  const fetchStaffPerformance = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.getAllUsers, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chartData = (res.data.data ?? []).map((staff: any) => ({
        name: staff.fullName || "Unknown",
        converted: staff.status?.toLowerCase() === "active" ? 1 : 0,
        pending: staff.status?.toLowerCase() === "inactive" ? 1 : 0,
        lost: 0,
      }));
      setStaffPerformance(chartData);
    } catch (err) {
      console.error("Staff performance error:", err);
    }
  };

  const fetchKwGrowth = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.kwGrowth, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: isKwYearClicked ? kwFilter : undefined }
      });
      setKwGrowthData(res.data.data);
    } catch (err) {
      console.error("KW Growth error:", err);
    }
  };

  const fetchRevenueGrowth = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.revenueGrowth, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: isRevenueYearClicked ? revenueFilter : undefined }
      });
      setRevenueGrowthData(res.data.data.chartData);
      setTotalRevenueChart(res.data.data.total);
    } catch (err) {
      console.error("Revenue Growth error:", err);
    }
  };

  useEffect(() => {
    fetchKwGrowth();
  }, [kwFilter, isKwYearClicked, token]);

  useEffect(() => {
    fetchRevenueGrowth();
  }, [revenueFilter, isRevenueYearClicked, token]);

  const fetchVisitStats = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${baseUrl.updateLead}/visit-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: visitFilter !== "all" ? { filter: visitFilter } : {}
      });
      if (res.data?.data) {
        setVisitChartData(res.data.data);
      }
    } catch (err) {
      console.error("Visit stats error:", err);
    }
  };

  const fetchVisitLeads = async (page: number) => {
    if (!token) return;
    setVisitLeadsLoading(true);
    try {
      const res = await axios.get(`${baseUrl.updateLead}/visit-leads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, filter: visitFilter !== "all" ? visitFilter : "today" }
      });
      setVisitLeads(res.data.data || []);
      setVisitTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching visit leads:", error);
    } finally {
      setVisitLeadsLoading(false);
    }
  };

  const markVisitDone = async () => {
    if (visitConfirmLeadId) {
      try {
        await axios.put(`${baseUrl.updateLead}/${visitConfirmLeadId}/visit`, { isVisitCompleted: true }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Visit marked as done!");
        fetchVisitLeads(visitPage);
        fetchVisitStats();
      } catch (err) {
        toast.error("Failed to update visit status");
      } finally {
        setVisitConfirmOpen(false);
        setVisitConfirmLeadId(null);
      }
    }
  };

  useEffect(() => {
    fetchVisitStats();
    fetchVisitLeads(visitPage);
  }, [visitFilter, visitPage, token]);

  const fetchUpcomingFollowups = async (page: number) => {
    if (!token) return;
    setUpcomingLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.leadUpcomingFollowupsMy : baseUrl.leadUpcomingFollowups;
      const res = await axios.get(
        `${url}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { data, pagination } = res.data;
      // Exclude leads that are already marked as "Won" from the list
      const filteredData = (data || []).filter(
        (lead: any) => lead.leadStatus?.name?.toLowerCase() !== 'won'
      );
      setUpcomingFollowups(filteredData);
      setUpcomingTotalPages(pagination?.totalPages || 1);
      setUpcomingPage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Upcoming followups error:", err);
      setUpcomingFollowups([]);
    } finally {
      setUpcomingLoading(false);
    }
  };

  const fetchDueFollowups = async (page: number) => {
    if (!token) return;
    setDueLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.leadDueFollowupsMy : baseUrl.leadDueFollowups;
      const res = await axios.get(
        `${url}?page=${page}&limit=${ITEMS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { data, pagination } = res.data;
      const filteredData = (data || []).filter(
        (lead: any) => lead.leadStatus?.name?.toLowerCase() !== 'won'
      );
      setDueFollowups(filteredData);
      setDueTotalPages(pagination?.totalPages || 1);
      setDuePage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Due followups error:", err);
      setDueFollowups([]);
    } finally {
      setDueLoading(false);
    }
  };

  // Only fetch summary stats when date range changes
  useEffect(() => {
    if (token && user) {
      fetchLeadSummary();
    }
  }, [token, fromDate, toDate, user]);

  // Fetch other dashboard modules once (or when auth state changes)
  useEffect(() => {
    if (token && user) {
      fetchUpcomingFollowups(1);
      fetchDueFollowups(1);

      if (permissions.viewStaff) {
        fetchStaffPerformance();
      }
    }
  }, [token, permissions, user]);

  const fetchStockData = async () => {
    if (!token) return;
    setIsStockLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(baseUrl.product, {
        headers,
        params: { limit: 1000 }
      });
      if (res.data?.data) {
        setStockProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load stock data", err);
      toast.error("Failed to refresh stock sheet");
    } finally {
      setIsStockLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stock' && token) {
      fetchStockData();
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kanbanVisibleStatusNames");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setVisibleStatusNames(parsed.filter((x) => typeof x === "string"));
          }
        } catch {
        }
      }
    }
  }, []);

  // Color palette for statuses (shades of #a63c71)
  const statusColorPalette = [
    "#a63c71", // base
    "#bd5087", // lighter
    "#d1669c", // even lighter
    "#e37db1", // very light
    "#f395c7", // soft pink
    "#8d295b", // darker
    "#751846", // even darker
    "#5d0632", // very dark
    "#ffacdc", // extremely light pink
    "#460020", // extremely dark burgundy
  ];

  const summaryCards: SummaryCard[] = summary?.counts
    ? [
      {
        key: "total",
        label: "Total Leads",
        value: summary.counts.total || 0,
        Icon: Users,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
      },
      {
        key: "new",
        label: "Total New Leads",
        value: summary.counts.new || 0,
        Icon: TrendingUp,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
      },
      {
        key: "won",
        label: "Total Won Leads",
        value: summary.counts.won || 0,
        Icon: CheckCircle2,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
      },
      {
        key: "lost",
        label: "Total Lost Leads",
        value: summary.counts.lost || 0,
        Icon: XCircle,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
      },
      {
        key: "followups",
        label: "Follow-ups",
        value: summary.counts.followups || 0,
        Icon: Phone,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
      },
      ...(!isTelecaller ? [{
        key: "revenue",
        label: "Total Revenue",
        value: `₹${(summary.counts?.revenue || 0).toLocaleString()}`,
        Icon: Activity,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-500",
      }] : [])
    ]
    : [];

  const getStatusOrderValue = (name: string): number => {
    const lowerName = name?.toLowerCase();
    if (lowerName === "new lead" || lowerName === "new") return 1;
    if (lowerName === "won") return 2;
    if (lowerName === "lost") return 3;
    return 4;
  };

  const sortedStatusCounts = summary?.charts?.statusWiseCounts
    ? [...summary.charts.statusWiseCounts].sort((a: any, b: any) => {
      const orderA = getStatusOrderValue(a.statusName);
      const orderB = getStatusOrderValue(b.statusName);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return 0;
    })
    : [];

  const statusChartData = sortedStatusCounts.map((s, idx) => ({
    name: s.statusName,
    value: s.count,
    fill: statusColorPalette[idx % statusColorPalette.length]
  }));

  const handleQuickFilter = (range: 'today' | 'month' | 'prev-month' | 'year' | 'custom') => {
    setIsRevenueYearClicked(false);
    setIsKwYearClicked(false);
    const currentYear = new Date().getFullYear();
    setRevenueFilter(currentYear);
    setKwFilter(currentYear);

    if (activeFilter === range) {
      setActiveFilter('');
      setFromDate('');
      setToDate('');
      return;
    }

    setActiveFilter(range);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (range === 'prev-month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (range === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else if (range === 'custom') {
      if (!fromDate || !toDate) {
        const defaultDates = getInitialDates();
        setFromDate(defaultDates.from);
        setToDate(defaultDates.to);
      }
      return;
    }

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setFromDate(format(start));
    setToDate(format(end));
  };

  const renderFollowupTable = (
    title: string,
    items: any[],
    loading: boolean,
    page: number,
    totalPages: number,
    setPage: (p: number) => void,
    dateHeader: string = "Follow up Date",
    dateField: "nextFollowupDate" | "visitDate" = "nextFollowupDate",
    isVisitTable: boolean = false
  ) => (
    <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${dateHeader === "Follow up Date" ? "bg-blue-50" : (dateHeader === "Visit Date" ? "bg-emerald-50" : "bg-red-50")}`}>
              {dateHeader === "Follow up Date" ? (
                <Clock className="h-5 w-5 text-blue-600" />
              ) : dateHeader === "Visit Date" ? (
                <Clock className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-4">
            {isVisitTable && (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {["today", "this week", "this month"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setVisitFilter(f as any)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                      visitFilter === f ? 'bg-white text-[#a63c71] shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${dateHeader === "Follow up Date"
              ? "bg-blue-100 text-blue-700"
              : (dateHeader === "Visit Date" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")
              }`}>
              {items.length} {items.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex-1 flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-gray-50 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{isVisitTable ? 'No visits found' : 'No follow-ups found'}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-y-auto max-h-[350px] flex-1">
            <table className="min-w-full divide-y divide-gray-100 text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Lead Name & Contact</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Schedule</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {items.map((lead, index) => (
                  <tr
                    key={lead._id || lead.id || index}
                    className="hover:bg-blue-50/10 transition-colors group"

                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm">
                        {lead.fullName || "Unknown"}
                      </div>
                      {lead.contact && (
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-medium">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {lead.contact}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-gray-900">
                        {lead[dateField] ? moment(lead[dateField]).format("DD-MM-YYYY") : "-"}
                      </div>
                      {dateField === "nextFollowupDate" && (
                        <div className="text-xs text-gray-500 mt-1 font-medium">
                          {lead.nextFollowupTime || "-"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getStatusColor(lead.leadStatus?.name || "")}`}>
                        {lead.leadStatus?.name || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      {isVisitTable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisitConfirmLeadId(lead._id);
                            setVisitConfirmOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Mark Done
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadForUpdate(lead);
                            setIsUpdateLeadDialogOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#a63c71]/10 hover:bg-[#a63c71]/20 text-[#a63c71] border border-[#a63c71]/20 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Pending
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-xs font-medium text-gray-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Group products by category
  const filteredProducts = stockProducts.filter((prod: any) => {
    const nameMatches = prod.name?.toLowerCase().includes(stockSearch.toLowerCase());
    const categoryMatches = (prod.categoryId?.name || prod.category?.name || "").toLowerCase().includes(stockSearch.toLowerCase());
    return nameMatches || categoryMatches;
  });

  const groupedStock = filteredProducts.reduce((acc: any, prod: any) => {
    const categoryName = prod.categoryId?.name || prod.category?.name || "Uncategorized";
    const unit = prod.unit || "NOS";
    const catKey = `${categoryName} (${unit})`;
    if (!acc[catKey]) {
      acc[catKey] = [];
    }
    acc[catKey].push(prod);
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen">
      <div className="space-y-8 w-full">

        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {greeting}, {user?.fullName?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              Here's what's happening with your projects today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 border border-gray-200/60 rounded-3xl p-2.5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: "Today", value: "today" },
                { label: "This Month", value: "month" },
                { label: "Previous Month", value: "prev-month" },
                { label: "This Year", value: "year" },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleQuickFilter(btn.value as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${activeFilter === btn.value
                    ? "bg-[#a63c71] text-white shadow-sm border border-[#a63c71]"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-150/40"
                    }`}
                >
                  {btn.label}
                </button>
              ))}

              <button
                onClick={() => handleQuickFilter('custom')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeFilter === 'custom'
                  ? "bg-[#a63c71] text-white shadow-md border border-[#a63c71]"
                  : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm"
                  }`}
              >
                Custom
              </button>
            </div>

            {activeFilter === 'custom' && (
              <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-gray-200 pt-3 lg:pt-0 lg:pl-4 transition-all duration-300">
                <div className="relative w-[140px]">
                  <span className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-[#a63c71] tracking-wider uppercase scale-90 origin-left z-10">From Date</span>
                  <DatePicker
                    selected={fromDate ? new Date(fromDate) : null}
                    onChange={(date: Date | null) => {
                      setFromDate(date ? date.toISOString().split('T')[0] : '');
                      setIsRevenueYearClicked(false);
                      setIsKwYearClicked(false);
                      const currentYear = new Date().getFullYear();
                      setRevenueFilter(currentYear);
                      setKwFilter(currentYear);
                    }}
                    placeholderText="mm/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                    maxDate={toDate ? new Date(toDate) : undefined}
                    className="w-full rounded-xl border border-[#a63c71]/30 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#a63c71] cursor-pointer"
                    wrapperClassName="w-full block"
                    popperProps={{ strategy: 'fixed' }}
                  />
                </div>
                <div className="relative w-[140px]">
                  <span className="absolute -top-2 left-3 px-1 bg-white text-[9px] font-bold text-[#a63c71] tracking-wider uppercase scale-90 origin-left z-10">To Date</span>
                  <DatePicker
                    selected={toDate ? new Date(toDate) : null}
                    onChange={(date: Date | null) => {
                      setToDate(date ? date.toISOString().split('T')[0] : '');
                      setIsRevenueYearClicked(false);
                      setIsKwYearClicked(false);
                      const currentYear = new Date().getFullYear();
                      setRevenueFilter(currentYear);
                      setKwFilter(currentYear);
                    }}
                    placeholderText="mm/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                    minDate={fromDate ? new Date(fromDate) : undefined}
                    className="w-full rounded-xl border border-[#a63c71]/30 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#a63c71] cursor-pointer"
                    wrapperClassName="w-full block"
                    popperProps={{ strategy: 'fixed' }}
                  />
                </div>
                <button
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setIsRevenueYearClicked(false);
                    setIsKwYearClicked(false);
                    const currentYear = new Date().getFullYear();
                    setRevenueFilter(currentYear);
                    setKwFilter(currentYear);
                  }}
                  className="flex items-center justify-center px-1 py-1 hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-[#a63c71]"
                  title="Clear Dates"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 my-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#a63c71] text-[#a63c71]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'stock'
                ? 'border-[#a63c71] text-[#a63c71]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Live Stock Sheet
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-3 ${isTelecaller ? 'xl:grid-cols-5' : 'xl:grid-cols-6'} gap-4`}>
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className="bg-white p-4 rounded-3xl border border-gray-200/80 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className={`p-3 rounded-2xl ${card.iconBg} ${card.iconColor} flex-shrink-0 flex items-center justify-center w-12 h-12`}>
                <card.Icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] text-gray-500 tracking-wider truncate">
                  {card.label}
                </span>
                <span className="text-2xl text-gray-900">
                  {card.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        {permissions.readAll && !isTelecaller ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Executive Stacked Bar Chart */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Sales Executive</h3>
                  <span className="bg-[#a63c71]/10 hover:bg-[#a63c71]/20 text-[#a63c71] border border-[#a63c71]/20 px-3 py-1 rounded-lg text-xs font-semibold">
                    {salesWinRateData.reduce((acc, curr) => acc + curr.total, 0)} Total Leads
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-8">Lead status performance by assigned executive</p>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesWinRateData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} barSize={35}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "500" }} dy={10} interval={0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} allowDecimals={false} />
                    <Tooltip content={<CustomSalesTooltip />} cursor={{ fill: '#F3F4F6' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                    <Bar dataKey="won" name="Won" fill="#c1628dff" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="lost" name="Lost" fill="#e698bfff" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="inProgress" name="In Progress" fill="#64163dff" stackId="a" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Revenue - Composed Chart */}
            <div className="min-h-[450px] rounded-3xl border border-gray-200 p-6 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow justify-between h-[456px]">
              <div className="flex flex-col mb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Total Revenue</h3>
                  <YearSelect
                    value={revenueFilter}
                    onChange={(val) => {
                      setRevenueFilter(val);
                      setIsRevenueYearClicked(true);
                    }}
                    options={[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                  />
                </div>
                <h3 className="text-lg text-gray-500 mt-1">
                  ₹{(totalRevenueChart || 0).toLocaleString()}
                </h3>
              </div>

              {revenueLoading ? (
                <div className="h-[280px] flex items-center justify-center flex-grow">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#a63c71] border-r-transparent"></div>
                </div>
              ) : (
                <div className="flex-grow mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={revenueGrowthData}
                      margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                      barCategoryGap="30%"
                    >
                      <defs>
                        <linearGradient id="colorAmtGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f395c7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a63c71" stopOpacity={0.9} />
                        </linearGradient>
                        <marker
                          id="arrow"
                          viewBox="0 0 10 10"
                          refX="6"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8d295b" />
                        </marker>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "500" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        dx={-10}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                                <p className="font-bold text-gray-900">
                                  {payload[0].payload.name}
                                </p>
                                <p className="font-semibold text-[#a63c71]">
                                  ₹{Number(payload[0].payload.amt).toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="amt"
                        fill="url(#colorAmtGrad)"
                        radius={[4, 4, 0, 0]}
                        barSize={35}
                      />
                      <Line
                        type="monotone"
                        dataKey="lineAmt"
                        stroke="#8d295b"
                        strokeWidth={3}
                        dot={false}
                        activeDot={false}
                        markerEnd="url(#arrow)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Lead Statistics - Pie Chart / Graph */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Lead Status Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Performance by status categories</p>
                </div>
                <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200/50 shadow-inner">
                  <button
                    onClick={() => setChartType("pie")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${chartType === "pie"
                      ? "bg-[#a63c71] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                      }`}
                  >
                    Pie
                  </button>
                  <button
                    onClick={() => setChartType("graph")}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${chartType === "graph"
                      ? "bg-[#a63c71] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                      }`}
                  >
                    Graph
                  </button>
                </div>
              </div>

              {chartType === "pie" ? (
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="h-[320px] w-[350px] flex-shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={125}
                          paddingAngle={4}
                          dataKey="value"
                          nameKey="name"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={3} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomLightTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 w-full space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {statusChartData.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-all duration-200 cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }}></div>
                          <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200/60 bg-white" style={{ color: s.fill }}>
                          {s.value} {s.value === 1 ? 'Lead' : 'Leads'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} allowDecimals={false} />
                      <Tooltip content={<CustomLightTooltip />} cursor={{ fill: '#F9FAFB' }} />
                      <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Total KW Growth Chart */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Total KW Growth</h3>
                  <p className="text-lg text-gray-500 mt-1">
                    {kwGrowthData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KW
                  </p>
                </div>
                <YearSelect
                  value={kwFilter}
                  onChange={(val) => {
                    setKwFilter(val);
                    setIsKwYearClicked(true);
                  }}
                  options={[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                />
              </div>
              <div className="mb-8" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kwGrowthData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKwGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a63c71" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a63c71" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "600" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} allowDecimals={true} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-gray-900">{payload[0].payload.date}</p>
                              <p className="font-semibold text-[#a63c71] m-0 mt-0.5">
                                {Number(payload[0].payload.kw).toFixed(2)} KW
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="kw"
                      stroke="#a63c71"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorKwGrad)"
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#a63c71" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#a63c71" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Upcoming Follow-ups */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Upcoming Follow-ups",
                upcomingFollowups,
                upcomingLoading,
                upcomingPage,
                upcomingTotalPages,
                (p) => {
                  if (p >= 1 && p <= upcomingTotalPages) fetchUpcomingFollowups(p);
                },
                "Follow up Date",
              )}
            </div>

            {/* Visit Leads Table */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Scheduled Visits",
                visitLeads,
                visitLeadsLoading,
                visitPage,
                visitTotalPages,
                (p) => {
                  if (p >= 1 && p <= visitTotalPages) setVisitPage(p);
                },
                "Visit Date",
                "visitDate",
                true
              )}
            </div>

            {/* Overdue Follow-ups */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Overdue Follow-ups",
                dueFollowups,
                dueLoading,
                duePage,
                dueTotalPages,
                (p) => {
                  if (p >= 1 && p <= dueTotalPages) fetchDueFollowups(p);
                },
                "Due Date",
              )}
            </div>
          </div>
        ) : isTelecaller ? (
          /* ================= TELECALLING VIEW GRID ================= */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lead Assignment Overview - Stacked Bar Chart */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Lead Assignment Overview</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-8">Lead status performance by assigned executive</p>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesWinRateData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} barSize={35}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "500" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} allowDecimals={false} />
                    <Tooltip content={<CustomSalesTooltip />} cursor={{ fill: '#F3F4F6' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                    <Bar dataKey="inProgress" name="In Progress" fill="#f395c7" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="won" name="Won" fill="#a63c71" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="lost" name="Lost" fill="#bd5087" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Status Overview - Pie Chart Only (no toggles) */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Lead Status Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Performance by status categories</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="h-[320px] w-[350px] flex-shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={125}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={3} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomLightTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 w-full space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {statusChartData.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-all duration-200 cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }}></div>
                        <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200/60 bg-white" style={{ color: s.fill }}>
                        {s.value} {s.value === 1 ? 'Lead' : 'Leads'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Follow-up Analysis</h3>
                  <p className="text-sm text-gray-500 mt-1">Upcoming and completed follow-ups</p>
                </div>
                <YearSelect
                  value={followupFilter}
                  onChange={setFollowupFilter}
                  options={[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                />
              </div>
              <div className="mb-8" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followupChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "500" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} allowDecimals={false} />
                    <Tooltip content={<CustomSalesTooltip />} cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed Follow-ups"
                      stroke="#a63c71"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#a63c71" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#a63c71" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="upcoming"
                      name="Upcoming Follow-ups"
                      stroke="#d1669c"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#d1669c" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#d1669c" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>


            {/* Upcoming Follow-ups */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Upcoming Follow-ups",
                upcomingFollowups,
                upcomingLoading,
                upcomingPage,
                upcomingTotalPages,
                (p) => {
                  if (p >= 1 && p <= upcomingTotalPages) fetchUpcomingFollowups(p);
                },
                "Follow up Date",
              )}
            </div>

            {/* Visit Leads Table */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Scheduled Visits",
                visitLeads,
                visitLeadsLoading,
                visitPage,
                visitTotalPages,
                (p) => {
                  if (p >= 1 && p <= visitTotalPages) setVisitPage(p);
                },
                "Visit Date",
                "visitDate",
                true
              )}
            </div>

            {/* Overdue Follow-ups */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Overdue Follow-ups",
                dueFollowups,
                dueLoading,
                duePage,
                dueTotalPages,
                (p) => {
                  if (p >= 1 && p <= dueTotalPages) fetchDueFollowups(p);
                },
                "Due Date",
              )}
            </div>
          </div>
        ) : (
          /* ================= SALES VIEW GRID ================= */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Total Revenue - Composed Chart */}
            <div className="min-h-[450px] rounded-3xl border border-gray-200 p-6 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow justify-between h-[456px]">
              <div className="flex flex-col mb-2 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Total Revenue</h3>
                  <YearSelect
                    value={revenueFilter}
                    onChange={(val) => {
                      setRevenueFilter(val);
                      setIsRevenueYearClicked(true);
                    }}
                    options={[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                  />
                </div>
                <h3 className="text-lg text-gray-500 mt-1">
                  ₹{(totalRevenueChart || 0).toLocaleString()}
                </h3>
              </div>

              {revenueLoading ? (
                <div className="h-[280px] flex items-center justify-center flex-grow">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#a63c71] border-r-transparent"></div>
                </div>
              ) : (
                <div className="flex-grow mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={revenueGrowthData}
                      margin={{ top: 10, right: 0, left: 0, bottom: 5 }}
                      barCategoryGap="30%"
                    >
                      <defs>
                        <linearGradient id="colorAmtGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f395c7" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#a63c71" stopOpacity={0.9} />
                        </linearGradient>
                        <marker
                          id="arrow"
                          viewBox="0 0 10 10"
                          refX="6"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8d295b" />
                        </marker>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "500" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        dx={-10}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                                <p className="font-bold text-gray-900">
                                  {payload[0].payload.name}
                                </p>
                                <p className="font-semibold text-[#a63c71]">
                                  ₹{Number(payload[0].payload.amt).toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="amt"
                        fill="url(#colorAmtGrad)"
                        radius={[4, 4, 0, 0]}
                        barSize={35}
                      />
                      <Line
                        type="monotone"
                        dataKey="lineAmt"
                        stroke="#8d295b"
                        strokeWidth={3}
                        dot={false}
                        activeDot={false}
                        markerEnd="url(#arrow)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Total KW Growth Chart */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Total KW Growth</h3>
                  <p className="text-lg text-gray-500 mt-1">
                    {kwGrowthData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KW
                  </p>
                </div>
                <YearSelect
                  value={kwFilter}
                  onChange={(val) => {
                    setKwFilter(val);
                    setIsKwYearClicked(true);
                  }}
                  options={[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                />
              </div>
              <div className="mb-8" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kwGrowthData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKwGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a63c71" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a63c71" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "600" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} allowDecimals={true} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-gray-900">{payload[0].payload.date}</p>
                              <p className="font-semibold text-[#a63c71]">
                                {Number(payload[0].payload.kw).toFixed(2)} KW
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="kw"
                      stroke="#a63c71"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorKwGrad)"
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#a63c71" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#a63c71" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Lead Status Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Performance by status categories</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="h-[320px] w-[350px] flex-shrink-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={125}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={3} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomLightTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 w-full space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {statusChartData.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50/80 transition-all duration-200 cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.fill }}></div>
                        <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gray-200/60 bg-white" style={{ color: s.fill }}>
                        {s.value} {s.value === 1 ? 'Lead' : 'Leads'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Follow-up Analysis Chart */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Follow-up Analysis</h3>
                  <p className="text-sm text-gray-500 mt-1">Upcoming and completed follow-ups</p>
                </div>
                <YearSelect
                  value={followupFilter}
                  onChange={setFollowupFilter}
                  options={[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2]}
                />
              </div>
              <div className="mb-8" />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followupChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontWeight: "500" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} allowDecimals={false} />
                    <Tooltip content={<CustomSalesTooltip />} cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Completed Follow-ups"
                      stroke="#a63c71"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#a63c71" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#a63c71" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="upcoming"
                      name="Upcoming Follow-ups"
                      stroke="#d1669c"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#d1669c" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#d1669c" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>


            {/* Upcoming Follow-ups */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Upcoming Follow-ups",
                upcomingFollowups,
                upcomingLoading,
                upcomingPage,
                upcomingTotalPages,
                (p) => {
                  if (p >= 1 && p <= upcomingTotalPages) fetchUpcomingFollowups(p);
                },
                "Follow up Date",
              )}
            </div>

            {/* Visit Leads Table */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Scheduled Visits",
                visitLeads,
                visitLeadsLoading,
                visitPage,
                visitTotalPages,
                (p) => {
                  if (p >= 1 && p <= visitTotalPages) setVisitPage(p);
                },
                "Visit Date",
                "visitDate",
                true
              )}
            </div>

            {/* Overdue Follow-ups */}
            <div className="h-full min-h-[450px]">
              {renderFollowupTable(
                "Overdue Follow-ups",
                dueFollowups,
                dueLoading,
                duePage,
                dueTotalPages,
                (p) => {
                  if (p >= 1 && p <= dueTotalPages) fetchDueFollowups(p);
                },
                "Due Date",
              )}
            </div>
          </div>
        )}
        </>
      ) : (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Live Stock Sheet</h3>
              {/* <p className="text-sm text-gray-500 mt-1">Real-time inventory levels grouped by category</p> */}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search product..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-[240px] rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a63c71] focus:border-[#a63c71]"
                />
                {stockSearch && (
                  <button 
                    onClick={() => setStockSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={fetchStockData}
                disabled={isStockLoading}
                className="flex items-center gap-2 rounded-xl bg-[#a63c71] hover:bg-[#8d295b] text-white font-semibold text-sm px-4 py-2 shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isStockLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {isStockLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[3px] border-[#a63c71]/10"></div>
                <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#a63c71] animate-spin" style={{ animationDuration: '0.8s' }}></div>
                <div className="h-2 w-2 rounded-full bg-[#a63c71] animate-pulse"></div>
              </div>
            </div>
          ) : (
            <>
              {Object.keys(groupedStock).length === 0 ? (
                <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">No stock products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.entries(groupedStock).map(([catKey, products]: [string, any]) => (
                    <div 
                      key={catKey}
                      className="bg-white rounded-2xl border border-[#a63c71]/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col min-h-[180px]"
                    >
                      {/* Category Header */}
                      <div className="bg-[#a63c71] py-2 px-4 text-center">
                        <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider block truncate" title={catKey}>
                          {catKey}
                        </span>
                      </div>
                      
                      {/* Products List */}
                      <div className="flex-1 overflow-y-auto">
                        {products.map((prod: any) => (
                          <div 
                            key={prod._id}
                            className="flex hover:bg-[#a63c71]/10 transition-colors border-b border-gray-100 odd:bg-gray-50/50 even:bg-white"
                          >
                            <div className="flex-1 p-3 text-xs font-bold text-gray-700 uppercase flex items-center">
                              {prod.name}
                            </div>
                            <div 
                              className={`w-16 p-3 text-sm font-bold text-center flex items-center justify-center ${
                                (prod.currentStock || 0) > 0 ? "text-gray-900" : "text-red-500 font-extrabold"
                              }`}
                            >
                              {prod.currentStock || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      </div>

      {isUpdateLeadDialogOpen && (
        <DashboardLeadUpdateDialog
          isOpen={isUpdateLeadDialogOpen}
          onClose={() => {
            setIsUpdateLeadDialogOpen(false);
            setSelectedLeadForUpdate(null);
          }}
          lead={selectedLeadForUpdate}
          onSuccess={() => {
            setIsUpdateLeadDialogOpen(false);
            setSelectedLeadForUpdate(null);
          }}
          fetchApi={fetchDueFollowups}
        />
      )}

      {visitConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Mark Visit as Done?</h3>
            <p className="mb-6 text-sm text-gray-500">Are you sure you have completed this visit? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setVisitConfirmOpen(false);
                  setVisitConfirmLeadId(null);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={markVisitDone}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
