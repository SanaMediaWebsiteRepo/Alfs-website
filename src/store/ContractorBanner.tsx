import React from 'react';
import { BadgePercent, ShieldCheck, ArrowRight } from 'lucide-react';

export const ContractorBanner: React.FC = () => {
  return (
    <section className="bg-[#1a2e4a] text-white py-12 sm:py-16 relative overflow-hidden border-y border-white/10">
      {/* Decorative background shapes */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-80 h-80 rounded-full bg-[#C0392B]/20 blur-2xl pointer-events-none" />
      <div className="absolute left-1/4 bottom-0 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 border border-white/15 rounded-xl p-6 sm:p-10 backdrop-blur-xs flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C0392B] rounded text-[11px] font-bold uppercase tracking-wider text-white mb-3">
              <BadgePercent size={14} />
              <span>Trade &amp; Commercial Accounts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
              Contractor? Get your discount
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              Register your enterprise or contracting crew to unlock 15% trade discounts, tailored site supply agreements, and priority dispatch across Zambia.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="w-full sm:w-auto bg-[#C0392B] hover:bg-[#a82e21] text-white px-8 py-4 rounded text-sm font-bold uppercase tracking-wider transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Become a contractor</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
