import { useState, useEffect } from 'react';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { ApiLead } from './types';
import FormInput from '../ui/Input';
import { Trash2, X, Download } from 'lucide-react';
import Select from 'react-select';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: ApiLead;
  onRefresh: () => void;
  editIndex?: number | null;
}

const DEFAULT_ROWS = [
  { title: 'Size kW', values: [''] },
  { title: 'Module W', values: [''] },
  { title: 'Solar module product', values: [''] },
  { title: 'Inverter product', values: [''] },
  { title: 'Structure product', values: [''] },
  { title: 'DC protection', values: [''] },
  { title: 'AC protection', values: [''] },
  { title: 'Solar cable product', values: [''] },
  { title: 'Roof type', values: [''] },
  { title: 'Gross ₹', values: [''] },
  { title: 'Subsidy ₹', values: [''] },
  { title: 'Net Payable ₹', values: [''] },
  { title: 'Electricity ₹/unit', values: [''] },
  { title: 'Loan ₹', values: [''] },
];

const DROPDOWN_FIELDS = [
  'solar module product',
  'inverter product',
  'structure product',
  'dc protection',
  'ac protection',
  'solar cable product',
  'roof type'
];

export default function LeadQuotationDialog({ isOpen, onClose, lead, onRefresh, editIndex }: Props) {
  const getLocalDatetimeString = (dateObj: Date = new Date()) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hours = pad(dateObj.getHours());
    const minutes = pad(dateObj.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [date, setDate] = useState(getLocalDatetimeString());
  const [solarModule, setSolarModule] = useState('');
  const [inverter, setInverter] = useState('');
  const [options, setOptions] = useState<string[]>(['OPTION 1']);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiOptions, setApiOptions] = useState<Record<string, { label: string, value: string }[]>>({});

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(`${baseUrl.getBaseUrl}quotation-options`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        if (res.data?.success) {
          const grouped: Record<string, { label: string, value: string }[]> = {};
          
          // Map backend keys to dropdown row keys
          const keyMap: Record<string, string> = {
            'module': 'solar module product',
            'inverter': 'inverter product',
            'structure': 'structure product',
            'dcdb': 'dc protection',
            'acdb': 'ac protection',
            'cables': 'solar cable product',
            'roof': 'roof type'
          };

          res.data.data.forEach((opt: any) => {
            const rowKey = keyMap[opt.key] || opt.key;
            if (!grouped[rowKey]) grouped[rowKey] = [];
            grouped[rowKey].push({ label: opt.label, value: opt.value });
          });
          setApiOptions(grouped);
        }
      } catch (e) {
        console.error('Failed to fetch quotation options', e);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (isOpen && lead?._id) {
      setErrors({});
      let qData = null;
      if (editIndex !== null && editIndex !== undefined && lead.quotations && lead.quotations[editIndex]) {
        qData = lead.quotations[editIndex];
      }

      if (qData) {
        setDate(qData.date ? getLocalDatetimeString(new Date(qData.date)) : getLocalDatetimeString());
        setSolarModule(qData.solarModule || '');
        setInverter(qData.inverter || '');
        if (qData.options && qData.options.length > 0) {
          setOptions(qData.options);
        } else {
          setOptions(['OPTION 1']);
        }
        if (qData.rows && qData.rows.length > 0) {
          setRows(qData.rows);
        } else {
          setRows(DEFAULT_ROWS.map(r => ({ ...r, values: Array(qData.options?.length || 1).fill('') })));
        }
      } else {
        // Reset for new quotation
        setDate(getLocalDatetimeString());
        setSolarModule('');
        setInverter('');
        setOptions(['OPTION 1']);
        setRows([...DEFAULT_ROWS]);
      }
    }
  }, [isOpen, lead, editIndex]);

  const handleAddOption = () => {
    if (options.length >= 5) {
      toast.warning('Max 5 options allowed');
      return;
    }
    const newOptions = [...options, `OPTION ${options.length + 1}`];
    setOptions(newOptions);
    setRows(rows.map(row => ({ ...row, values: [...row.values, ''] })));
  };

  const handleAddRow = () => {
    setRows([...rows, { title: '', values: Array(options.length).fill('') }]);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!solarModule.trim()) {
      newErrors.solarModule = 'Solar Module is required';
    }
    if (!inverter.trim()) {
      newErrors.inverter = 'Inverter is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const oldQuotation = editIndex !== null && editIndex !== undefined && lead.quotations ? lead.quotations[editIndex] : null;
      const newQuotation = {
        date,
        solarModule,
        inverter,
        options,
        rows,
        createdAt: (oldQuotation as any)?.createdAt || new Date().toISOString()
      };

      const currentQuotations = Array.isArray(lead.quotations) ? [...lead.quotations] : [];
      if (editIndex !== null && editIndex !== undefined) {
        currentQuotations[editIndex] = newQuotation;
      } else {
        currentQuotations.push(newQuotation);
      }
      const payload = {
        quotations: currentQuotations
      };
      await axios.put(
        `${baseUrl.updateLead}/${lead._id}`,
        payload,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      toast.success(editIndex !== null && editIndex !== undefined ? 'Quotation updated successfully' : 'Quotation saved successfully');
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const handleRowTitleChange = (index: number, val: string) => {
    const newRows = [...rows];
    newRows[index].title = val;
    setRows(newRows);
  };

  const handleRowValueChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...rows];
    newRows[rowIndex].values[colIndex] = val;

    const grossIdx = newRows.findIndex(r => r.title.trim().toUpperCase() === 'GROSS ₹');
    const subsidyIdx = newRows.findIndex(r => r.title.trim().toUpperCase() === 'SUBSIDY ₹');
    const netIdx = newRows.findIndex(r => r.title.trim().toUpperCase() === 'NET PAYABLE ₹');

    if (grossIdx !== -1 && subsidyIdx !== -1 && netIdx !== -1) {
      const grossVal = parseFloat(newRows[grossIdx].values[colIndex]) || 0;
      let subsidyVal = parseFloat(newRows[subsidyIdx].values[colIndex]) || 0;
      
      if (subsidyVal > grossVal) {
        subsidyVal = grossVal;
        if (rowIndex === subsidyIdx) {
          toast.warning('Subsidy cannot be greater than Gross');
          newRows[subsidyIdx].values[colIndex] = subsidyVal.toString();
        }
      }

      const netVal = grossVal - subsidyVal;
      newRows[netIdx].values[colIndex] = Math.max(0, netVal).toString();
    }

    // Keep old behavior just in case they revert row titles
    const customerPayableIdx = newRows.findIndex(r => r.title.trim().toUpperCase() === 'CUSTOMER PAYABLE AMOUNT');
    const oldSubsidyIdx = newRows.findIndex(r => r.title.trim().toUpperCase() === 'SUBSIDY');
    const effectivePriceIdx = newRows.findIndex(r => r.title.trim().toUpperCase() === 'EFFECTIVE PRICE');

    if (effectivePriceIdx !== -1 && customerPayableIdx !== -1 && oldSubsidyIdx !== -1) {
      const payableVal = parseFloat(newRows[customerPayableIdx].values[colIndex]) || 0;
      const subVal = parseFloat(newRows[oldSubsidyIdx].values[colIndex]) || 0;
      newRows[effectivePriceIdx].values[colIndex] = (payableVal - subVal).toString();
    }

    setRows(newRows);
  };

  const handleCreateOption = async (inputValue: string, rowKey: string, rIdx: number, cIdx: number) => {
    handleRowValueChange(rIdx, cIdx, inputValue);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';
      const res = await axios.post(`${apiUrl}quotation-options`, {
        key: rowKey,
        label: inputValue,
        value: inputValue
      }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      
      if (res.data?.success) {
        setApiOptions(prev => {
          const current = prev[rowKey] || [];
          return { ...prev, [rowKey]: [...current, { label: inputValue, value: inputValue }] };
        });
      }
    } catch (e) {
      console.error('Failed to save option', e);
    }
  };

  const handleOptionNameChange = (index: number, val: string) => {
    const newOptions = [...options];
    newOptions[index] = val;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      toast.warning('At least one option is required');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    const newRows = rows.map(row => ({
      ...row,
      values: row.values.filter((_, i) => i !== index)
    }));
    setRows(newRows);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.warning('At least one row is required');
      return;
    }
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editIndex !== null && editIndex !== undefined ? 'Edit Quotation' : 'Add Quotation'}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                const toastId = toast.loading('Downloading PDF...');
                const qData = { date, solarModule, inverter, options, rows };
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1/';
                
                const response = await axios.post(`${apiUrl}quotation/generate`, {
                  quotation: qData,
                  lead: lead
                }, {
                  responseType: 'blob',
                  headers: { Authorization: `Bearer ${getAuthToken()}` }
                });
                
                const blobUrl = window.URL.createObjectURL(response.data);
                const link = document.createElement('a');
                link.href = blobUrl;
                const clientName = (lead?.fullName || lead?.leadrefranceName || lead?.leadrefrance || 'Client').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
                const d = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                const dateStr = `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
                link.download = `Quotation_${clientName}_${dateStr}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                
                toast.update(toastId, { render: 'PDF Downloaded!', type: 'success', isLoading: false, autoClose: 3000 });
              } catch (e) {
                toast.dismiss();
                toast.error('Failed to download PDF');
              }
            }}
            className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Quotation'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Date"
            required={true}
            name="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <FormInput
            label="Solar Module"
            required={true}
            name="solarModule"
            type="text"
            value={solarModule}
            onChange={(e) => {
              setSolarModule(e.target.value);
              if (errors.solarModule) {
                setErrors(prev => ({ ...prev, solarModule: '' }));
              }
            }}
            error={errors.solarModule}
          />
          <FormInput
            label="Inverter"
            required={true}
            name="inverter"
            type="text"
            value={inverter}
            onChange={(e) => {
              setInverter(e.target.value);
              if (errors.inverter) {
                setErrors(prev => ({ ...prev, inverter: '' }));
              }
            }}
            error={errors.inverter}
          />
        </div>

        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium text-gray-700">Options (Columns):</span>
            <button
              onClick={handleAddOption}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-blue-200 rounded px-2 py-1 bg-blue-50"
            >
              + Add Option
            </button>
            <span className="text-xs text-gray-400">Max 5 options</span>
          </div>
          
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-secondary text-white">
                  <th className="p-2 border border-secondary w-64 uppercase text-xs font-bold">ROW TITLE</th>
                  {options.map((opt, i) => (
                    <th key={i} className="p-2 border border-secondary font-bold uppercase text-xs text-center relative group">
                      <div className="flex items-center justify-between gap-1">
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={(e) => handleOptionNameChange(i, e.target.value)}
                          className="bg-transparent border-none text-white font-bold uppercase text-xs outline-none w-full placeholder-orange-200"
                          placeholder={`OPTION ${i+1}`}
                        />
                        {options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(i)}
                            className="text-white hover:text-red-200 p-0.5 rounded transition-colors"
                            title="Remove Column"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-2 border border-secondary w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="bg-white hover:bg-gray-50 border-b border-gray-200">
                    <td className="p-1 border-r border-gray-200">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => handleRowTitleChange(rIdx, e.target.value)}
                        readOnly={DEFAULT_ROWS.some(r => r.title.toLowerCase() === row.title.toLowerCase())}
                        className={`w-full uppercase text-xs font-semibold text-gray-700 px-2 py-1 outline-none border ${DEFAULT_ROWS.some(r => r.title.toLowerCase() === row.title.toLowerCase()) ? 'border-transparent bg-transparent cursor-default focus:border-transparent focus:bg-transparent' : 'border-transparent focus:border-gray-300 focus:bg-white bg-gray-50'} rounded`}
                        placeholder="Row Title"
                      />
                    </td>
                    {row.values.map((val, cIdx) => {
                      const rowKey = row.title.toLowerCase().trim();
                      const isDropdown = DROPDOWN_FIELDS.includes(rowKey);
                      const uniqueOptions = apiOptions[rowKey] || [];

                      return (
                        <td key={cIdx} className="p-1 border-r border-gray-200">
                          {isDropdown ? (
                            <div className="w-full">
                              <Select
                                isClearable
                                value={val ? { label: val, value: val } : null}
                                onChange={(newValue) => handleRowValueChange(rIdx, cIdx, newValue ? newValue.value : '')}
                                options={uniqueOptions}
                                placeholder="Select option..."
                                styles={{
                                  control: (base, state) => ({
                                    ...base,
                                    fontSize: '0.875rem',
                                    minHeight: '38px',
                                    height: '38px',
                                    border: state.isFocused ? '1px solid #d1d5db' : '1px solid #e5e7eb',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '0.375rem',
                                    boxShadow: 'none',
                                    outline: 'none',
                                    padding: '0',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      borderColor: '#d1d5db'
                                    }
                                  }),
                                  valueContainer: (base) => ({
                                    ...base,
                                    padding: '0 8px',
                                    height: '36px',
                                    lineHeight: '36px'
                                  }),
                                  input: (base) => ({
                                    ...base,
                                    margin: '0',
                                    padding: '0',
                                    '& input': {
                                      outline: 'none !important',
                                      boxShadow: 'none !important',
                                      border: 'none !important'
                                    }
                                  }),
                                  indicatorsContainer: (base) => ({
                                    ...base,
                                    height: '36px'
                                  }),
                                  indicatorSeparator: () => ({
                                    display: 'none' // Remove the vertical line
                                  }),
                                  dropdownIndicator: (base) => ({
                                    ...base,
                                    padding: '4px 8px',
                                    color: '#9ca3af',
                                    '&:hover': {
                                      color: '#6b7280'
                                    }
                                  }),
                                  clearIndicator: (base) => ({
                                    ...base,
                                    padding: '4px',
                                    color: '#9ca3af',
                                    '&:hover': {
                                      color: '#ef4444'
                                    }
                                  }),
                                  option: (base, state) => ({
                                    ...base,
                                    fontSize: '0.875rem',
                                    backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f9fafb' : '#ffffff',
                                    color: state.isSelected ? '#1d4ed8' : '#374151',
                                    cursor: 'pointer',
                                    padding: '8px 12px',
                                    '&:active': {
                                      backgroundColor: '#dbeafe'
                                    }
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                    borderRadius: '0.375rem',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    border: '1px solid #e5e7eb'
                                  }),
                                  menuPortal: base => ({ ...base, zIndex: 9999 })
                                }}
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => handleRowValueChange(rIdx, cIdx, e.target.value)}
                              placeholder="Value"
                              className="w-full text-sm px-2 py-1 outline-none border border-gray-200 focus:border-gray-300 focus:ring-1 focus:ring-gray-300 bg-white rounded-md"
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(rIdx)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 bg-gray-50">
              <button
                onClick={handleAddRow}
                className="text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-800 flex items-center gap-1 border border-fuchsia-200 rounded px-2.5 py-1 bg-fuchsia-50 hover:bg-fuchsia-100 transition-colors"
              >
                + Add More
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
