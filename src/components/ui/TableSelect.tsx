import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X, Plus } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function useDropdownPosition(ref: React.RefObject<any>, isOpen: boolean) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  return coords;
}

interface TableSelectProps {
  value: string;
  onChange: (value: string) => void;
  onCreateOption?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  creatable?: boolean;
}

export const TableSelect: React.FC<TableSelectProps> = ({
  value,
  onChange,
  onCreateOption,
  options,
  placeholder = "Select option...",
  disabled = false,
  isClearable = true,
  creatable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const coords = useDropdownPosition(triggerRef, isOpen);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById(`portal-tableselect`);
        if (portal && portal.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setSearchQuery("");
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleCreate = (val: string) => {
    const clean = val.trim();
    if (!clean) return;
    if (onCreateOption) {
      onCreateOption(clean);
    } else {
      onChange(clean);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const filteredOptions = options.filter(o => 
    (o.label || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasExactMatch = options.some(
    o => (o.label || "").toLowerCase().trim() === searchQuery.toLowerCase().trim()
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchQuery.trim()) {
        const exact = filteredOptions.find(
          o => (o.label || "").toLowerCase().trim() === searchQuery.toLowerCase().trim()
        );
        if (exact) {
          handleSelect(exact);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0]);
        } else if (creatable) {
          handleCreate(searchQuery);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const triggerClasses = `
    w-full flex items-center justify-between
    text-sm px-3 py-2 min-h-[38px]
    outline-none border
    bg-white rounded-md
    transition-colors
    select-none
    ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "cursor-pointer hover:border-gray-300"}
    ${isOpen ? "border-gray-300 ring-1 ring-gray-300" : "border-gray-200"}
  `;

  return (
    <div className="w-full relative">
      <div
        ref={triggerRef}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        className={triggerClasses}
      >
        <span className={`block truncate ${selected || value ? "text-gray-900" : "text-gray-400"}`}>
          {selected ? selected.label : (value || placeholder)}
        </span>
        <div className="flex items-center gap-1">
          {isClearable && (selected || value) && !disabled && (
            <X 
              size={14} 
              className="text-gray-400 hover:text-red-500 transition-colors" 
              onClick={handleClear} 
            />
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          id="portal-tableselect"
          className="fixed z-[9999]"
          style={{
            top: `${coords.top + 2}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`
          }}
        >
          <div className="bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type or search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
              {creatable && searchQuery.trim() && !hasExactMatch && (
                <li
                  onClick={() => handleCreate(searchQuery)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-secondary font-medium hover:bg-blue-50 cursor-pointer border-b border-gray-100 bg-blue-50/50"
                >
                  <Plus size={14} className="text-secondary flex-shrink-0" />
                  <span className="truncate">Add &quot;{searchQuery.trim()}&quot;</span>
                </li>
              )}
              {filteredOptions.length === 0 && (!creatable || !searchQuery.trim()) ? (
                <li className="px-3 py-2 text-sm text-gray-400 text-center">
                  {searchQuery.trim() ? "No options found" : "Type to add new option..."}
                </li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <li
                      key={option.value}
                      onClick={() => handleSelect(option)}
                      className={`
                        flex items-center justify-between px-3 py-1.5 text-sm transition-colors
                        ${option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
                        ${isSelected ? "bg-blue-50 text-secondary font-medium" : "text-gray-700"}
                      `}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check size={14} className="text-secondary flex-shrink-0 ml-2" />}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
