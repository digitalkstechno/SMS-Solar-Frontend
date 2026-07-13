import { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import { FileText, Download, Filter } from 'lucide-react';
import Dialog from '@/components/Dialog';
import FormInput from '@/components/ui/Input';
import FormSelect from '@/components/ui/FormSelect';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCategories } from '@/redux/slices/categorySlice';
import { fetchProducts } from '@/redux/slices/productSlice';

type TransactionType = {
  _id: string;
  categoryName: string;
  productName: string;
  quantity: number;
  currentStock: number;
  note: string;
  createdAt: string;
};

export default function StockInReportPage() {
  const dispatch = useAppDispatch();
  const { data: categories } = useAppSelector((state) => state.category);
  const { data: products } = useAppSelector((state) => state.product);

  const [data, setData] = useState<TransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts());
  }, [dispatch]);

  // Derived filtered products based on category
  const availableProducts = categoryId
    ? products.filter(p => p.categoryId === categoryId || (p.categoryId as any)?._id === categoryId)
    : products;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: any = { type: 'IN' };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (categoryId) params.categoryId = categoryId;
      if (productId) params.productId = productId;

      const res = await axios.get(baseUrl.stock, { headers, params });
      let rawData = (res.data?.data as any[]) ?? [];
      
      rawData.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      const items: TransactionType[] = rawData.map((i) => ({
        _id: i._id,
        categoryName: i.categoryId?.name || '-',
        productName: i.productId?.name || '-',
        quantity: i.quantity || 0,
        currentStock: i.productId?.currentStock || 0,
        note: i.note || '-',
        createdAt: i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN') : '-',
      }));
      
      // Client-side filtering if backend doesn't fully support categoryId/productId
      let filteredItems = items;
      if (categoryId) {
        const cat = categories.find(c => c._id === categoryId);
        if (cat) filteredItems = filteredItems.filter(i => i.categoryName === cat.name);
      }
      if (productId) {
        const prod = products.find(p => p._id === productId);
        if (prod) filteredItems = filteredItems.filter(i => i.productName === prod.name);
      }
      
      setData(filteredItems);
    } catch (err) {
      console.error('Failed to load stock-in report', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate, categoryId, productId]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const params: any = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (categoryId) params.categoryId = categoryId;
      if (productId) params.productId = productId;

      const res = await axios.get(baseUrl.exportStockInReport, {
        headers,
        params,
        responseType: 'blob', // Expecting binary data
      });

      // Check if the response is actually JSON (an error message from the backend)
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
      link.setAttribute('download', `stock_in_report_${Date.now()}.xlsx`);
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

  const columns: Column<TransactionType>[] = [
    { label: 'Category', key: 'categoryName' },
    { label: 'Product Name', key: 'productName' },
    { label: 'Added Quantity', key: 'quantity' },
    { label: 'Current Stock', key: 'currentStock' },
    { label: 'Date', key: 'createdAt' },
    { label: 'Note', key: 'note' },
  ];

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setCategoryId('');
    setProductId('');
    setIsFilterOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-[#A63C71]/10 p-3 rounded-xl">
            <FileText className="h-6 w-6 text-[#A63C71]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock In Report</h1>
            <p className="text-sm text-gray-500">View and export stock in transactions</p>
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
                label="Category"
                name="categoryId"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e);
                  setProductId('');
                }}
                options={categories.map((cat) => ({ value: cat._id, label: cat.name }))}
                placeholder="All Categories"
              />
            </div>
            <div className="flex-1">
              <FormSelect
                label="Product"
                name="productId"
                value={productId}
                onChange={(e) => setProductId(e)}
                options={availableProducts.map((prod) => ({ value: prod._id, label: prod.name }))}
                placeholder="All Products"
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
