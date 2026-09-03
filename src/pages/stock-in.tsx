'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from '@/components/Dialog';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import DeleteDialog from '@/components/DeleteDialog';
import FormInput from '@/components/ui/Input';
import FormSelect from '@/components/ui/FormSelect';
import { PackageOpen, Download } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCategories } from '@/redux/slices/categorySlice';
import { fetchProducts } from '@/redux/slices/productSlice';
import { useRef } from 'react';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

type CategoryType = { _id: string; name: string };
type ProductType = { _id: string; name: string; categoryId: any; currentStock: number };
type TransactionType = {
  _id: string;
  categoryId: string;
  categoryName: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  clientName?: string;
  note: string;
  unit?: string;
  createdAt: string;
};

// Validation schema for Stock In
const validationSchema = Yup.object({
  categoryId: Yup.string().required('Category is required'),
  productId: Yup.string().required('Product is required'),
  quantity: Yup.number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .min(1, 'Quantity must be greater than 0'),
  note: Yup.string()
    .required('Note is required')
    .max(200, 'Note must be at most 200 characters'),
});

export function StockInContent() {
  const [allData, setAllData] = useState<TransactionType[]>([]);
  const dispatch = useAppDispatch();
  const { data: categories, status: catStatus } = useAppSelector((state) => state.category);
  const { data: products, status: prodStatus } = useAppSelector((state) => state.product);

  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 600);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const currentStaff = useAppSelector((state) => state.auth.currentStaff);
  const role: any = currentStaff?.role || {};
  const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
  const stockPerms = rawPerms.stock || {};
  const isAdmin = role.roleName?.toLowerCase() === 'admin';
  const canCreate = isAdmin || !!stockPerms.create;
  const canUpdate = isAdmin || !!stockPerms.update;
  const canDeleteStock = isAdmin || !!stockPerms.delete;

  const formik = useFormik({
    initialValues: { _id: '', categoryId: '', productId: '', quantity: '' as any, note: '', unit: '' },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => { await saveTransaction(values); },
    enableReinitialize: true,
  });

  const hasDispatchedRef = useRef(false);

  useEffect(() => {
    if (!hasDispatchedRef.current) {
      hasDispatchedRef.current = true;
      dispatch(fetchCategories());
      dispatch(fetchProducts());
    }
  }, [dispatch]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let url = `${baseUrl.stock}?type=IN`;
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const from = new Date(Number(year), Number(month) - 1, 1).toISOString();
        const to = new Date(Number(year), Number(month), 0, 23, 59, 59, 999).toISOString();
        url += `&from=${from}&to=${to}`;
      }
      const res = await axios.get(url, { headers });
      const data = (res.data?.data as any[]) ?? [];
      const items: TransactionType[] = data.map((i) => ({
        _id: i._id,
        categoryId: i.categoryId?._id || '',
        categoryName: i.categoryId?.name || '-',
        productId: i.productId?._id || '',
        productName: i.productId?.name || '-',
        type: i.type,
        quantity: i.quantity,
        clientName: i.issuedTo || (i.leadId ? (i.leadId.fullName || i.leadId.leadrefrance || '-') : '-'),
        note: i.note || '-',
        unit: i.unit || '',
        createdAt: i.createdAt ? new Date(i.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
      }));

      let filteredItems = items;
      if (debouncedSearch) {
        filteredItems = items.filter(item => 
          item.productName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          item.categoryName.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      setAllData(filteredItems);
      setTotalRecords(filteredItems.length);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('Failed to load stock-in records', err);
      setAllData([]);
    }
   finally {
      setIsLoading(false);
    }};


  useEffect(() => {
    fetchData();
  }, [debouncedSearch, currentPage, pageSize, selectedMonth]);

  const saveTransaction = async (values: any) => {
    setIsSubmitting(true);
    const payload = { 
      categoryId: values.categoryId, 
      productId: values.productId, 
      type: 'IN', 
      quantity: Number(values.quantity), 
      note: values.note,
      unit: values.unit
    };

    try {
      if (values._id) {
        await axios.patch(`${baseUrl.stock}/${values._id}`, payload, { headers });
      } else {
        await axios.post(baseUrl.stock, payload, { headers });
      }
      await fetchData();
      await dispatch(fetchProducts()); // refresh product currentStock
      setIsDialogOpen(false);
      formik.resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (row: TransactionType) => {
    setTransactionToDelete(row);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await axios.delete(`${baseUrl.stock}/${transactionToDelete._id}`, { headers });
      await fetchData();
      await dispatch(fetchProducts());
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // UI Derived state
  const availableProducts = useMemo(() => {
    if (!formik.values.categoryId) return [];
    return products.filter((p) => {
      const cId = p.categoryId?._id || p.categoryId;
      return cId === formik.values.categoryId;
    });
  }, [products, formik.values.categoryId]);

  const selectedProductCurrentStock = useMemo(() => {
    if (!formik.values.productId) return 0;
    const prod = products.find(p => p._id === formik.values.productId);
    return prod?.currentStock || 0;
  }, [products, formik.values.productId]);

  const exportToExcel = async () => {
    if (allData.length === 0) {
      toast.warning('No data to export');
      return;
    }

    try {
      const params: Record<string, string> = { type: 'IN' };
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        params.from = new Date(Number(year), Number(month) - 1, 1).toISOString();
        params.to = new Date(Number(year), Number(month), 0, 23, 59, 59, 999).toISOString();
      }
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await axios.get(`${baseUrl.stock}/export`, {
        headers,
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Stock_In_${selectedMonth || 'All'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export stock-in records', err);
      toast.error('Failed to export stock-in records');
    }
  };

  const columns: Column<TransactionType>[] = [
    { key: 'categoryName', label: 'CATEGORY' },
    { key: 'productName', label: 'PRODUCT NAME' },
    { key: 'quantity', label: 'QUANTITY' },
    { key: 'unit', label: 'UNIT' },
    { key: 'note', label: 'NOTE' },
    { key: 'createdAt', label: 'DATE' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Stock In</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Filter by Month:</label>
          <div className="relative">
            <DatePicker
              selected={selectedMonth ? new Date(selectedMonth) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  setSelectedMonth(`${year}-${month}`);
                } else {
                  setSelectedMonth('');
                }
              }}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              placeholderText="Select Month"
              className="pl-3 pr-8 h-[38px] rounded-[4px] border border-gray-300 bg-white text-sm font-medium text-gray-800 !outline-none focus:!border-[#A63C71] focus:!ring-1 focus:!ring-[#A63C71] transition-all cursor-pointer w-[150px]"
              isClearable
            />
          </div>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 h-[38px] px-4 rounded-lg bg-[#A63C71] text-white hover:bg-[#8f325f] transition-colors font-medium text-sm shadow-sm"
          >
            <Download size={16} />
            Export to Excel
          </button>
        </div>
      </div>

      <DataTable
        data={allData}
        columns={columns}
        searchable
        pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalRecords / pageSize)}
        totalRecords={totalRecords}
        pageSize={pageSize}
        loading={isLoading}
        onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
        onEdit={canUpdate ? (row) => {
          const product = availableProducts.find(p => p._id === row.productId);
          formik.setValues({
            _id: row._id,
            categoryId: row.categoryId,
            productId: row.productId,
            quantity: row.quantity,
            note: row.note === '-' ? '' : row.note,
            unit: row.unit || product?.unit || '', 
          });
          setIsDialogOpen(true);
        } : undefined}
        canDelete={(row) => {
          if (!canDeleteStock) return false;
          const product = products.find(p => p._id === row.productId);
          if (!product) return true;
          // If quantity is greater than current stock, it means some of it was consumed
          return row.quantity <= (product.currentStock ?? 0);
        }}
        onDelete={handleDeleteClick}
        addButton={canCreate ? {
          label: 'Add Stock In',
          onClick: () => { formik.resetForm(); setIsDialogOpen(true); },
        } : undefined}
      />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setTransactionToDelete(null); }}
        title="Delete Stock In"
        size="md"
        footer={
          <>
            <button
              onClick={() => { setShowDeleteDialog(false); setTransactionToDelete(null); }}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="py-4 text-slate-700">Are you sure you want to delete this transaction?</p>
      </DeleteDialog>

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); formik.resetForm(); }}
        title="ADD STOCK IN"
        footer={
          <>
            <button
              type="button"
              onClick={() => { setIsDialogOpen(false); formik.resetForm(); }}
              className="px-6 py-2 rounded-lg border border-slate-300 bg-white text-blue-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="stock-in-form"
              className="px-6 py-2 rounded-lg bg-secondary hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
              disabled={isSubmitting || !formik.isValid}
            >
              Add Stock In
            </button>
          </>
        }
      >
        <form id="stock-in-form" onSubmit={formik.handleSubmit} className="space-y-4 pt-6">
          <FormSelect
            label="Category"
            required
            name="categoryId"
            value={formik.values.categoryId}
            onChange={(e) => { 
              formik.setValues({ ...formik.values, categoryId: e, productId: '' });
            }}
            onBlur={() => formik.setFieldTouched('categoryId', true)}
            options={categories.map((cat) => ({ value: cat._id, label: cat.name }))}
            placeholder="-- Select Category --"
            error={formik.touched.categoryId && formik.errors.categoryId ? formik.errors.categoryId : undefined}
          />

          <FormSelect
            label="Product"
            required
            name="productId"
            value={formik.values.productId}
            onChange={(e) => { 
              formik.setFieldValue('productId', e);
              const prod = availableProducts.find(p => p._id === e);
              if (prod && prod.unit) {
                formik.setFieldValue('unit', prod.unit);
              }
            }}
            onBlur={() => formik.setFieldTouched('productId', true)}
            options={availableProducts.map((prod) => ({ value: prod._id, label: prod.name }))}
            placeholder="-- Select Product --"
            error={formik.touched.productId && formik.errors.productId ? formik.errors.productId : undefined}
          />

          {formik.values.productId && (
            <div className="text-sm font-semibold text-[#A63C71] bg-[#A63C71]/10 p-2 rounded-md inline-block mb-2">
              Current Stock: {selectedProductCurrentStock}
            </div>
          )}

          <FormInput
            label="Quantity"
            required
            name="quantity"
            type="number"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.quantity && formik.errors.quantity ? String(formik.errors.quantity) : undefined}
            placeholder="Enter quantity to add"
          />

          <FormSelect
            label="Unit"
            name="unit"
            value={formik.values.unit}
            onChange={(e) => { formik.setFieldValue('unit', e); }}
            onBlur={() => formik.setFieldTouched('unit', true)}
            options={[
              { value: 'Qty', label: 'Qty' },
              { value: 'Meter (m)', label: 'Meter (m)' },
              { value: 'Kg', label: 'Kg' },
              { value: 'Liter', label: 'Liter' },
              { value: 'Pieces', label: 'Pieces' },
              { value: 'Box', label: 'Box' }
            ]}
            placeholder="-- Default (Qty) --"
          />

          <FormInput
            label="Note"
            required
            name="note"
            as="textarea"
            value={formik.values.note}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.note && formik.errors.note ? String(formik.errors.note) : undefined}
            placeholder="Enter note (e.g. Supplier name, Invoice no.)"
            rows={3}
          />
        </form>
      </Dialog>
    </div>
  );
}

export default function StockInPage() {
  return <StockInContent />;
}
