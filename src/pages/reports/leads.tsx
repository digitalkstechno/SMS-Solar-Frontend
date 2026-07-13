import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { FileText, Download, Filter, Users } from 'lucide-react';
import FormSelect from '@/components/ui/FormSelect';
import DateRangePicker from '@/components/ui/DateRangePicker';

type LeadType = {
  _id: string;
  fullName: string;
  contact: string;
  kwRequirement: string;
  leadStatus: string;
  assignedTo: string;
  createdAt: string;
};

export default function LeadReportPage() {
  const [data, setData] = useState<LeadType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusId, setStatusId] = useState('');
  const [staffId, setStaffId] = useState('');
  
  const [statuses, setStatuses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [statusRes, staffRes] = await Promise.all([
          axios.get(`${baseUrl.leadStatuses}?limit=100`, { headers }),
          axios.get(`${baseUrl.getAllUsers}?limit=100`, { headers })
        ]);
        setStatuses(statusRes.data?.data || []);
        setStaff(staffRes.data?.data || []);
      } catch (err) {}
    };
    if (token) fetchOptions();
  }, [token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 1000 };
      
      const res = await axios.get(baseUrl.getAllLeads, { headers, params });
      let rawData = (res.data?.data || res.data?.leads) ?? [];
      
      rawData.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      let filteredItems = rawData;

      if (fromDate || toDate) {
        const start = fromDate ? new Date(fromDate).getTime() : 0;
        const end = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;
        filteredItems = filteredItems.filter((i: any) => {
          if (!i.createdAt) return false;
          const time = new Date(i.createdAt).getTime();
          return time >= start && time <= end;
        });
      }
      
      if (statusId) {
        filteredItems = filteredItems.filter((i: any) => i.leadStatus?._id === statusId);
      }
      
      if (staffId) {
        filteredItems = filteredItems.filter((i: any) => i.assignedTo?._id === staffId);
      }

      const items: LeadType[] = filteredItems.map((i: any) => ({
        _id: i._id,
        fullName: i.fullName || '-',
        contact: i.contact || i.phone || '-',
        kwRequirement: i.kwRequirement || '-',
        leadStatus: i.leadStatus?.name || '-',
        assignedTo: i.assignedTo?.fullName || '-',
        createdAt: i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN') : '-',
      }));
      
      setData(items);
    } catch (err) {
      console.error('Failed to load lead report', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate, statusId, staffId]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const params: any = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (statusId) params.status = statusId;
      if (staffId) params.staff = staffId;

      const res = await axios.get(baseUrl.exportLeads, {
        headers,
        params,
        responseType: 'blob',
      });

      if (res.data.type === 'application/json') {
        const text = await res.data.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Error generating export');
      }

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lead_report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Export failed: ' + (err.message || 'Please try again.'));
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<LeadType>[] = [
    { label: 'Full Name', key: 'fullName' },
    { label: 'Contact', key: 'contact' },
    { label: 'KW Requirement', key: 'kwRequirement' },
    { label: 'Status', key: 'leadStatus' },
    { label: 'Date', key: 'createdAt' },
    { label: 'Assigned To', key: 'assignedTo' },
  ];

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusId('');
    setStaffId('');
    setIsFilterOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#A63C71]/10 p-3 rounded-xl">
            <Users className="h-6 w-6 text-[#A63C71]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lead Report</h1>
            <p className="text-sm text-gray-500">View and export lead details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isFilterOpen 
                ? 'bg-gray-100 text-gray-800 border-gray-300' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className="flex items-center gap-2 bg-[#A63C71] text-white px-4 py-2 rounded-lg hover:bg-[#8f325f] transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isFilterOpen ? 'max-h-40 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'
        }`}
      >
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-end gap-4">
            <div className="flex-[2]">
              <DateRangePicker
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onReset={() => {
                  setFromDate('');
                  setToDate('');
                }}
              />
            </div>
            <div className="flex-1">
              <FormSelect
                label="Lead Status"
                name="statusId"
                value={statusId}
                onChange={(e) => setStatusId(e)}
                options={statuses.map((s) => ({ value: s._id, label: s.name }))}
                placeholder="All Statuses"
              />
            </div>
            <div className="flex-1">
              <FormSelect
                label="Assigned To"
                name="staffId"
                value={staffId}
                onChange={(e) => setStaffId(e)}
                options={staff.map((s) => ({ value: s._id, label: s.fullName }))}
                placeholder="All Staff"
              />
            </div>
            <div className="flex-none mb-1">
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 h-[42px] rounded-lg border border-slate-300 bg-white text-gray-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(item) => item._id}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
