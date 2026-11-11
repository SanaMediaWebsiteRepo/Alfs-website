import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { ProductCard } from './ProductCard';

export const ProductRow: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section id="new-products" className="py-8 sm:py-12 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a2e4a] tracking-tight">
              New products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Certified industrial safety workwear &amp; site gear
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
        >
          {SAMPLE_PRODUCTS.slice(0, 8).map((p) => (
            <div
              key={p.id}
              className="min-w-[260px] sm:min-w-[280px] max-w-[280px] shrink-0 snap-start"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
