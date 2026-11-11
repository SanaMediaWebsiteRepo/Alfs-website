import React from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Clock,
  MessageCircle,
  Footprints,
  Shirt,
  HardHat,
  HandMetal,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { SampleProduct } from './data/sampleProducts';
import { CONTRACTOR_PRICE_VISIBLE_TO_ALL } from '../config/features';

interface ProductCardProps {
  product: SampleProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getPlaceholderIcon = (iconName: SampleProduct['iconName']) => {
    switch (iconName) {
      case 'footwear': return <Footprints size={34} className="text-[#1a2e4a]/60" />;
      case 'workwear': return <Shirt size={34} className="text-[#1a2e4a]/60" />;
      case 'head': return <HardHat size={34} className="text-[#1a2e4a]/60" />;
      case 'hand': return <HandMetal size={34} className="text-[#1a2e4a]/60" />;
      case 'hivis': return <ShieldAlert size={34} className="text-[#1a2e4a]/60" />;
      case 'eye': return <Eye size={34} className="text-[#1a2e4a]/60" />;
      default: return <HardHat size={34} className="text-[#1a2e4a]/60" />;
    }
  };

  const openWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `Hi ALFS! I would like to enquire about: ${product.name} (${product.normalPrice}). Please confirm availability and delivery options.`;
    window.open(`https://wa.me/260962334797?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Link
      to={`/store/product/${product.id}`}
      className="group bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 flex flex-col justify-between transition-all hover:border-[#1a2e4a] hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Placeholder Image Box */}
        <div className="w-full h-40 sm:h-44 bg-slate-100 border border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center p-3 text-center mb-3 group-hover:bg-slate-50 transition-colors">
          {getPlaceholderIcon(product.iconName)}
          <span className="text-[11px] font-bold text-slate-700 mt-2 line-clamp-1">
            {product.category}
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
            ALFS Standard Spec
          </span>
        </div>

        <div className="text-[10px] font-bold text-[#C0392B] uppercase tracking-wider mb-1">
          {product.category}
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1a2e4a] transition-colors mb-2">
          {product.name}
        </h3>
      </div>

      <div className="pt-2 border-t border-slate-100">
        {/* Retail Price */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[11px] text-slate-500 font-medium">Retail Price:</span>
          <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
            {product.normalPrice}
          </span>
        </div>

        {/* Contractor Price Condition */}
        <div className="mb-2 bg-slate-50 p-1.5 sm:p-2 rounded border border-slate-100">
          {CONTRACTOR_PRICE_VISIBLE_TO_ALL ? (
            <div className="flex items-center justify-between text-xs text-[#1a2e4a]">
              <span className="flex items-center gap-1 font-semibold text-[11px]">
                <Lock size={12} className="text-[#C0392B]" /> Contractor:
              </span>
              <span className="font-black text-[#C0392B] font-mono text-xs sm:text-sm">
                {product.contractorPrice}
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-600 flex items-center gap-1">
              <Lock size={11} className="text-slate-400 shrink-0" />
              <span className="leading-tight">Sign up as a contractor to see your price</span>
            </div>
          )}
        </div>

        {/* Lead time */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 mb-2.5">
          <Clock size={12} className="text-slate-400 shrink-0" />
          <span>Lead time: {product.leadTime}</span>
        </div>

        {/* WhatsApp Enquire */}
        <button
          type="button"
          onClick={openWhatsApp}
          className="w-full flex items-center justify-center gap-1.5 bg-[#C0392B] hover:bg-[#a82e21] text-white py-2 px-3 rounded text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors shadow-xs active:scale-98"
        >
          <MessageCircle size={14} />
          <span>Enquire</span>
        </button>
      </div>
    </Link>
  );
};
