import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, Search, X, BookOpen, ExternalLink } from 'lucide-react';
import { useProducts, Product } from '../hooks/useProducts';
import ProductCard from './ProductCard';
import ProductDetail from './ProductDetail';
import BottomSheet from './BottomSheet';
import { CartItem } from './CartPanel';

interface CatalogueSectionProps {
  onWhatsAppChat: (message: string) => void;
  externalCategory?: string;
  onCategoryChange?: (category: string) => void;
  cartItems?: CartItem[];
  onAddToCart?: (product: Product, quantity?: number, colour?: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  conti: 'Conti Suits',
  boiler: 'Boiler Suits',
  hivis: 'Hi-Vis',
  ppe: 'PPE',
  footwear: 'Footwear',
  headwear: 'Headwear',
  hospitality: 'Hospitality',
  safety: 'Safety',
  security: 'Security',
  leisure: 'Leisurewear',
  corporate: 'Corporate',
  workwear: 'Workwear',
  general: 'General',
};

const TRADE_PPE_CATEGORIES: { label: string; key: string; categories: string[] }[] = [
  { label: 'Structural & Welding', key: 'trade_structural', categories: ['ppe', 'safety', 'headwear', 'footwear', 'workwear'] },
  { label: 'Electrical Works', key: 'trade_electrical', categories: ['ppe', 'safety', 'hivis', 'footwear', 'headwear'] },
  { label: 'Civil Works', key: 'trade_civil', categories: ['ppe', 'hivis', 'footwear', 'headwear', 'safety', 'workwear'] },
  { label: 'Mechanical Works', key: 'trade_mechanical', categories: ['ppe', 'safety', 'footwear', 'workwear', 'headwear'] },
  { label: 'Plumbing Works', key: 'trade_plumbing', categories: ['ppe', 'safety', 'footwear', 'workwear'] },
  { label: 'HVAC Works', key: 'trade_hvac', categories: ['ppe', 'safety', 'footwear', 'workwear', 'headwear'] },
  { label: 'Plant Operators', key: 'trade_plant', categories: ['ppe', 'hivis', 'headwear', 'footwear', 'safety'] },
  { label: 'HSE & Safety', key: 'trade_hse', categories: ['safety', 'ppe', 'hivis', 'headwear', 'footwear'] },
  { label: 'General Labour', key: 'trade_general', categories: ['conti', 'boiler', 'hivis', 'footwear', 'workwear', 'general'] },
  { label: 'Security', key: 'trade_security', categories: ['security', 'footwear', 'headwear'] },
  { label: 'Corporate & Admin', key: 'trade_corporate', categories: ['corporate', 'footwear', 'leisure'] },
  { label: 'Hospitality', key: 'trade_hospitality', categories: ['hospitality', 'footwear', 'leisure'] },
];

export default function CatalogueSection({
  onWhatsAppChat,
  externalCategory,
  onCategoryChange,
  cartItems = [],
  onAddToCart,
}: CatalogueSectionProps) {
  const {
    filteredProducts,
    products,
    loading,
    error,
    activeCategory: internalCategory,
    setActiveCategory: setInternalCategory,
    activeSupplier,
    setActiveSupplier,
    searchQuery,
    setSearchQuery,
    categories,
    sheetConnected,
    dataSource,
  } = useProducts();

  const activeCategory = externalCategory || internalCategory;
  const setActiveCategory = (cat: string) => {
    setInternalCategory(cat);
    onCategoryChange?.(cat);
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(48);
  const [activeTradeFilter, setActiveTradeFilter] = useState<string | null>(null);

  const slicedProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(48);
  }, [activeCategory, activeSupplier, searchQuery, activeTradeFilter]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddToCart = useCallback((product: Product, quantity = 1, colour?: string) => {
    onAddToCart?.(product, quantity, colour);
  }, [onAddToCart]);

  const handleRequestQuote = (product: Product) => {
    onWhatsAppChat(
      `Hello ALFS! I'm interested in the *${product.name}* (ID: ${product.id}). Could you please send me a quote?`
    );
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    if (isMobile) {
      setIsBottomSheetOpen(true);
    } else {
      setIsDetailOpen(true);
    }
  };

  const handleNavigateProduct = (direction: 'prev' | 'next') => {
    if (!selectedProduct) return;
    const idx = filteredProducts.findIndex(
      (p) => p.id === selectedProduct.id && p.supplier === selectedProduct.supplier
    );
    if (idx === -1) return;
    let next = direction === 'next' ? idx + 1 : idx - 1;
    if (next < 0) next = filteredProducts.length - 1;
    if (next >= filteredProducts.length) next = 0;
    setSelectedProduct(filteredProducts[next]);
  };

  const clearAll = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveSupplier('all');
  };

  return (
    <section id="catalogue" className="py-20 md:py-32 bg-alfs-grey">
      <div className="container mx-auto px-4 md:px-10">

        {/* Header */}
        <div className="mb-10 md:mb-14">
          <span className="text-alfs-blue text-[11px] font-black uppercase tracking-[0.5em] mb-4 block border-l-4 border-alfs-red pl-5">
            SALTY · VULCAN · JAVLIN
          </span>
          {/* VIEW FLIPBOOK BUTTON */}
          <div className="mb-6 flex flex-wrap gap-2.5">
            <a
              href="https://heyzine.com/flip-book/c7c36aaeca.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white hover:bg-[#C0392B] px-4.5 py-2.5 rounded-xl font-sans font-semibold uppercase tracking-[0.15em] text-[11px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              id="view-flipbook-catalogue-btn"
            >
              <BookOpen size={14} />
              <span>View Altitude Flipbook</span>
              <ExternalLink size={12} className="opacity-85" />
            </a>
            <a
              href="https://heyzine.com/flip-book/19c2f9f913.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white hover:bg-[#C0392B] px-4.5 py-2.5 rounded-xl font-sans font-semibold uppercase tracking-[0.15em] text-[11px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              id="view-vulcan-flipbook-btn"
            >
              <BookOpen size={14} />
              <span>View Vulcan Flipbook</span>
              <ExternalLink size={12} className="opacity-85" />
            </a>
            <a
              href="https://heyzine.com/flip-book/9812e6d298.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white hover:bg-[#C0392B] px-4.5 py-2.5 rounded-xl font-sans font-semibold uppercase tracking-[0.15em] text-[11px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              id="view-salty-flipbook-btn"
            >
              <BookOpen size={14} />
              <span>View Salty Flipbook</span>
              <ExternalLink size={12} className="opacity-85" />
            </a>
            <a
              href="https://heyzine.com/flip-book/f2a558e5d4.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white hover:bg-[#C0392B] px-4.5 py-2.5 rounded-xl font-sans font-semibold uppercase tracking-[0.15em] text-[11px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              id="view-javlin-workwear-flipbook-btn"
            >
              <BookOpen size={14} />
              <span>View Javlin Workwear Flipbook</span>
              <ExternalLink size={12} className="opacity-85" />
            </a>
            <a
              href="https://heyzine.com/flip-book/cd0f5bcf60.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1B2A4A] text-white hover:bg-[#C0392B] px-4.5 py-2.5 rounded-xl font-sans font-semibold uppercase tracking-[0.15em] text-[11px] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
              id="view-javlin-ppe-flipbook-btn"
            >
              <BookOpen size={14} />
              <span>View Javlin PPE Flipbook</span>
              <ExternalLink size={12} className="opacity-85" />
            </a>
          </div>
          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bebas text-alfs-black leading-none uppercase">
            THE CATALOGUE
          </h2>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="mb-8 max-w-2xl">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or item code..."
              autoComplete="off"
              name="product-search-no-autofill"
              data-lpignore="true"
              data-1p-ignore="true"
              className="w-full pl-12 pr-12 py-3.5 text-sm font-semibold rounded-2xl border border-slate-300 bg-white shadow-xs outline-none focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-alfs-red p-1 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-alfs-blue">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Active category indicator when filtered from specialization cards */}
        {activeCategory !== 'all' && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Filtered by:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1B2A4A] text-white">
              {CATEGORY_LABELS[activeCategory] || activeCategory}
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setActiveTradeFilter(null);
                }}
                className="hover:text-red-300 p-0.5 rounded-full transition-colors"
                title="Clear category filter"
              >
                <X size={12} />
              </button>
            </span>
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveTradeFilter(null);
              }}
              className="text-xs font-medium text-[#C0392B] hover:underline ml-1"
            >
              Show all products
            </button>
          </div>
        )}

        {/* Trade-based PPE filter row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {TRADE_PPE_CATEGORIES.map((trade) => (
            <button
              key={trade.key}
              onClick={() => {
                if (activeTradeFilter === trade.key) {
                  setActiveTradeFilter(null);
                  setActiveCategory('all');
                } else {
                  setActiveTradeFilter(trade.key);
                  setActiveCategory(trade.categories[0]);
                }
              }}
              className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                activeTradeFilter === trade.key
                  ? 'bg-[#C0392B] text-white border-[#C0392B] shadow-sm'
                  : 'bg-white text-[#1B2A4A] border-slate-200/90 hover:border-[#C0392B] hover:text-[#C0392B] shadow-xs'
              }`}
            >
              {trade.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-alfs-red mb-4" />
              <p className="text-alfs-text font-bold uppercase tracking-widest text-sm">Loading products...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-8 text-center">
            <p className="text-red-800 font-bold uppercase tracking-widest">Error: {error}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <p className="text-3xl font-bebas text-alfs-black">No Products Found</p>
                <p className="text-alfs-text font-bold uppercase tracking-widest text-sm">
                  Try a different name or item code
                </p>
                <button
                  onClick={clearAll}
                  className="mt-2 bg-alfs-red text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-alfs-red-hover transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-16">
                {/* branded collections */}
                {['SALTY', 'JAVLIN', 'VULCAN'].map((brand) => {
                  const brandProducts = slicedProducts.filter(p => p.supplier === brand);
                  if (brandProducts.length === 0) return null;

                  return (
                    <div key={brand} className="scroll-mt-32">
                      <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-3xl font-bebas text-alfs-black tracking-tight">
                          {brand} <span className="text-alfs-red">COLLECTION</span>
                        </h3>
                        <div className="h-[2px] flex-grow bg-alfs-black/5" />
                        <span className="text-[10px] font-black text-alfs-text/40 tracking-widest uppercase">
                          {brandProducts.length} Items
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        <AnimatePresence mode="popLayout">
                          {brandProducts.map((product) => (
                            <ProductCard
                              key={`${product.supplier}:${product.id}`}
                              product={product}
                              onRequestQuote={handleRequestQuote}
                              onViewDetails={handleViewDetails}
                              onAddToCart={(p) => handleAddToCart(p, 1)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
                
                {/* General/Other Collections */}
                {(() => {
                  const priorityBrands = ['SALTY', 'JAVLIN', 'VULCAN'];
                  const otherProducts = slicedProducts.filter(p => !priorityBrands.includes(p.supplier));
                  if (otherProducts.length === 0) return null;
                  
                  return (
                    <div className="scroll-mt-32">
                      <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-3xl font-bebas text-alfs-black tracking-tight">
                          GENERAL <span className="text-alfs-red">COLLECTION</span>
                        </h3>
                        <div className="h-[2px] flex-grow bg-alfs-black/5" />
                        <span className="text-[10px] font-black text-alfs-text/40 tracking-widest uppercase">
                          {otherProducts.length} Items
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        <AnimatePresence mode="popLayout">
                          {otherProducts.map((product) => (
                            <ProductCard
                              key={`${product.supplier}:${product.id}`}
                              product={product}
                              onRequestQuote={handleRequestQuote}
                              onViewDetails={handleViewDetails}
                              onAddToCart={(p) => handleAddToCart(p, 1)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {filteredProducts.length > visibleCount && (
              <div className="flex justify-center mt-12 mb-6 border-t border-alfs-black/5 pt-12">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 48)}
                  className="bg-alfs-blue text-white px-8 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-alfs-blue/90 shadow-md transition-all active:scale-95"
                >
                  Load More
                </button>
              </div>
            )}

            {filteredProducts.length > 0 && filteredProducts.length <= visibleCount && (
              <div className="mt-16 text-center opacity-30">
                <div className="inline-block h-[1px] w-24 bg-alfs-black mb-4 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-alfs-text">
                  End of Collection
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product detail modal */}
      <ProductDetail
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRequestQuote={handleRequestQuote}
        onNavigate={handleNavigateProduct}
        hasNavigation={filteredProducts.length > 1}
        onAddToCart={handleAddToCart}
      />

      {/* Product bottom sheet for mobile */}
      <BottomSheet
        product={selectedProduct}
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onAddToCart={handleAddToCart}
      />


    </section>
  );
}
