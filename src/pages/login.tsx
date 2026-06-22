'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Zap, LayoutGrid, PieChart, Settings, Shield, LogIn, Sun } from 'lucide-react';
import { baseUrl, setAuthToken } from '../config';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import smsLogo from '../../public/logo/solar (2).png';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Formik validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  // Formik form handling
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { data: result } = await axios.post(`${baseUrl.userLogin}`, {
          email: values.email,
          password: values.password,
        });

        if (result.status === 'Success') {
          setAuthToken(result.token);
          toast.success(result.message || 'Login successful');
          router.push('/');
        } else {
          toast.error(result.message || 'Login failed');
        }
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong'
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#13111c] p-4 font-sans">
      <div className="flex w-full max-w-[1100px] h-[750px] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">
        
        {/* Left Section */}
        <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-br from-[#4b6cb7] via-[#7b558f] to-[#a63c71] p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full border border-white/10 -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full border border-white/10 -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full border border-white/10 -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo & Title area */}
            <div className="mb-12 flex items-center gap-6">
              <div className="shrink-0 bg-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20">
                <img src={smsLogo.src} alt="ELink Logo" className="h-12 w-auto object-contain mix-blend-darken" />
              </div>
              <h1 className="text-[2.5rem] leading-tight font-extrabold text-white">
                Welcome to ELink Solar
              </h1>
            </div>
            <p className="text-gray-300 text-sm mb-12 max-w-sm leading-relaxed">
              Complete Solar Business Management Platform for the Modern Era
            </p>

            {/* Features List */}
            <div className="space-y-4 mt-auto">
              {/* Feature 1 */}
              <div className="flex items-center gap-5 bg-black/20 p-4 rounded-2xl border border-white/5 hover:bg-black/30 transition-colors">
                <div className="bg-white/20 p-3 rounded-xl shadow-lg">
                  <Zap className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">Lead Management</h3>
                  <p className="text-gray-200 text-xs">Track, assign & convert solar leads</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-5 bg-black/20 p-4 rounded-2xl border border-white/5 hover:bg-black/30 transition-colors">
                <div className="bg-white/20 p-3 rounded-xl shadow-lg">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">Work Orders</h3>
                  <p className="text-gray-200 text-xs">Manage installations end-to-end</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-5 bg-black/20 p-4 rounded-2xl border border-white/5 hover:bg-black/30 transition-colors">
                <div className="bg-white/20 p-3 rounded-xl shadow-lg">
                  <PieChart className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">Sales Analytics</h3>
                  <p className="text-gray-200 text-xs">Real-time performance insights</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-5 bg-black/20 p-4 rounded-2xl border border-white/5 hover:bg-black/30 transition-colors">
                <div className="bg-white/20 p-3 rounded-xl shadow-lg">
                  <Settings className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">Workflow Automation</h3>
                  <p className="text-gray-200 text-xs">Automate follow-ups & tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col w-full md:w-1/2 bg-[#1a1625] p-8 md:p-16 justify-center">
          <div className="w-full max-w-[380px] mx-auto">
            {/* Secure Portal Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider border border-primary/20 mb-8">
              <Shield className="w-3.5 h-3.5" fill="currentColor" />
              SECURE PORTAL
            </div>

            <h2 className="text-4xl font-extrabold text-white mb-3">Welcome Back!</h2>
            <p className="text-gray-400 text-sm mb-10">
              Sign in to your Solar CRM dashboard
            </p>

            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-300 tracking-wider">
                  <Mail className="w-3.5 h-3.5 text-primary-400" />
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-4 w-4 text-primary-400/70" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full rounded-xl border py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition bg-[#251f32] ${formik.touched.email && formik.errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/5 focus:border-primary-500 focus:ring-primary-500/20'
                      } focus:ring-2`}
                    placeholder="Enter your email address"
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-xs text-red-500">{formik.errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-300 tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-primary-400" />
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Lock className="h-4 w-4 text-primary-400/70" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter your password"
                    className={`w-full rounded-xl border py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none transition bg-[#251f32] ${formik.touched.password && formik.errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-white/5 focus:border-primary-500 focus:ring-primary-500/20'
                      } focus:ring-2`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs text-red-500">{formik.errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[13px] font-bold tracking-wider text-white shadow-lg transition-all hover:bg-primary-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-8"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin"></div>
                    <span>SIGNING IN...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    SIGN IN TO DASHBOARD
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 flex items-center justify-center gap-2 text-[11px] text-gray-500">
              <span>Powered by EMS — Complete Business Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
