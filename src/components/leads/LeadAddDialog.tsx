import { useEffect, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import { baseUrl, getAuthToken } from '@/config';
import { toast } from 'react-toastify';
import { ApiLead } from './types';
import FormInput from '../ui/Input';
import { FormSelect } from '../ui/FormSelect';
import { FileText, Download, AlertCircle } from 'lucide-react';
import LeadQuotationDialog from './LeadQuotationDialog';
import { useAppSelector } from '@/redux/hooks';

interface DropdownItem { _id: string; name?: string; fullName?: string; departmentName?: string; }

interface Attachment {
  _id?: string;
  name?: string;
  originalName?: string;
  path: string;
  size?: number;
  mimeType?: string;
  filename?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  initialData?: ApiLead | null;
  onLeadCreated?: (lead: any) => void;
  onLeadUpdated?: (lead: any) => void;
}

// Static schema removed - moved inside component for dynamic required fields

export default function LeadAddDialog({
  isOpen, onClose, mode, initialData,
  onLeadCreated, onLeadUpdated,
}: Props) {
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [staff, setStaff] = useState<DropdownItem[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [cities, setCities] = useState<{ _id: string; cityName: string }[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [quotationOpen, setQuotationOpen] = useState(false);

  const [requiredFields] = useState<string[]>(["fullName", "contact", "email", "leadSource", "leadStatus", "assignedTo", "kwRequirement"]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentStaff = useAppSelector((state) => state.auth.currentStaff);
  const leadStatusesData = useAppSelector((state) => state.leadStatus.data);

  useEffect(() => {
    setCurrentUser(currentStaff);
  }, [currentStaff]);

  useEffect(() => {
    setStatuses(leadStatusesData as any[]);
  }, [leadStatusesData]);

  const isSalesExecutive = useMemo(() => {
    const roleName = (currentUser?.role?.roleName || '').toLowerCase();
    return roleName === 'sales';
  }, [currentUser]);

  const isAdminOrHR = useMemo(() => {
    const roleName = (currentUser?.role?.roleName || '').toLowerCase();
    return roleName.includes('admin') || roleName.includes('hr');
  }, [currentUser]);

  const leadValidationSchema = useMemo(() => {
    let shape: any = {
      fullName: Yup.string()
        .min(2, 'Full Name must be at least 2 characters')
        .max(100, 'Full Name must not exceed 100 characters'),
      contact: Yup.string()
        .matches(/^\d+$/, 'Only numbers allowed')
        .length(10, 'Mobile number must be exactly 10 digits'),
      email: Yup.string()
        .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email format')
        .max(100, 'Email must not exceed 100 characters')
        .test('valid-domain', 'Invalid email domain. Please enter a valid domain (e.g., @gmail.com)', (value) => {
          if (!value) return true;
          const domain = value.split('@')[1]?.toLowerCase();
          if (!domain) return false;
          
          // Reject invalid variations of gmail
          if (domain !== 'gmail.com') {
            const isGmailTypo = 
              domain.includes('gmail') || 
              domain.includes('gamil') || 
              domain.includes('gmal') || 
              domain.includes('gmai') ||
              /^g[a-z]*m[a-z]*a[a-z]*i[a-z]*l[a-z]*\.[a-z]+$/.test(domain);
              
            // Allow legitimate non-gmail domains like protonmail.com, globalmail.com etc.
            // The regex ^g...$ ensures it starts with g and ends with l before the dot.
            if (isGmailTypo && domain.startsWith('g')) {
               return false;
            }
          }
          
          return true;
        }),
      kwRequirement: Yup.string().required('KW Requirement is required'),
      discomName: Yup.string(),
      leadrefrance: Yup.string(),
      projecttype: Yup.string(),
      address: Yup.string().max(500, 'Address must not exceed 500 characters'),
      locationLink: Yup.string(),
      city: isSalesExecutive ? Yup.string() : Yup.string().required('City is required'),
      leadStatus: Yup.string(),
      assignedTo: Yup.string(),
      isActive: Yup.boolean(),
    };

    if (requiredFields.includes('fullName')) shape.fullName = shape.fullName.required('Full Name is required');
    if (requiredFields.includes('contact')) shape.contact = shape.contact.required('Mobile Number is required');
    if (requiredFields.includes('leadStatus')) shape.leadStatus = Yup.string().required('Please select a stage');
    if (requiredFields.includes('assignedTo') && !isSalesExecutive) shape.assignedTo = Yup.string().required('Please assign a sales executive');

    return Yup.object().shape(shape);
  }, [requiredFields, isSalesExecutive]);

  const token = getAuthToken;

  const formik = useFormik({
    initialValues: {
      fullName: '',
      contact: '',
      email: '',
      kwRequirement: '',
      discomName: '',
      leadrefrance: '',
      projecttype: '',
      address: '',
      locationLink: '',
      city: '',
      leadStatus: '',
      assignedTo: '',
      isActive: true,
    },
    validationSchema: leadValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        const payload: any = {
          fullName: values.fullName.trim(),
          contact: values.contact.trim(),
          email: values.email.trim().toLowerCase(),
          kwRequirement: values.kwRequirement.trim(),
          discomName: values.discomName,
          leadrefrance: values.leadrefrance,
          projecttype: values.projecttype,
          address: values.address.trim(),
          locationLink: values.locationLink.trim(),
          city: isSalesExecutive ? '' : values.city,
          leadStatus: values.leadStatus,
          assignedTo: isSalesExecutive ? (values.assignedTo || currentUser?._id || '') : values.assignedTo,
          isActive: values.isActive,
        };

        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          formData.append(key, payload[key]);
        });
        attachments.forEach((file) => {
          formData.append('attachments', file);
        });

        const headers = {
          Authorization: `Bearer ${token()}`,
        };

        if (mode === 'add') {
          const res = await axios.post(baseUrl.addLead, formData, { headers });
          toast.success('Lead created successfully!');
          onLeadCreated?.(res.data?.data ?? res.data);
        } else {
          if (!initialData?._id) throw new Error('Missing lead ID');
          const res = await axios.put(`${baseUrl.updateLead}/${initialData._id}`, formData, { headers });
          toast.success('Lead updated successfully!');
          onLeadUpdated?.(res.data?.data ?? res.data);
        }
        onClose();
      } catch (error: any) {
        const msg = error.response?.data?.message || `Failed to ${mode} lead`;
        setStatus(msg);
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Prefetch base data on mount
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token()}` };
        const [sourceRes, cityRes] = await Promise.all([
          axios.get(baseUrl.leadSources, { headers }),
          axios.get(`${baseUrl.city}/all?all=true`, { headers })
        ]);
        setLeadSources(sourceRes.data?.data || sourceRes.data || []);
        setCities(cityRes.data?.data || []);
      } catch (error) {
        console.error('Failed to prefetch base data', error);
      }
    };
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      if (mode === 'edit' && initialData?._id) {
        setLoading(true);
        try {
          const headers = { Authorization: `Bearer ${token()}` };
          const [deptRes, leadRes] = await Promise.all([
            axios.get(baseUrl.department, { headers }),
            axios.get(`${baseUrl.findLeadById}/${initialData._id}`, { headers })
          ]);
          const leadData = leadRes.data?.data;
          const dataToUse = leadData || initialData;
          if (dataToUse) {
            const leadCity = dataToUse.city || (Array.isArray(currentUser?.city) ? currentUser.city[0] : currentUser?.city) || '';
            const leadAssigned = dataToUse.assignedTo?._id || dataToUse.assignedTo || dataToUse.createdBy?._id || dataToUse.createdBy || '';
            formik.setValues({
              fullName: dataToUse.fullName || '',
              contact: dataToUse.contact || '',
              email: dataToUse.email || '',
              kwRequirement: dataToUse.kwRequirement || '',
              discomName: dataToUse.discomName || '',
              leadrefrance: dataToUse.leadrefrance || '',
              projecttype: dataToUse.projecttype || '',
              address: dataToUse.address || '',
              locationLink: dataToUse.locationLink || '',
              city: leadCity,
              leadStatus: typeof dataToUse.leadStatus === 'string' ? dataToUse.leadStatus : (dataToUse.leadStatus?._id || ''),
              assignedTo: leadAssigned,
              isActive: dataToUse.isActive ?? true,
            });
          }
        } catch {
          formik.setStatus('Failed to load lead data');
        } finally {
          setLoading(false);
        }
      } else {
        formik.resetForm();
        setAttachments([]);
        // Default city to user's first assigned city if creating
        const userDefaultCity = (Array.isArray(currentUser?.city) ? currentUser.city[0] : currentUser?.city) || '';
        if (userDefaultCity) {
          formik.setFieldValue('city', userDefaultCity);
        }
      }
    };
    fetchData();
    formik.setStatus(null);
  }, [isOpen, mode, initialData, currentUser]);


  useEffect(() => {
    if (!isOpen) return;
    const fetchStaffForCity = async () => {
      try {
        const headers = { Authorization: `Bearer ${getAuthToken()}` };
        // Fetch all sales executives so the creator/assigned staff is always present in dropdown
        const [staffRes, deptRes] = await Promise.all([
          axios.get(baseUrl.getSalesExecutives, { headers }),
          axios.get(baseUrl.department, { headers })
        ]);
        const depts = deptRes.data?.data || [];
        let users = staffRes.data?.data || [];
        users = users.map((u: any) => {
          const d = depts.find((dept: any) => dept._id === u.department);
          return { ...u, departmentName: d ? (d.roleName || d.name) : '' };
        });
        setStaff(users);

        // Ensure city default if empty
        if (!formik.values.city && cities.length > 0) {
          const userCity = (Array.isArray(currentUser?.city) ? currentUser.city[0] : currentUser?.city);
          const defaultCity = userCity || cities[0]._id;
          formik.setFieldValue('city', defaultCity);
        }

        // Ensure assignedTo default to creator or first sales executive
        if (!formik.values.assignedTo && users.length > 0) {
          const creatorId = initialData?.createdBy?._id || initialData?.createdBy || currentUser?._id;
          const matchCreator = users.find((u: any) => u._id === creatorId);
          formik.setFieldValue('assignedTo', matchCreator ? matchCreator._id : users[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch staff', err);
      }
    };
    fetchStaffForCity();
  }, [isOpen, cities, currentUser]);

  const getFieldError = (fieldName: string) => {
    const isTouched = formik.touched[fieldName as keyof typeof formik.touched];
    const error = formik.errors[fieldName as keyof typeof formik.errors];
    return isTouched && error ? (error as string) : undefined;
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'edit' ? 'Edit Lead' : 'Add New Lead'}
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={formik.isSubmitting}
              className="rounded-lg cursor-pointer border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="lead-form"
              disabled={formik.isSubmitting || loading || !formik.isValid}
              className="min-w-[80px] cursor-pointer rounded-lg bg-[#a63c71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f325f] disabled:opacity-50"
            >
              {formik.isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Lead' : 'Save Lead'}
            </button>
          </>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#a63c71] border-t-transparent" />
          </div>
        ) : (
          <form id="lead-form" onSubmit={formik.handleSubmit} className="space-y-4">
            {formik.status && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formik.status}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="fullName"
                type="text"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('fullName')}
                required={requiredFields.includes('fullName')}
              />
              {/* Mobile Number — numeric only, max 10 digits */}
              <div className="w-full mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Mobile Number
                    {requiredFields.includes('contact') && <span className="text-red-700 ml-1">*</span>}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="tel"
                    name="contact"
                    inputMode="numeric"
                    maxLength={10}
                    value={formik.values.contact}
                    onChange={(e) => {
                      // Strip any non-digit characters
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      formik.setFieldValue('contact', numericOnly);
                    }}
                    onKeyDown={(e) => {
                      // Allow: backspace, delete, tab, escape, enter, arrows, home, end
                      const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                      if (allowed.includes(e.key)) return;
                      // Block anything that's not a digit
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    onBlur={formik.handleBlur}
                    placeholder="Enter 10-digit number"
                    className={`w-full px-3 py-2.5 pr-52 rounded-xl bg-white/90 text-gray-800 text-sm outline-none transition-all duration-200 border-2 ${formik.touched.contact && formik.errors.contact
                      ? 'border-red-500 ring-2 ring-red-200'
                      : formik.values.contact.length === 10
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                  />

                </div>
                {formik.touched.contact && formik.errors.contact && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-700 flex-shrink-0" />
                    <p className="text-red-700 text-xs">{formik.errors.contact}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={getFieldError('email')}
              />
              <FormInput
                label="KW Requirement"
                name="kwRequirement"
                type="text"
                value={formik.values.kwRequirement}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const numericOnly = e.target.value.replace(/\D/g, '');
                  formik.setFieldValue('kwRequirement', numericOnly);
                }}
                onBlur={formik.handleBlur}
                error={getFieldError('kwRequirement')}
                required={requiredFields.includes('kwRequirement')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Discom Name"
                name="discomName"
                value={formik.values.discomName || ''}
                onChange={(val) => { formik.setFieldValue('discomName', val); }}
                onBlur={() => formik.setFieldTouched('discomName')}
                options={[
                  { value: 'DGVCL', label: 'DGVCL' },
                  { value: 'Torrent Power', label: 'Torrent Power' },
                ]}
                error={getFieldError('discomName')}
                placeholder="Select Discom Name"
              />
              <FormSelect
                label="Source"
                name="leadrefrance"
                value={formik.values.leadrefrance || ''}
                onChange={(val) => { formik.setFieldValue('leadrefrance', val); }}
                onBlur={() => formik.setFieldTouched('leadrefrance')}
                options={leadSources.map((s) => ({ value: s._id, label: s.name || 'Unnamed' }))}
                error={getFieldError('leadrefrance')}
                placeholder="Select Source"
              />
            </div>

            {!isSalesExecutive && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="City"
                  name="city"
                  value={formik.values.city || ''}
                  onChange={(val) => {
                    formik.setFieldValue('city', val);
                  }}
                  onBlur={() => formik.setFieldTouched('city')}
                  options={cities.map((c: any) => ({ value: c._id, label: c.cityName }))}
                  error={getFieldError('city')}
                  placeholder="Select City"
                  required
                />
              </div>
            )}

            <FormInput
              label="Address"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('address')}
              as="textarea"
            />

            <FormInput
              label="Location Link"
              name="locationLink"
              value={formik.values.locationLink}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={getFieldError('locationLink')}
              as="textarea"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Stage"
                name="leadStatus"
                value={formik.values.leadStatus}
                onChange={(val) => { formik.setFieldValue('leadStatus', val); }}
                onBlur={() => formik.setFieldTouched('leadStatus')}
                options={statuses.map((s) => ({ value: s._id, label: s.name! }))}
                error={getFieldError('leadStatus')}
                placeholder="Select Stage"
                disabled={mode === 'edit' && (initialData?.leadStatus?.name?.toLowerCase() === 'won' || statuses.find(s => s._id === (typeof initialData?.leadStatus === 'string' ? initialData.leadStatus : initialData?.leadStatus?._id))?.name?.toLowerCase() === 'won')}
                required={requiredFields.includes('leadStatus')}
              />
              {!isSalesExecutive && (
                <FormSelect
                  label="User (For Assign)"
                  name="assignedTo"
                  value={formik.values.assignedTo}
                  onChange={(val) => { formik.setFieldValue('assignedTo', val); }}
                  onBlur={() => formik.setFieldTouched('assignedTo')}
                  options={staff.map((s) => ({ value: s._id, label: `${s.fullName || s.name!}${s.departmentName ? ` (${s.departmentName})` : ''}` }))}
                  error={getFieldError('assignedTo')}
                  placeholder="Select User"
                  required={requiredFields.includes('assignedTo')}
                />
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormSelect
                label="Project Type"
                name="projecttype"
                value={formik.values.projecttype || ''}
                onChange={(val) => { formik.setFieldValue('projecttype', val); }}
                onBlur={() => formik.setFieldTouched('projecttype')}
                options={[
                  { value: 'resident', label: 'Resident' },
                  { value: 'industrial', label: 'Industrial' },
                  { value: 'commercial', label: 'Commercial' },
                ]}
                error={getFieldError('projecttype')}
                placeholder="Select Project Type"
              />
            </div>

            {/* Active */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formik.values.isActive}
                onChange={formik.handleChange}
                className="h-4 w-4 rounded border-gray-300 text-[#A63C71] focus:ring-[#A63C71]"
              />
              <span className="text-sm font-medium text-gray-700">Active Lead</span>
            </label>
          </form>
        )}
      </Dialog>


    </>
  );
}
