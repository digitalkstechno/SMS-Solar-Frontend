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
  Line
} from "recharts";
import {
  Users,
  Calendar,
  Award,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  User,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Star,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  PhoneCall,
  Mail as MailIcon,
  MessageSquare,
  PieChartIcon,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { baseUrl, getAuthToken } from "@/config";
import moment from "moment";
import Link from 'next/link';
import { useAppSelector } from '@/redux/hooks';
import DashboardLeadUpdateDialog from "@/components/leads/DashboardLeadUpdateDialog";
import DateRangePicker from "@/components/ui/DateRangePicker";

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
      <div className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100 min-w-[120px] text-center">
        <p className="font-bold text-xs text-gray-800">{name}</p>
        <p className="font-bold text-xs mt-0.5" style={{ color: color }}>
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
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#a63c71] cursor-pointer"
    >
      {options.map((yr) => (
        <option key={yr} value={yr}>
          {yr}
        </option>
      ))}
    </select>
  );
};

const ITEMS_PER_PAGE = 5;

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
  const [totalRevenueChart, setTotalRevenueChart] = useState<number>(0);
  const [revenueGrowthData, setRevenueGrowthData] = useState<any[]>([]);
  const [revenueLoading, setRevenueLoading] = useState<boolean>(false);

  const [isUpdateLeadDialogOpen, setIsUpdateLeadDialogOpen] = useState(false);
  const [selectedLeadForUpdate, setSelectedLeadForUpdate] = useState<any>(null);

  const [permissions, setPermissions] = useState<{ readAll: boolean; readOwn: boolean; viewStaff: boolean }>({ readAll: false, readOwn: false, viewStaff: false });
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.myLeadCountSummary : baseUrl.leadCountSummary;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          from: fromDate || undefined,
          to: toDate || undefined,
        }
      });
      setSummary(res.data.data);
    } catch (err) {
      console.error("Lead summary error:", err);
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
        params: { timeframe: kwTimeframe }
      });
      setKwGrowthData(res.data.data);
    } catch (err) {
      console.error("KW Growth error:", err);
    }
  };

  const fetchSalesWinRate = async () => {
    if (!token) return;
    try {
      const res = await axios.get(baseUrl.salesWinRate, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeframe: salesTimeframe }
      });
      setSalesWinRateData(res.data.data);
    } catch (err) {
      console.error("Sales win rate error:", err);
    }
  };

  useEffect(() => {
    fetchKwGrowth();
  }, [kwTimeframe, token]);

  useEffect(() => {
    fetchSalesWinRate();
  }, [salesTimeframe, token]);

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
      setUpcomingFollowups(data || []);
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
      setDueFollowups(data || []);
      setDueTotalPages(pagination?.totalPages || 1);
      setDuePage(pagination?.currentPage || 1);
    } catch (err) {
      console.error("Due followups error:", err);
      setDueFollowups([]);
    } finally {
      setDueLoading(false);
    }
  };

  const fetchTodayTasks = async () => {
    if (!token) return;
    setTasksLoading(true);
    try {
      const res = await axios.get(baseUrl.todayTasks, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayTasks(res.data?.data || []);
    } catch (err) {
      console.error("Today tasks error:", err);
      setTodayTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const fetchLeadsAndCalculateRevenue = async () => {
    if (!token) return;
    setRevenueLoading(true);
    try {
      const isMyOnly = !permissions.readAll && permissions.readOwn;
      const url = isMyOnly ? baseUrl.myLeads : baseUrl.getAllLeads;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10000 }
      });
      const leads = res.data.data || [];

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = new Date().getFullYear();
      const currentMonthIndex = new Date().getMonth();

      const leadsInYear = leads.filter((lead: any) => {
        const year = new Date(lead.createdAt).getFullYear();
        return year === revenueFilter;
      });

      let monthlyData = months.map((month, index) => {
        const monthLeads = leadsInYear.filter((lead: any) => {
          const m = new Date(lead.createdAt).getMonth();
          return m === index;
        });
        const sum = monthLeads.reduce((acc: number, lead: any) => acc + (lead.paymentAmount || 0), 0);
        return {
          name: month,
          amt: sum,
          lineAmt: sum,
          monthIndex: index
        };
      });

      if (revenueFilter === currentYear) {
        monthlyData = monthlyData.filter(d => d.monthIndex <= currentMonthIndex);
      }

      setRevenueGrowthData(monthlyData);

      const total = monthlyData.reduce((sum, d) => sum + d.amt, 0);
      setTotalRevenueChart(total);
    } catch (err) {
      console.error("Failed to fetch leads and calculate revenue:", err);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndCalculateRevenue();
  }, [token, revenueFilter, permissions]);

  useEffect(() => {
    if (token) {
      fetchLeadSummary();
      fetchUpcomingFollowups(1);
      fetchDueFollowups(1);
      fetchTodayTasks();

      // Only fetch staff stats if they have readAll

      if (permissions.viewStaff) {
        fetchStaffPerformance();
      }
    }
  }, [token, permissions, fromDate, toDate]);

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

  const summaryCards: SummaryCard[] = summary
    ? [
      {
        key: "total",
        label: "Total Leads",
        value: summary.totalLeads,
        Icon: Users,
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-500",
      },
      {
        key: "new",
        label: "Total New Leads",
        value: summary.statusWiseCounts?.find(s => s.statusName?.toLowerCase() === 'new' || s.statusName?.toLowerCase() === 'new lead')?.count || 0,
        Icon: TrendingUp,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
      },
      {
        key: "won",
        label: "Total Won Leads",
        value: summary.statusWiseCounts?.find(s => s.statusName?.toLowerCase() === 'won')?.count || 0,
        Icon: CheckCircle2,
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
      },
      {
        key: "lost",
        label: "Total Lost Leads",
        value: summary.statusWiseCounts?.find(s => s.statusName?.toLowerCase() === 'lost')?.count || 0,
        Icon: XCircle,
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
      },
      {
        key: "followups",
        label: "Follow-ups",
        value: upcomingFollowups.length,
        Icon: Phone,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-500",
      },
      {
        key: "revenue",
        label: "Total Revenue",
        value: `₹${(summary.totalRevenue || 0).toLocaleString()}`,
        Icon: Activity,
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-500",
      }
    ]
    : [];

  const getStatusOrderValue = (name: string): number => {
    const lowerName = name?.toLowerCase();
    if (lowerName === "new lead" || lowerName === "new") return 1;
    if (lowerName === "won") return 2;
    if (lowerName === "lost") return 3;
    return 4;
  };

  const sortedStatusCounts = summary?.statusWiseCounts
    ? [...summary.statusWiseCounts].sort((a, b) => {
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

  const handleQuickFilter = (range: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        break;
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'reset':
        setFromDate("");
        setToDate("");
        return;
    }

    const format = (d: Date) => d.toISOString().split("T")[0];
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
  ) => (
    <div className="rounded-md bg-white border border-gray-200 overflow-hidden h-full flex flex-col transition-all hover:shadow-xl">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${dateHeader === "Follow up Date" ? "bg-blue-50" : "bg-red-50"}`}>
              {dateHeader === "Follow up Date" ? (
                <Clock className="h-5 w-5 text-blue-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${dateHeader === "Follow up Date"
            ? "bg-blue-100 text-blue-700"
            : "bg-red-100 text-red-700"
            }`}>
            {items.length} {items.length === 1 ? 'Lead' : 'Leads'}
          </span>
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
            <p className="text-sm text-gray-500">No follow-ups found</p>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-y-auto flex-1">
            <div className="divide-y divide-gray-50">
              {items.map((lead, index) => (
                <div
                  key={lead._id || lead.id || index}
                  className="p-4 hover:bg-blue-50/20 transition-all cursor-pointer group"
                  onClick={() => router.push(`/leads/list`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {lead.fullName || "Unknown"}
                        </h4>
                        {lead.contact && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.contact}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mb-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusColor(
                            lead.leadStatus?.name || "",
                          )}`}
                        >
                          {lead.leadStatus?.name || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-xs font-semibold text-gray-700">
                        {lead.nextFollowupDate ? moment(lead.nextFollowupDate).format("DD-MM-YYYY") : "-"}
                      </div>
                      <div className="text-[10px] font-medium text-gray-500">
                        {lead.nextFollowupTime || "-"}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadForUpdate(lead);
                          setIsUpdateLeadDialogOpen(true);
                        }}
                        className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
                      >
                        Pending
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/leads/list`);
                        }}
                        className="px-3 py-1 rounded-full bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium transition-colors"
                      >
                        History
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="space-y-8 w-full">

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {greeting}, {user?.fullName?.split(' ')[0] || 'User'}! 👋
            </h2>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Here's what's happening with your projects today.
            </p>
          </div>

          <div className="flex items-center gap-4">
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className="bg-white p-4 rounded-2xl border border-gray-200/80 flex items-center gap-4 transition-all duration-300"
            >
              <div className={`p-3 rounded-2xl ${card.iconBg} ${card.iconColor} flex-shrink-0 flex items-center justify-center w-12 h-12`}>
                <card.Icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] sm:text-xs font-semibold text-gray-400 tracking-wide truncate">
                  {card.label}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 truncate">
                  {card.value}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Lead Statistics - Pie Chart / Graph */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Lead Status Overview</h3>
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

          {/* Total Revenue - Composed Chart */}
          <div className="min-h-[450px] rounded-3xl border border-gray-200 p-6 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow justify-between h-[456px]">
            <div className="flex flex-col mb-2 shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-xl font-semibold text-gray-900">Total Revenue</p>
                <YearSelect
                  value={revenueFilter}
                  onChange={setRevenueFilter}
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      padding={{ left: 15, right: 15 }}
                      tick={{ fontSize: 12, fill: "#4b5563", fontWeight: "600", dy: 8 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, (max: number) => max * 1.05]}
                      tickFormatter={(val) => {
                        if (val === 0) return "0";
                        if (val >= 100000) {
                          const lakhs = val / 100000;
                          return lakhs % 1 === 0 ? `${lakhs}L` : `${lakhs.toFixed(1)}L`;
                        }
                        if (val >= 1000) {
                          const k = Math.round(val / 1000);
                          return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
                        }
                        return String(val);
                      }}
                      width={50}
                      tick={{ fontSize: 11, fill: "#4b5563", dx: -8 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-xl text-xs">
                              <p className="font-bold text-gray-900">
                                {payload[0].payload.name}
                              </p>
                              <p className="font-semibold" style={{ color: "#a63c71" }}>
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
        </div>

        {/* New Charts Section */}
        <div className="grid grid-cols-1 gap-8">
          {/* KW Growth Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Total KW Growth</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {kwGrowthData.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KW
                </div>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 mt-4 sm:mt-0">
                {['month', 'week', 'year'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setKwTimeframe(tf)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${kwTimeframe === tf ? 'bg-[#10b981] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    {tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kwGrowthData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <Tooltip content={<CustomDarkTooltip />} cursor={{ fill: '#F3F4F6' }} />
                  <Bar dataKey="kw" name="KW Growth" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Executive Win Rate */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900">Sales Executive — Win Rate</h3>
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                  {salesWinRateData.reduce((acc, curr) => acc + curr.total, 0)} Total Leads
                </div>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 mt-4 sm:mt-0">
                {['all', 'week', 'month', 'year'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setSalesTimeframe(tf)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${salesTimeframe === tf ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    {tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesWinRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                  <Tooltip content={<CustomDarkTooltip />} cursor={{ fill: '#F3F4F6' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="won" name="Won" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="lost" name="Lost" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="inProgress" name="In Progress" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Follow-ups and Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            fetchUpcomingFollowups(upcomingPage);
            fetchDueFollowups(duePage);
          }}
        />
      )}
    </div>
  );
}
