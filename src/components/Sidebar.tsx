'use client';

import React from "react"
import { useState, useEffect } from 'react';
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Settings,
  Settings2,
  Users,
  LogOut,
  RefreshCw,
  ChevronDown,
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Menu,
  CheckSquare,
  Flag,
  List,
  Package,
  PackagePlus,
  PackageMinus,
  Building2,
  Megaphone,
  FileText,
} from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import axios from "axios";
import { baseUrl, clearAuthToken, getAuthToken } from "@/config";
import Swal from 'sweetalert2';
import smsLogo from '../../public/logo/solar (2).png';
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  children?: MenuItem[];
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [canViewLead, setCanViewLead] = useState(false);
  const [canViewTask, setCanViewTask] = useState(false);
  const [canViewStaff, setCanViewStaff] = useState(false);
  const [canViewRole, setCanViewRole] = useState(false);
  const [canViewLeadStatus, setCanViewLeadStatus] = useState(false);
  const [canViewLeadSource, setCanViewLeadSource] = useState(false);
  const [canViewLeadLabel, setCanViewLeadLabel] = useState(false);
  const [canViewCategory, setCanViewCategory] = useState(false);
  const [canViewProduct, setCanViewProduct] = useState(false);
  const [canViewStock, setCanViewStock] = useState(false);
  const [canViewCity, setCanViewCity] = useState(false);
  const [canViewReport, setCanViewReport] = useState(false);

  const currentStaff = useAppSelector((state) => state.auth.currentStaff);

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !currentStaff) return;

    const role: any = currentStaff.role || {};
    const rawPerms = Array.isArray(role.permissions)
      ? role.permissions[0]
      : role.permissions || {};
    const leadPerms = rawPerms.lead || {};
    const taskPerms = rawPerms.task || {};
    const staffPerms = rawPerms.staff || {};
    const rolePerms = rawPerms.role || {};
    const leadStatusPerms = rawPerms.leadStatus || {};
    const leadSourcePerms = rawPerms.leadSource || {};
    const leadLabelPerms = rawPerms.leadLabel || {};
    const setupPerms = rawPerms.setup || {};
    const categoryPerms = rawPerms.category || {};
    const productPerms = rawPerms.product || {};
    const stockPerms = rawPerms.stock || {};
    const cityPerms = rawPerms.city || {};
    const reportPerms = rawPerms.report || {};

    const isAdmin = role.roleName?.toLowerCase() === "admin";

    setCanViewLead(isAdmin || !!(leadPerms.readOwn || leadPerms.readAll));
    setCanViewTask(isAdmin || !!(taskPerms.readOwn || taskPerms.readAll));
    setCanViewStaff(isAdmin || !!(staffPerms.readAll || setupPerms.readAll));
    setCanViewRole(isAdmin || !!(rolePerms.readAll || setupPerms.readAll));
    setCanViewLeadStatus(isAdmin || !!(leadStatusPerms.readAll || leadStatusPerms.readOwn));
    setCanViewLeadSource(isAdmin || !!(leadSourcePerms.readAll || leadSourcePerms.readOwn));
    setCanViewLeadLabel(isAdmin || !!(leadLabelPerms.readAll || leadLabelPerms.readOwn));
    setCanViewCategory(isAdmin || !!(categoryPerms.readAll || categoryPerms.readOwn));
    setCanViewProduct(isAdmin || !!(productPerms.readAll || productPerms.readOwn));
    setCanViewStock(isAdmin || !!(stockPerms.readAll || stockPerms.readOwn));
    setCanViewCity(isAdmin || !!(cityPerms.readAll || cityPerms.readOwn));
    setCanViewReport(isAdmin || !!(reportPerms.readAll || reportPerms.readOwn));
  }, [currentStaff]);

  const menuItems: MenuItem[] = [];

  if (currentStaff) {
    menuItems.push({ icon: LayoutDashboard, label: "Dashboard", path: "/" });

    if (canViewLead) {
      menuItems.push({ icon: UserPlus, label: "Leads", path: "/leads" });
    }

    // if (canViewTask) {
    //   menuItems.push({ icon: CheckSquare, label: "Tasks", path: "/tasks" });
    // }

    if (canViewRole) menuItems.push({ icon: Building2, label: "Department Management", path: "/roles" });
    if (canViewStaff) menuItems.push({ icon: Users, label: "User", path: "/user-list" });
    if (canViewLeadStatus) menuItems.push({ icon: Flag, label: "Lead Status", path: "/lead-status" });
    if (canViewLeadSource) menuItems.push({ icon: Megaphone, label: "Lead Source", path: "/lead-sources" });
    if (canViewCategory) menuItems.push({ icon: List, label: "Category", path: "/category" });
    if (canViewProduct) menuItems.push({ icon: Package, label: "Product", path: "/product" });
    if (canViewStock) {
      menuItems.push({ icon: PackagePlus, label: "Stock In", path: "/stock-in" });
      menuItems.push({ icon: PackageMinus, label: "Stock Out", path: "/stock-out" });
    }
    if (canViewCity) {
      menuItems.push({ icon: Building2, label: "City", path: "/city" });
    }

    if (canViewReport) {
      menuItems.push({
        icon: FileText,
        label: "Reports",
        children: [
          { icon: Users, label: "Lead Report", path: "/reports/leads" },
          { icon: PackagePlus, label: "Stock In Report", path: "/reports/stock-in" }
        ]
      });
    }

    menuItems.push({
      icon: Settings2,
      label: "Quotation Master",
      path: "/quotation-master",
    });

    menuItems.push({
      icon: Settings,
      label: "Setup",
      path: "/setup",
    });
  }

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const handleLogout = () => {
    Swal.fire({
      html: `
        <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[#A63C71]/10 text-[#A63C71] mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </div>
            <h2 class="text-lg font-bold text-[#1f2937] mb-1">Ready to leave?</h2>
            <p class="text-[14px] text-gray-500 leading-relaxed">You will be securely logged out<br/>of your account.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      background: '#ffffff',
      width: '340px',
      padding: '24px',
      backdrop: 'rgba(0,0,0,0.5)',
      customClass: {
        popup: 'rounded-[24px] shadow-2xl border border-gray-100',
        htmlContainer: 'm-0 p-0',
        actions: 'flex w-full gap-3 mt-6 mb-0 p-0',
        confirmButton: 'flex-1 bg-[#A63C71] text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-[#8f325f] transition-all m-0 outline-none focus:ring-2 focus:ring-[#A63C71]/50 focus:ring-offset-1 border-0',
        cancelButton: 'flex-1 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all m-0 outline-none focus:ring-2 focus:ring-gray-200'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Logging out...',
          text: 'Please wait',
          icon: 'info',
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Perform logout
        clearAuthToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("auth");
        }

        // Show success message
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          router.replace("/login");
        });
      }
    });
  };

  const handleNavigation = (path?: string) => {
    if (path) {
      router.push(path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) {
        toggleSidebar();
      }
    }
  };


  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-[#4b6cb7] via-[#7b558f] to-[#a63c71] text-white shadow-2xl ${mounted ? 'transition-all duration-300 ease-in-out' : ''} ${isOpen
            ? 'w-64 translate-x-0'
            : 'w-64 -translate-x-full md:w-20 md:translate-x-0'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Header with Logo */}
          <div
            className={`flex items-center h-20 px-4 bg-[#FFFFFF]  ${isOpen ? "justify-between" : "justify-center"
              }`}
          >
            {isOpen && (
              <div className="flex-1 flex items-center justify-center ml-8">
                <img
                  src={smsLogo.src}
                  alt="SMS Logo"
                  className="h-16 w-auto max-w-[240px] object-contain shrink-0 scale-[1.1]"
                />
              </div>
            )}

            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg hover:bg-black/10 transition-all duration-200 group ${isOpen ? "ml-3" : ""}`}
              aria-label="Toggle sidebar"
            >
              {isOpen ? (
                <ChevronLeft className="h-6 w-6 text-slate-700 drop-shadow-md" />
              ) : (
                <Menu className="h-6 w-6 text-slate-700 drop-shadow-md" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <ul className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children;
                const expanded = expandedItems.has(item.label);
                const isItemActive = isActive(item.path);

                return (
                  <li key={item.label}>
                    {hasChildren ? (
                      <div>
                        <button
                          onClick={() => toggleExpand(item.label)}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${expanded
                              ? 'bg-white/10 text-white'
                              : 'text-white/70 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${expanded ? 'text-white' : 'text-white/70'
                            }`} />
                          {isOpen && (
                            <>
                              <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>

                        {/* Submenu */}
                        {isOpen && expanded && (
                          <ul className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-3">
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive = isActive(child.path);

                              return (
                                <li key={child.label}>
                                  <button
                                    onClick={() => handleNavigation(child.path)}
                                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 group ${isChildActive
                                        ? 'bg-gradient-to-r from-[#0f3c70]/20 to-[#0f2f5a]/20 text-white border border-white/10'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                      }`}
                                  >
                                    <ChildIcon className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isChildActive ? 'text-[#9f7cff]' : 'text-white/60'
                                      }`} />
                                    <span className="text-sm">{child.label}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 group ${isItemActive
                            ? 'bg-white/20 text-white shadow-md'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isItemActive ? 'text-white' : 'text-white/80'
                          }`} />
                        {isOpen && (
                          <span className="text-sm font-medium text-left flex-1 whitespace-nowrap truncate">{item.label}</span>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>


        </div>
      </aside>
    </>
  );
}