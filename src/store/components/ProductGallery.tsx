import React, { useState } from 'react';
import { SampleProduct } from '../data/sampleProducts';
import {
  Footprints,
  Shirt,
  HardHat,
  HandMetal,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface ProductGalleryProps {
  product: SampleProduct;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ product }) => {
  const [activeThumb, setActiveThumb] = useState(0);

  const getPlaceholderIcon = (iconName: SampleProduct['iconName'], size: number = 48) => {
    switch (iconName) {
      case 'footwear': return <Footprints size={size} className="text-[#1a2e4a]/60" />;
      case 'workwear': return <Shirt size={size} className="text-[#1a2e4a]/60" />;
      case 'head': return <HardHat size={size} className="text-[#1a2e4a]/60" />;
      case 'hand': return <HandMetal size={size} className="text-[#1a2e4a]/60" />;
      case 'hivis': return <ShieldAlert size={size} className="text-[#1a2e4a]/60" />;
      case 'eye': return <Eye size={size} className="text-[#1a2e4a]/60" />;
      default: return <HardHat size={size} className="text-[#1a2e4a]/60" />;
    }
  };

  const images = product.placeholderImages && product.placeholderImages.length > 0
    ? product.placeholderImages
    : ['Standard Spec Front', 'Side View', 'Detail Spec'];

  return (
    <div className="flex flex-col gap-3">
      {/* Large Main Placeholder Box */}
      <div className="w-full aspect-square max-h-[460px] bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden shadow-xs">
        <span className="absolute top-3 left-3 bg-[#1a2e4a] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          {product.category}
        </span>
        <span className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
          SABS Certified
        </span>

        {getPlaceholderIcon(product.iconName, 64)}

        <h4 className="text-sm font-bold text-slate-800 mt-4 max-w-xs leading-snug">
          {images[activeThumb]}
        </h4>
        <span className="text-[11px] text-slate-400 mt-1 font-mono">
          Spec: EN / SABS Industrial Standard
        </span>
      </div>

      {/* 3 Thumbnails */}
      <div className="grid grid-cols-3 gap-3">
        {images.map((imgName, index) => {
          const isActive = activeThumb === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setActiveThumb(index)}
              className={`h-20 bg-slate-50 border rounded-md p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isActive
                  ? 'border-[#C0392B] ring-2 ring-[#C0392B]/20 bg-white'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {getPlaceholderIcon(product.iconName, 20)}
              <span className="text-[10px] font-medium text-slate-600 truncate max-w-full mt-1">
                View {index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
