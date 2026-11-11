import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ProductSearch({ searchQuery, onSearchChange }: ProductSearchProps) {
  return (
    <div className="mb-12 relative max-w-xl">
      <div className="relative flex items-center">
        <Search className="absolute left-6 text-alfs-black/20" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="SEARCH BY NAME, SPEC OR ID..."
          className="w-full bg-alfs-grey border-2 border-transparent focus:border-alfs-red/30 p-6 pl-16 text-xs font-black uppercase tracking-widest outline-none transition-all placeholder:text-alfs-black/20"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-6 text-alfs-black/40 hover:text-alfs-red transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="absolute top-full left-0 mt-2">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-alfs-black/40">
          Showing results for technical specifications & industrial IDs
        </span>
      </div>
    </div>
  );
}
