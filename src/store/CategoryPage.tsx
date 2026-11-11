import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, ChevronRight } from 'lucide-react';
import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from './data/sampleProducts';
import { useProductFilters } from './hooks/useProductFilters';
import { AnnouncementBar } from './AnnouncementBar';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';
import { FilterPanel } from './components/FilterPanel';
import { FilterDrawer } from './components/FilterDrawer';
import { ProductGrid } from './components/ProductGrid';
import { SortSelect } from './components/SortSelect';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const category = SAMPLE_CATEGORIES.find((c) => c.slug === slug);
  const isAll = slug === 'all' || !category;
  const categoryName = category ? category.name : 'All Products';

  const categoryProducts = isAll
    ? SAMPLE_PRODUCTS
    : SAMPLE_PRODUCTS.filter((p) => p.categorySlug === slug);

  const {
    filters,
    setFilter,
    clearFilters,
    filteredProducts,
    allSizes,
    allColours,
  } = useProductFilters(categoryProducts);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#C0392B]/10 selection:text-[#C0392B]">
      <AnnouncementBar />
      <StoreHeader activeCategorySlug={category?.slug} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link to="/store" className="hover:text-slate-800">Store</Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">{categoryName}</span>
        </nav>

        {/* Title Bar & Mobile Filter Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a2e4a] tracking-tight">
              {categoryName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} in stock
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50"
            >
              <SlidersHorizontal size={14} className="text-[#C0392B]" />
              <span>Filters</span>
            </button>
            <SortSelect
              value={filters.sort}
              onChange={(val) => setFilter('sort', val)}
            />
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="flex gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 bg-white border border-slate-200 rounded-lg p-5 shadow-xs sticky top-28">
            <FilterPanel
              filters={filters}
              onFilterChange={setFilter}
              onClearFilters={clearFilters}
              availableSizes={allSizes}
              availableColours={allColours}
            />
          </aside>

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0">
            <ProductGrid
              products={filteredProducts}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </main>

      {/* Mobile Drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        availableSizes={allSizes}
        availableColours={allColours}
        productCount={filteredProducts.length}
      />

      <StoreFooter />
    </div>
  );
};

export default CategoryPage;
