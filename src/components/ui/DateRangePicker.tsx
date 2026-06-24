import React from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, RotateCcw } from 'lucide-react';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onReset: () => void;
  labelType?: 'top' | 'floating';
}

export default function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onReset,
  labelType = 'top',
}: DateRangePickerProps) {

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fromDateObj = parseDate(fromDate);
  const toDateObj = parseDate(toDate);

  if (labelType === 'floating') {
    return (
      <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-200 w-fit">
        <div className="flex items-center gap-4">
          <div className="relative">
            <label className="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-primary uppercase tracking-widest z-10">
              From
            </label>
            <div className="relative flex items-center w-full">
              <DatePicker
                selected={fromDateObj}
                onChange={(date) => onFromDateChange(formatDate(date))}
                selectsStart
                startDate={fromDateObj}
                endDate={toDateObj}
                placeholderText="mm/dd/yyyy"
                dateFormat="MM/dd/yyyy"
                className="pl-3 pr-8 py-2 !rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer min-w-[130px] w-full"
                wrapperClassName="w-full"
                popperProps={{ strategy: 'fixed' }}
              />
              <Calendar className="absolute right-2.5 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            </div>
          </div>
          <div className="relative">
            <label className="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-primary uppercase tracking-widest z-10">
              To
            </label>
            <div className="relative flex items-center w-full">
              <DatePicker
                selected={toDateObj}
                onChange={(date) => onToDateChange(formatDate(date))}
                selectsEnd
                startDate={fromDateObj}
                endDate={toDateObj}
                minDate={fromDateObj || undefined}
                placeholderText="mm/dd/yyyy"
                dateFormat="MM/dd/yyyy"
                className="pl-3 pr-8 py-2 !rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all cursor-pointer min-w-[130px] w-full"
                wrapperClassName="w-full"
                popperProps={{ strategy: 'fixed' }}
              />
              <Calendar className="absolute right-2.5 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          type="button"
          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-xl border border-transparent hover:border-red-100 cursor-pointer"
          title="Reset Filter"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
        <div className="w-full">
          <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
            From Date
          </label>
          <div className="relative flex items-center w-full">
            <DatePicker
              selected={fromDateObj}
              onChange={(date) => onFromDateChange(formatDate(date))}
              selectsStart
              startDate={fromDateObj}
              endDate={toDateObj}
              placeholderText="mm/dd/yyyy"
              dateFormat="MM/dd/yyyy"
              className="w-full pl-3 pr-10 !rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-black hover:border-gray-400 shadow-sm transition-all cursor-pointer h-[46px]"
              wrapperClassName="w-full"
              popperProps={{ strategy: 'fixed' }}
            />
            <Calendar className="absolute right-3.5 h-4 w-4 text-gray-500 pointer-events-none z-10" />
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-bold text-gray-700 mb-1.5 px-1">
            To Date
          </label>
          <div className="relative flex items-center w-full">
            <DatePicker
              selected={toDateObj}
              onChange={(date) => onToDateChange(formatDate(date))}
              selectsEnd
              startDate={fromDateObj}
              endDate={toDateObj}
              minDate={fromDateObj || undefined}
              placeholderText="mm/dd/yyyy"
              dateFormat="MM/dd/yyyy"
              className="w-full pl-3 pr-10 !rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-black hover:border-gray-400 shadow-sm transition-all cursor-pointer h-[46px]"
              wrapperClassName="w-full"
              popperProps={{ strategy: 'fixed' }}
            />
            <Calendar className="absolute right-3.5 h-4 w-4 text-gray-500 pointer-events-none z-10" />
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        type="button"
        className="p-3 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all rounded-xl border border-gray-200 hover:border-red-200 cursor-pointer flex items-center justify-center h-[46px] w-[46px] shrink-0"
        title="Reset Filter"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
