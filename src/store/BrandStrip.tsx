import React from 'react';

const BRANDS = [
  { name: 'Brand 1', tag: 'PPE & Workwear' },
  { name: 'Brand 2', tag: 'Safety Footwear' },
  { name: 'Brand 3', tag: 'Legendary Workwear' },
  { name: 'Brand 4', tag: 'Heavy Industrial' },
  { name: 'Brand 5', tag: 'Engineered Safety' },
  { name: 'Brand 6', tag: 'Protective Equipment' },
];

export const BrandStrip: React.FC = () => {
  return (
    <section className="py-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
          Authorized Stockist &amp; Distribution Partner
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 items-center">
          {BRANDS.map((b) => (
            <div
              key={b.name}
              className="border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-[#1a2e4a] p-3 sm:p-4 rounded text-center transition-all flex flex-col items-center justify-center min-h-[72px]"
            >
              <span className="text-sm sm:text-base font-black text-slate-800 tracking-wide">
                {b.name}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                {b.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
