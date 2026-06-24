import React from 'react';
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
  if (labelType === 'floating') {
    return (
      <div className="flex items-center gap-3 bg-gray-50/50 p-2 rounded-2xl border border-gray-200 w-fit">
        <div className="flex items-center gap-4">
          <div className="relative">
            <label className="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-blue-600 uppercase tracking-widest z-10">
              From
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none min-w-[130px]"
              />
              <Calendar className="absolute right-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="relative">
            <label className="absolute -top-2.5 left-3 px-1 bg-white text-[9px] font-bold text-blue-600 uppercase tracking-widest z-10">
              To
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => onToDateChange(e.target.value)}
                className="pl-3 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none min-w-[130px]"
              />
              <Calendar className="absolute right-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
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

  // Default 'top' label view as seen in the second image
  return (
    <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
        <div className="space-y-1.5 w-full">
          <label className="block text-sm font-semibold text-sky-950">
            From Date
          </label>
          <div className="relative flex items-center w-full">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-blue-700 hover:border-gray-400 transition-all cursor-pointer"
            />
            <Calendar className="absolute right-3.5 h-4 w-4 text-gray-700 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5 w-full">
          <label className="block text-sm font-semibold text-sky-950">
            To Date
          </label>
          <div className="relative flex items-center w-full">
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-sm font-semibold text-gray-700 outline-none focus:border-blue-700 hover:border-gray-400 transition-all cursor-pointer"
            />
            <Calendar className="absolute right-3.5 h-4 w-4 text-gray-700 pointer-events-none" />
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
