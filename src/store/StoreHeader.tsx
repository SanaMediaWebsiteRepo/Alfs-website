import React, { useState } from 'react';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SAMPLE_CATEGORIES } from './data/sampleProducts';
import { useCart } from './context/CartContext';

interface StoreHeaderProps {
  activeCategorySlug?: string;
  initialQuery?: string;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({ activeCategorySlug, initialQuery = '' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const { totalItems, openMiniCart } = useCart();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/store/search?q=${encodeURIComponent(query.trim())}` : '/store/search');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 sm:gap-6">
          <Link to="/store" className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1a2e4a] leading-none">
                ALFS<span className="text-[#C0392B]">STORE</span>
              </span>
              <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase mt-0.5">
                Workwear &amp; Safety PPE
              </span>
            </div>
          </Link>

          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl mx-2 hidden sm:block">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search safety boots, conti suits, hard hats..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#1a2e4a] focus:bg-white"
              />
            </div>
          </form>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-[#1a2e4a] hover:bg-slate-100 rounded-md text-xs font-semibold">
              <User size={20} className="text-[#1a2e4a]" />
              <span className="hidden md:inline">Account</span>
            </button>

            <button
              type="button"
              onClick={openMiniCart}
              className="relative flex items-center gap-2 px-3 py-2 text-slate-700 hover:text-[#1a2e4a] hover:bg-slate-100 rounded-md text-xs font-semibold cursor-pointer"
              aria-label="Open mini cart"
            >
              <div className="relative">
                <ShoppingCart size={20} className="text-[#1a2e4a]" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#C0392B] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">Cart</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-[#1a2e4a] rounded-md"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="pb-3 sm:hidden">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gear, boots, PPE..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#1a2e4a]"
            />
          </div>
        </form>
      </div>

      <nav className="hidden md:block bg-[#1a2e4a] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
            <Link to="/store/search" className={`px-3 py-2 font-medium rounded transition-colors whitespace-nowrap ${!activeCategorySlug ? 'bg-[#C0392B] text-white font-semibold' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}>
              All Products
            </Link>
            {SAMPLE_CATEGORIES.map((cat) => (
              <Link key={cat.id} to={`/store/category/${cat.slug}`} className={`px-3 py-2 font-medium rounded transition-colors whitespace-nowrap ${activeCategorySlug === cat.slug ? 'bg-[#C0392B] text-white font-semibold' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}>
                {cat.name}
              </Link>
            ))}
          </div>
          <span className="text-[11px] text-white/70 tracking-wide font-medium shrink-0 pl-4">Direct Trade Supply</span>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-white px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/store/search" onClick={() => setMobileMenuOpen(false)} className="text-left py-2 px-2.5 text-xs rounded bg-white/5 hover:bg-[#C0392B] transition-colors">
              All Products
            </Link>
            {SAMPLE_CATEGORIES.map((cat) => (
              <Link key={cat.id} to={`/store/category/${cat.slug}`} onClick={() => setMobileMenuOpen(false)} className="text-left py-2 px-2.5 text-xs rounded bg-white/5 hover:bg-[#C0392B] transition-colors truncate">
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
