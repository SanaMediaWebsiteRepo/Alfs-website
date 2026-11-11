import React, { useState } from 'react';
import { SampleProduct } from '../data/sampleProducts';
import { ProductCard } from '../ProductCard';
import { PackageX, RotateCcw } from 'lucide-react';

interface ProductGridProps {
  products: SampleProduct[];
  onClearFilters: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onClearFilters,
}) => {
  const [visibleCount, setVisibleCount] = useState(12);

  if (products.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 sm:p-16 text-center flex flex-col items-center justify-center my-6">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <PackageX size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          No products match your filters
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          Try expanding your price range, choosing different sizes, or resetting all search options.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 bg-[#1a2e4a] hover:bg-[#15253c] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <RotateCcw size={14} />
          <span>Clear filters</span>
        </button>
      </div>
    );
  }

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = products.length > visibleCount;

  return (
    <div>
      {/* 2 cols mobile, 3 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="bg-white border-2 border-[#1a2e4a] text-[#1a2e4a] hover:bg-[#1a2e4a] hover:text-white px-8 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs active:scale-98"
          >
            Load more ({products.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
