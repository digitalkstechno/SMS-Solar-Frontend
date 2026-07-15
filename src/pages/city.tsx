'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from '@/components/Dialog';
import { toast } from 'react-toastify';
import DataTable, { Column } from '@/components/DataTable';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import DeleteDialog from '@/components/DeleteDialog';
import FormInput from '@/components/ui/Input';
import FormSelect from '@/components/ui/FormSelect';
import { useAppSelector } from '@/redux/hooks';

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

type CityItem = {
  _id: string;
  cityName: string;
  status: string;
  createdAt: string;
};

const validationSchema = Yup.object({
  cityName: Yup.string()
    .required('City name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  status: Yup.string().required('Status is required'),
});

export function CityContent() {
  const [allData, setAllData] = useState<CityItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 600);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<CityItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const currentStaff = useAppSelector((state: any) => state.auth?.currentStaff);
  const [setupPermissions, setSetupPermissions] = useState<any>(null);

  useEffect(() => {
    if (currentStaff) {
      const role: any = currentStaff.role || {};
      const rawPerms = Array.isArray(role.permissions) ? role.permissions[0] : role.permissions || {};
      setSetupPermissions(rawPerms.city || null);
    }
  }, [currentStaff]);

  const isAdmin = currentStaff?.role?.roleName?.toLowerCase() === 'admin';
  const canCreate = isAdmin || !!setupPermissions?.create;
  const canUpdate = isAdmin || !!setupPermissions?.update;
  const canDelete = isAdmin || !!setupPermissions?.delete;

  const formik = useFormik({
    initialValues: {
      _id: '',
      cityName: '',
      status: 'active',
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      await saveCity(values);
    },
    enableReinitialize: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${baseUrl.city}/all`, {
        headers,
        params: {
          search: debouncedSearch || undefined,
          page: currentPage,
          limit: pageSize,
        },
      });
      const data = (res.data?.data as any[]) ?? [];
      const pagination = res.data?.pagination || {};
      
      const items: CityItem[] = data.map((i) => ({
        _id: i._id,
        cityName: i.cityName || '',
        status: i.status || 'active',
        createdAt: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : '-',
      }));
      setAllData(items);
      setTotalRecords(pagination.totalRecords ?? items.length);
      setTotalPages(pagination.totalPages ?? 1);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('Failed to load cities', err);
      setAllData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, currentPage, pageSize]);

  const saveCity = async (values: { _id?: string; cityName: string; status: string }) => {
    setIsSubmitting(true);
    
    const payload = { cityName: values.cityName.trim(), status: values.status };

    try {
      let res;
      if (values._id) {
        res = await axios.put(`${baseUrl.city}/update/${values._id}`, payload, { headers, validateStatus: (s) => s < 500 });
      } else {
        res = await axios.post(`${baseUrl.city}/add`, payload, { headers, validateStatus: (s) => s < 500 });
      }

      if (res.status >= 400) {
        toast.error(res.data?.message || 'Operation failed');
        return;
      }

      toast.success(values._id ? 'City updated successfully' : 'City created successfully');
      await fetchData();
      
      setIsDialogOpen(false);
      formik.resetForm();
    } catch (err: any) {
      console.error('Failed to save city', err);
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (row: CityItem) => {
    setCityToDelete(row);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!cityToDelete) return;

    try {
      const res = await axios.delete(`${baseUrl.city}/delete/${cityToDelete._id}`, { headers, validateStatus: (s) => s < 500 });
      if (res.status >= 400) {
        toast.error(res.data?.message || 'Delete failed');
        return;
      }
      
      toast.success('City deleted successfully');
      await fetchData();
      setShowDeleteDialog(false);
      setCityToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete', err);
      toast.error(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const columns: Column<CityItem>[] = [
    { key: 'cityName', label: 'CITY NAME' },
    { key: 'status', label: 'STATUS', render: (val) => (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${val === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {val === 'active' ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'createdAt', label: 'CREATED DATE' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DataTable
        data={allData}
        columns={columns}
        searchable
        pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        loading={isLoading}
        onEdit={canUpdate ? (row) => {
          formik.setValues({ _id: row._id, cityName: row.cityName, status: row.status });
          setIsDialogOpen(true);
        } : undefined}
        onDelete={canDelete ? handleDeleteClick : undefined}
        actions={canUpdate || canDelete}
        addButton={canCreate ? {
          label: 'Add City',
          onClick: () => {
            formik.resetForm();
            setIsDialogOpen(true);
          }
        } : undefined}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          formik.resetForm();
        }}
        title={formik.values._id ? 'Edit City' : 'Add City'}
        size="md"
        footer={
          <>
            <button
              onClick={() => {
                setIsDialogOpen(false);
                formik.resetForm();
              }}
              className="px-4 py-2 cursor-pointer rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => formik.handleSubmit()}
              className="px-4 py-2 cursor-pointer rounded-lg bg-secondary text-white hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !formik.isValid}
            >
              {isSubmitting ? 'Saving...' : formik.values._id ? 'Update' : 'Add'}
            </button>
          </>
        }
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <FormInput
            label="City Name"
            name="cityName"
            value={formik.values.cityName}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.cityName && formik.errors.cityName ? formik.errors.cityName : undefined}
            required
            placeholder="Enter city name"
          />
          <FormSelect
            label="Status"
            name="status"
            value={formik.values.status}
            onChange={(e) => { formik.setFieldValue('status', e); formik.setFieldTouched('status', true, false); }}
            onBlur={formik.handleBlur}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            placeholder="Select Status"
            error={formik.touched.status && formik.errors.status ? formik.errors.status : undefined}
            required
          />
        </form>
      </Dialog>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete City"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white   cursor-pointer"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-700 py-4">
          Are you sure you want to delete city "{cityToDelete?.cityName}"? This action cannot be undone.
        </p>
      </DeleteDialog>
    </div>
  );
}

export default function CityPage() {
  return <CityContent />;
}
