'use client';

import { useEffect, useState, useRef } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiDownload,
  FiMoreVertical,
  FiRefreshCw
} from 'react-icons/fi';
import smsLogo from '../../public/logo/solar (2).png';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchValue?: string;
  pagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSearch?: (value: string) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  canEdit?: (row: T) => boolean;
  canDelete?: (row: T) => boolean;
  loading?: boolean;
  actions?: boolean;
  title?: string;
  subtitle?: string;
  striped?: boolean;
  addButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  onRefresh?: () => void;
  onExport?: () => void;
  extraActions?: {
    label: string;
    onClick: (row: T) => void;
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'emerald';
    show?: (row: T) => boolean;
  }[];
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchValue: externalSearchValue = '',
  pagination = true,
  currentPage = 1,
  totalPages = 1,
  totalRecords = data.length,
  pageSize = 10,
  onPageChange = () => { },
  onPageSizeChange = () => { },
  onSearch = () => { },
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  loading = false,
  actions = true,
  title,
  subtitle,
  striped = true,
  addButton,
  onRefresh,
  onExport,
  extraActions,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState(externalSearchValue);
  const [internalPage, setInternalPage] = useState(currentPage);
  const [internalPageSize, setInternalPageSize] = useState(pageSize);

  useEffect(() => {
    setSearchValue(externalSearchValue);
  }, [externalSearchValue]);

  useEffect(() => {
    setInternalPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setInternalPageSize(pageSize);
  }, [pageSize]);

  const handlePageChange = (page: number) => {
    setInternalPage(page);
    onPageChange(page);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [pageSizeDropdownOpen, setPageSizeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPageSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderCell = (column: Column<T>, row: T) => {
    const value = row[column.key as string];
    return column.render ? column.render(value, row) : value ?? '-';
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };


  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (calculatedTotalPages <= maxVisible) {
      for (let i = 1; i <= calculatedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, internalPage - 1);
      let end = Math.min(calculatedTotalPages - 1, internalPage + 1);

      if (internalPage <= 3) {
        end = Math.min(calculatedTotalPages - 1, 4);
      }

      if (internalPage >= calculatedTotalPages - 2) {
        start = Math.max(2, calculatedTotalPages - 3);
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < calculatedTotalPages - 1) {
        pages.push('...');
      }

      if (calculatedTotalPages > 1) {
        pages.push(calculatedTotalPages);
      }
    }

    return pages;
  };

  useEffect(() => {
    if (!pagination) return;
    if (internalPage > 1 && data.length === 0 && totalRecords > 0) {
      handlePageChange(1);
    }
  }, [pagination, internalPage, data.length, totalRecords]);

  const filteredData = data.filter(row => {
    if (!searchValue) return true;
    const lowerSearch = searchValue.toLowerCase();
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    });
  });

  const safeTotalRecords = Number(totalRecords) || data.length;
  // We use client-side pagination if the data length matches total records, or if the server returned more data than the page size (meaning it didn't paginate)
  const isClientSidePagination = safeTotalRecords === data.length || data.length > internalPageSize;
  const calculatedTotalPages = isClientSidePagination
    ? Math.ceil(filteredData.length / internalPageSize)
    : totalPages;

  const displayedData = isClientSidePagination
    ? filteredData.slice((internalPage - 1) * internalPageSize, internalPage * internalPageSize)
    : filteredData;

  return (
    <div className="rounded-md bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* Header - Premium Design */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-200 px-3 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
            {totalRecords > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Showing {filteredData.length} of {totalRecords} entries
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="group relative inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 h-10 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FiRefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="group relative inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 h-10 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <FiDownload className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {searchable && (
              <div className="relative w-full sm:w-auto">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search anything..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full sm:w-80 rounded-md border border-gray-200 bg-white pl-10 pr-4 h-10 text-sm text-gray-700 placeholder:text-gray-400 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 hover:border-gray-300"
                />
              </div>
            )}

            {/* <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 h-10 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <FiFilter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button> */}

            {addButton && (
              <button
                onClick={addButton.onClick}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-5 h-10 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
              >
                {addButton.icon || <span className="text-lg">+</span>}
                {addButton.label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table - Modern Design */}
      <div className="border-t border-gray-100 overflow-auto max-h-[calc(100vh-280px)]">
        <table className="w-full divide-y divide-gray-100 relative">
          <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap bg-gray-100 ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
              {actions && (onView || onEdit || onDelete || extraActions) && (
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 whitespace-nowrap bg-gray-100">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50 bg-white">
            {loading ? (
              <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-16 text-center">
                    <div className="flex min-h-[300px] flex-col items-center justify-center">
  <div className="relative flex items-center justify-center">
    {/* Outer Glow */}
    <div className="absolute h-32 w-32 rounded-full bg-[#A63C71]/10 blur-2xl"></div>

    {/* Static Circle */}
    <div className="absolute h-24 w-24 rounded-full border-2 border-[#A63C71]/20"></div>

    {/* Spinning Ring */}
    <div
      className="absolute h-24 w-24 rounded-full border-[3px] border-transparent border-t-[#A63C71] border-r-[#A63C71] animate-spin"
      style={{ animationDuration: "1s" }}
    ></div>

    {/* Inner Circle */}
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-[#A63C71]/10">
      <img
        src={smsLogo.src}
        alt="Loading"
        className="h-10 w-auto object-contain animate-pulse"
      />
    </div>
  </div>

  {/* Loading Text */}
  <div className="mt-8 flex flex-col items-center">
    <h3 className="text-base font-semibold tracking-wide text-[#A63C71]">
      Loading Your Data
    </h3>

    <p className="mt-1 text-sm text-gray-500">
      Please wait while we fetch the latest information...
    </p>

    {/* Animated Dots */}
    <div className="mt-5 flex gap-2">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#A63C71] [animation-delay:-0.3s]"></span>
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#A63C71] [animation-delay:-0.15s]"></span>
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#A63C71]"></span>
    </div>
  </div>
</div>
                  </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-3 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="rounded-full bg-gray-50 p-4">
                      <FiSearch className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">No records found</p>
                    <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                    {addButton && (
                      <button
                        onClick={addButton.onClick}
                        className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        + Add your first record
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              displayedData.map((row, index) => (
                <tr
                  key={index}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    transition-all duration-200
                    ${striped && index % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}
                    ${hoveredRow === index ? 'bg-blue-50/30' : ''}
                    border-b border-gray-50 last:border-0
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 text-sm text-gray-700 whitespace-nowrap ${column.className || ''}`}
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}

                  {actions && (onView || onEdit || onDelete || extraActions) && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">

                        {(() => {
                          const isEditable = typeof canEdit === 'function' ? canEdit(row) : (canEdit !== undefined ? !!canEdit : true);
                          const isDeletable = typeof canDelete === 'function' ? canDelete(row) : (canDelete !== undefined ? !!canDelete : true);

                          return (
                            <>
                              {/* VIEW */}
                              {onView && (
                                <button
                                  onClick={() => onView(row)}
                                  className="group h-9 w-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-all duration-200 hover:bg-[#0a2352] hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
                                >
                                  <FiEye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </button>
                              )}

                              {/* EDIT */}
                              {onEdit && isEditable && (
                                <button
                                  onClick={() => onEdit(row)}
                                  className="group h-9 w-9 flex items-center justify-center rounded-lg bg-gray-100 text-green-600 transition-all duration-200 hover:bg-green-600 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-95"
                                >
                                  <FiEdit className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </button>
                              )}

                              {/* DELETE */}
                              {onDelete && (
                                <button
                                  onClick={() => {
                                    if (isDeletable) onDelete(row);
                                  }}
                                  disabled={!isDeletable}
                                  className={`group h-9 w-9 flex items-center justify-center rounded-lg bg-gray-100 transition-all duration-200 ${
                                    !isDeletable
                                      ? 'text-gray-300 opacity-50 cursor-not-allowed'
                                      : 'text-red-600 hover:bg-red-500 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95'
                                  }`}
                                  title={!isDeletable ? "Cannot delete this item" : "Delete"}
                                >
                                  <FiTrash2 className={`h-4 w-4 ${isDeletable ? 'group-hover:scale-110' : ''} transition-transform`} />
                                </button>
                              )}

                        {/* EXTRA ACTIONS */}
                        {extraActions?.filter(act => !act.show || act.show(row)).map((act, idx) => {
                          const colors: Record<string, { base: string; hover: string; ring: string }> = {
                            blue:    { base: 'text-blue-600',   hover: 'hover:bg-blue-600',   ring: 'focus:ring-blue-500' },
                            green:   { base: 'text-green-600',  hover: 'hover:bg-green-600',  ring: 'focus:ring-green-500' },
                            red:     { base: 'text-red-600',    hover: 'hover:bg-red-500',    ring: 'focus:ring-red-500' },
                            orange:  { base: 'text-orange-600', hover: 'hover:bg-orange-500', ring: 'focus:ring-orange-500' },
                            purple:  { base: 'text-purple-600', hover: 'hover:bg-purple-600', ring: 'focus:ring-purple-500' },
                            emerald: { base: 'text-emerald-600', hover: 'hover:bg-emerald-500', ring: 'focus:ring-emerald-500' },
                          };
                          const c = colors[act.color || 'blue'] || colors.blue;
                          return (
                            <button
                              key={idx}
                              onClick={() => act.onClick(row)}
                              className={`group h-9 min-w-[36px] flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 border border-transparent ${c.base} ${c.hover} ${c.ring} hover:text-white hover:border-transparent px-3 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95`}
                              title={act.label}
                            >
                              {act.icon && <span className="transition-colors group-hover:text-white">{act.icon}</span>}
                              {act.label && <span className="text-xs font-semibold group-hover:text-white">{act.label}</span>}
                            </button>
                          );
                        })}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Modern Design */}
      {pagination && calculatedTotalPages > 0 && !loading && displayedData.length > 0 && (
        <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 md:px-6 py-5 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Rows</span>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setPageSizeDropdownOpen(!pageSizeDropdownOpen)}
                    className="flex items-center gap-2 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all focus:border-[#A63C71] focus:ring-1 focus:ring-[#A63C71] hover:border-[#A63C71]/50 outline-none"
                  >
                    {internalPageSize}
                    <svg className={`w-4 h-4 transition-transform ${pageSizeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {pageSizeDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-full min-w-[90px] overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl z-50">
                      {[10, 25, 50, 100].map((s) => (
                        <div
                          key={s}
                          onClick={() => {
                            setInternalPageSize(s);
                            setInternalPage(1);
                            onPageSizeChange(s);
                            setPageSizeDropdownOpen(false);
                          }}
                          className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-between ${
                            internalPageSize === s 
                              ? 'bg-[#A63C71]/10 text-[#A63C71]' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span>{s}</span>
                          {internalPageSize === s && (
                            <div className="h-1.5 w-1.5 rounded-full bg-[#A63C71]"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-gray-500 text-xs md:text-sm">
                Showing <span className="font-medium text-gray-700">{(internalPage - 1) * internalPageSize + 1}</span> to{' '}
                <span className="font-medium text-gray-700">
                  {Math.min(internalPage * internalPageSize, totalRecords)}
                </span>{' '}
                of <span className="font-medium text-gray-700">{totalRecords}</span>
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => handlePageChange(internalPage - 1)}
                disabled={internalPage === 1}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${internalPage === 1
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-sm text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${page}`}
                      onClick={() => handlePageChange(page as number)}
                      className={`inline-flex min-w-[2.5rem] h-9 items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${internalPage === page
                        ? 'bg-secondary text-white shadow-md'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => handlePageChange(internalPage + 1)}
                disabled={internalPage === calculatedTotalPages}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${internalPage === calculatedTotalPages
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}