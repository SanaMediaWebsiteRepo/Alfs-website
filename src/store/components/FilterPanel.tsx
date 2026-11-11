import React from 'react';
import { FilterState } from '../hooks/useProductFilters';
import { RotateCcw } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  availableSizes: string[];
  availableColours: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  availableSizes,
  availableColours,
}) => {
  const hasActiveFilters = Boolean(
    filters.minPrice || filters.maxPrice || filters.size || filters.colour
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-sm font-bold text-[#1a2e4a] uppercase tracking-wider">
          Filter Gear
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-[#C0392B] hover:underline"
          >
            <RotateCcw size={12} />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 mb-2">Price Range (K)</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Min (Kwacha)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded font-mono focus:outline-none focus:border-[#1a2e4a]"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Max (Kwacha)</label>
            <input
              type="number"
              placeholder="2500"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-300 rounded font-mono focus:outline-none focus:border-[#1a2e4a]"
            />
          </div>
        </div>
      </div>

      {/* Size Filter (if available) */}
      {availableSizes.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">Select Size</h4>
          <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((s) => {
              const active = filters.size === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onFilterChange('size', active ? '' : s)}
                  className={`text-xs py-1.5 px-2.5 rounded font-medium border transition-colors ${
                    active
                      ? 'bg-[#1a2e4a] text-white border-[#1a2e4a]'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colour Filter (if available) */}
      {availableColours.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-800 mb-2">Select Colour</h4>
          <div className="flex flex-wrap gap-1.5">
            {availableColours.map((c) => {
              const active = filters.colour === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onFilterChange('colour', active ? '' : c)}
                  className={`text-xs py-1.5 px-2.5 rounded font-medium border transition-colors ${
                    active
                      ? 'bg-[#C0392B] text-white border-[#C0392B]'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
