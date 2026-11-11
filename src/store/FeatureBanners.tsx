import React from 'react';
import { Truck, Clock, ShieldCheck } from 'lucide-react';

export const FeatureBanners: React.FC = () => {
  const features = [
    {
      icon: <Truck size={28} className="text-[#C0392B]" />,
      title: 'Delivery Available',
      desc: 'Delivery available, fee depends on location. Fast logistics to commercial hubs, mining sites, and depots.',
    },
    {
      icon: <Clock size={28} className="text-[#1a2e4a]" />,
      title: '2–3 Day Lead Time',
      desc: 'Rapid stock turnaround and fast replenishment on all regular PPE and workwear orders.',
    },
    {
      icon: <ShieldCheck size={28} className="text-[#C0392B]" />,
      title: 'Contractor Pricing',
      desc: 'Direct trade savings of up to 15% with customized corporate procurement agreements.',
    },
  ];

  return (
    <section className="py-10 bg-slate-100/60 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex items-start gap-4 hover:border-[#1a2e4a] transition-all"
            >
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
