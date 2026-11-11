import React from 'react';
import { X, Check } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { FilterState } from '../hooks/useProductFilters';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  availableSizes: string[];
  availableColours: string[];
  productCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
  availableSizes,
  availableColours,
  productCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[#1a2e4a]">Filters</span>
            <span className="text-xs text-slate-500 font-medium">
              ({productCount} {productCount === 1 ? 'product' : 'products'})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          <FilterPanel
            filters={filters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            availableSizes={availableSizes}
            availableColours={availableColours}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button
            type="button"
            onClick={onClearFilters}
            className="flex-1 py-3 px-4 border border-slate-300 bg-white text-slate-700 text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-100"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-[#1a2e4a] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#15253c] flex items-center justify-center gap-1.5"
          >
            <Check size={16} />
            <span>Apply ({productCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
