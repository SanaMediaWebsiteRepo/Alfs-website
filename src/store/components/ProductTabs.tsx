import React, { useState } from 'react';
import { SampleProduct } from '../data/sampleProducts';
import { CheckCircle2, Truck } from 'lucide-react';

interface ProductTabsProps {
  product: SampleProduct;
}

export const ProductTabs: React.FC<ProductTabsProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'details' | 'delivery'>('desc');

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-8 shadow-xs">
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => setActiveTab('desc')}
          className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'desc'
              ? 'border-[#C0392B] text-[#C0392B] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Description
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-[#C0392B] text-[#C0392B] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Details &amp; Spec
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`py-3.5 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'delivery'
              ? 'border-[#C0392B] text-[#C0392B] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Delivery
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-6">
        {activeTab === 'desc' && (
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed max-w-2xl">
            <p>{product.description}</p>
            <p className="text-xs text-slate-500">
              Complies with SABS and international industrial occupational safety standards for commercial worksites in Zambia.
            </p>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Key Technical Features:
            </h4>
            <ul className="space-y-2">
              {product.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 size={16} className="text-[#C0392B] shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-3 text-xs text-slate-700 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1a2e4a]">
              <Truck size={18} className="text-[#C0392B]" />
              <span>Delivery Information</span>
            </div>
            <p className="leading-relaxed">
              Delivery available, fee depends on location. Shipping fee is calculated and added at checkout depending on project site distance from our Lusaka or Chingola depots.
            </p>
            <p className="text-slate-500">
              Standard lead time for site dispatch is 2–3 business days from order confirmation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
