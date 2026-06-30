import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  value: string;
  onChange: (time24: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CustomTimePicker({ value, onChange, className = '', placeholder = '--:-- --' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hh: '', mm: '', ap: '' };
    const [h, m] = timeStr.split(':');
    if (!h || !m) return { hh: '', mm: '', ap: '' };
    let hour = parseInt(h, 10);
    const ap = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return { hh: hour.toString().padStart(2, '0'), mm: m.padStart(2, '0'), ap };
  };

  const { hh, mm, ap } = parseTime(value);

  const displayString = hh && mm && ap ? `${hh}:${mm} ${ap}` : '';

  const handleSelect = (type: 'hh' | 'mm' | 'ap', val: string) => {
    let newHh = hh || '12';
    let newMm = mm || '00';
    let newAp = ap || 'PM';

    if (type === 'hh') newHh = val;
    if (type === 'mm') newMm = val;
    if (type === 'ap') newAp = val;

    let h24 = parseInt(newHh, 10);
    if (newAp === 'PM' && h24 !== 12) h24 += 12;
    if (newAp === 'AM' && h24 === 12) h24 = 0;

    const time24 = `${h24.toString().padStart(2, '0')}:${newMm.toString().padStart(2, '0')}`;
    onChange(time24);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const ampm = ['AM', 'PM'];

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={`flex items-center justify-between w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white cursor-pointer transition-all ${isOpen ? 'ring-1 ring-[#A63C71] border-[#A63C71]' : 'hover:border-gray-400'} ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayString ? 'text-gray-900' : 'text-gray-400'}>
          {displayString || placeholder}
        </span>
        <Clock size={16} className="text-gray-500" />
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1 z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex h-64">
          
          {/* Hours Column */}
          <div className="flex-1 border-r border-gray-100 overflow-y-auto no-scrollbar scroll-smooth">
            {hours.map(h => (
              <div 
                key={h}
                onClick={() => handleSelect('hh', h)}
                className={`py-2 text-center text-sm cursor-pointer transition-colors ${hh === h ? 'bg-[#A63C71] text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Minutes Column */}
          <div className="flex-1 border-r border-gray-100 overflow-y-auto no-scrollbar scroll-smooth">
            {minutes.map(m => (
              <div 
                key={m}
                onClick={() => handleSelect('mm', m)}
                className={`py-2 text-center text-sm cursor-pointer transition-colors ${mm === m ? 'bg-[#A63C71] text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {m}
              </div>
            ))}
          </div>

          {/* AM/PM Column */}
          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-gray-50/50">
            {ampm.map(a => (
              <div 
                key={a}
                onClick={() => handleSelect('ap', a)}
                className={`py-3 text-center text-sm cursor-pointer transition-colors ${ap === a ? 'bg-[#A63C71] text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
