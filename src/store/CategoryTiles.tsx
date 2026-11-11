import React from 'react';
import {
  Footprints,
  Shirt,
  HardHat,
  HandMetal,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SAMPLE_CATEGORIES } from './data/sampleProducts';

export const CategoryTiles: React.FC = () => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'footwear':
        return <Footprints size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
      case 'workwear':
        return <Shirt size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
      case 'head':
        return <HardHat size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
      case 'hand':
        return <HandMetal size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
      case 'hivis':
        return <ShieldAlert size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
      case 'eye':
        return <Eye size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
      default:
        return <HardHat size={28} className="text-[#1a2e4a] group-hover:text-[#C0392B] transition-colors" />;
    }
  };

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a2e4a] tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a specialized division to view contractor-grade equipment
            </p>
          </div>
          <Link
            to="/store/search"
            className="text-xs text-[#C0392B] hover:underline font-bold"
          >
            View all products →
          </Link>
        </div>

        {/* 2 columns mobile, 3 tablet, 6 desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {SAMPLE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/store/category/${cat.slug}`}
              className="group flex flex-col items-center justify-center p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-[#1a2e4a] hover:shadow-sm transition-all text-center"
            >
              <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs group-hover:border-[#C0392B]/40 group-hover:scale-105 transition-all">
                {getCategoryIcon(cat.iconName)}
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#1a2e4a] leading-tight">
                {cat.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">
                Browse products
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
