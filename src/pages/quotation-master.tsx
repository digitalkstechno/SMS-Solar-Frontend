'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { baseUrl, getAuthToken } from '@/config';
import DataTable from '@/components/DataTable';
import { toast } from 'react-toastify';
import { Plus, Loader2 } from 'lucide-react';
import DeleteDialog from '@/components/DeleteDialog';

const CATEGORIES = [
  { key: 'module', label: 'SOLAR MODULE PRODUCT' },
  { key: 'inverter', label: 'INVERTER PRODUCT' },
  { key: 'structure', label: 'STRUCTURE PRODUCT' },
  { key: 'dcdb', label: 'DC PROTECTION' },
  { key: 'acdb', label: 'AC PROTECTION' },
  { key: 'cables', label: 'SOLAR CABLE PRODUCT' },
  { key: 'roof', label: 'ROOF TYPE' }
];

export default function QuotationMasterPage() {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(CATEGORIES[0].key);
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchOptions = async () => {
    try {
      const res = await axios.get(`${baseUrl.getBaseUrl}quotation-options`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.data.success) {
        setOptions(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch quotation options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newValue.trim();
    if (!val) return;
    
    setAdding(true);
    try {
      const activeCat = CATEGORIES.find(c => c.key === activeTab);
      const res = await axios.post(
        `${baseUrl.getBaseUrl}quotation-options`,
        { key: activeTab, label: val, value: val },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      if (res.data.success) {
        toast.success('Option added successfully');
        setNewValue('');
        fetchOptions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add option');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteClick = (row: any) => {
    setOptionToDelete(row);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!optionToDelete) return;
    try {
      const res = await axios.delete(`${baseUrl.getBaseUrl}quotation-options/${optionToDelete._id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.data.success) {
        toast.success('Option deleted successfully');
        fetchOptions();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete option');
    } finally {
      setShowDeleteDialog(false);
      setOptionToDelete(null);
    }
  };

  const activeOptions = options.filter(o => o.key === activeTab);
  const activeLabel = CATEGORIES.find(c => c.key === activeTab)?.label;

  const columns = [
    { key: 'label', label: 'VALUE' }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product catalogue for quotations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
       
        <div className="md:col-span-1 border border-gray-200 rounded-md bg-white overflow-hidden shadow-sm h-fit">
          <div className="flex flex-col">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-200 last:border-b-0 outline-none ${
                  activeTab === cat.key ? 'bg-gray-100 text-secondary border-l-4 border-l-secondary' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

      
        <div className="md:col-span-3">
          <div className="border border-gray-200 rounded-md bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{activeLabel}</h2>
            
            <form onSubmit={handleAdd} className="flex items-center gap-2 mb-6">
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Add new ${activeLabel?.toLowerCase()}...`}
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
              />
              <button
                type="submit"
                disabled={adding || !newValue.trim()}
                className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add Option</>}
              </button>
            </form>

            <div className="max-h-[500px] overflow-y-auto rounded-md border border-gray-200">
              <DataTable
                data={activeOptions}
                columns={columns}
                loading={loading}
                onDelete={handleDeleteClick}
                pagination={false}
                searchable={false}
              />
            </div>
          </div>
        </div>
      </div>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setOptionToDelete(null);
        }}
        title="Delete Option"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false);
                setOptionToDelete(null);
              }}
              className="px-4 cursor-pointer py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 cursor-pointer py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="py-4 text-slate-700">
          <p>
            Are you sure you want to delete this option?
            <br />
            <strong>{optionToDelete?.label}</strong>
          </p>
        </div>
      </DeleteDialog>
    </div>
  );
}