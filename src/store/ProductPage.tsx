import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Lock, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { CONTRACTOR_PRICE_VISIBLE_TO_ALL } from '../config/features';
import { AnnouncementBar } from './AnnouncementBar';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';
import { ProductGallery } from './components/ProductGallery';
import { ProductOptions } from './components/ProductOptions';
import { ProductTabs } from './components/ProductTabs';
import { RelatedProducts } from './components/RelatedProducts';

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const product = SAMPLE_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <AnnouncementBar />
        <StoreHeader />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-black text-[#1a2e4a] mb-3">Product Not Found</h1>
          <p className="text-xs text-slate-500 mb-6">The requested product could not be located in our catalogue.</p>
          <Link
            to="/store"
            className="inline-block bg-[#1a2e4a] text-white py-3 px-6 rounded text-xs font-bold uppercase tracking-wider"
          >
            Back to Online Store
          </Link>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#C0392B]/10 selection:text-[#C0392B]">
      <AnnouncementBar />
      <StoreHeader activeCategorySlug={product.categorySlug} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link to="/store" className="hover:text-slate-800">Store</Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link to={`/store/category/${product.categorySlug}`} className="hover:text-slate-800">
            {product.category}
          </Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Hero 2-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Gallery left */}
          <div className="lg:col-span-6 bg-white p-4 sm:p-6 border border-slate-200 rounded-lg shadow-xs">
            <ProductGallery product={product} />
          </div>

          {/* Details right */}
          <div className="lg:col-span-6 bg-white p-5 sm:p-7 border border-slate-200 rounded-lg shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-[#C0392B] uppercase tracking-wider">
                {product.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1a2e4a] tracking-tight leading-snug mt-1">
                {product.name}
              </h1>
            </div>

            {/* Pricing block */}
            <div className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-slate-500 font-semibold">Retail Price:</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {product.normalPrice}
                </span>
              </div>

              {CONTRACTOR_PRICE_VISIBLE_TO_ALL ? (
                <div className="flex items-center justify-between text-xs text-[#1a2e4a] pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Lock size={13} className="text-[#C0392B]" /> Contractor Trade Price:
                  </span>
                  <span className="text-lg font-black text-[#C0392B] font-mono">
                    {product.contractorPrice}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200">
                  <Lock size={12} className="text-slate-400" />
                  <span>Sign up as a contractor to see your price</span>
                </div>
              )}
            </div>

            {/* Lead Time Badge */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 py-1.5 px-3 rounded">
              <Clock size={14} className="text-[#1a2e4a]" />
              <span>Lead time: {product.leadTime}</span>
            </div>

            {/* Interactive Options, Stepper, & Actions */}
            <ProductOptions product={product} />
          </div>
        </div>

        {/* Tabs: Description, Details, Delivery */}
        <ProductTabs product={product} />

        {/* Small "Become a contractor" banner */}
        <div className="mt-8 bg-[#1a2e4a] text-white p-5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-[#C0392B] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Contractor? Unlock 15% discount on all orders</h4>
              <p className="text-xs text-slate-300">Register your team for trade terms, volume rates, and priority site dispatch.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="bg-[#C0392B] hover:bg-[#a82e21] text-white py-2.5 px-5 rounded text-xs font-bold uppercase tracking-wider shrink-0 transition-colors flex items-center gap-1.5"
          >
            <span>Become a contractor</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Related Products */}
        <RelatedProducts
          currentProductId={product.id}
          categorySlug={product.categorySlug}
        />
      </main>

      <StoreFooter />
    </div>
  );
};

export default ProductPage;
