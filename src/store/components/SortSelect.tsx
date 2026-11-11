import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortSelect: React.FC<SortSelectProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="store-sort" className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
        <ArrowUpDown size={14} className="text-slate-400" />
        <span>Sort by:</span>
      </label>
      <select
        id="store-sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-semibold bg-white border border-slate-300 rounded-md py-2 px-3 text-slate-800 focus:outline-none focus:border-[#1a2e4a] cursor-pointer shadow-2xs"
      >
        <option value="name_asc">Name: A to Z</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
      </select>
    </div>
  );
};
