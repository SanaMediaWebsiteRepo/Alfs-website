import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, Truck } from 'lucide-react';

interface Slide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink?: string;
  badge: string;
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    tag: 'CONTRACTOR & TRADE SUPPLY',
    title: 'Equip Your Workforce With SABS Certified PPE',
    subtitle: 'From heavy-duty Bova boots to Dromex acid-resistant suits. 2–3 day delivery across Zambia.',
    ctaText: 'Browse Safety Gear',
    badge: '15% Off For Trade',
    accentColor: '#C0392B',
  },
  {
    id: 2,
    tag: 'NEW ARRIVALS 2026',
    title: 'High-Visibility & Mining Site Workwear',
    subtitle: 'Heavy-duty reflective parkas, conti suits, and flame-retardant industrial apparel.',
    ctaText: 'View High-Vis Gear',
    badge: 'Zambian Standard',
    accentColor: '#1a2e4a',
  },
  {
    id: 3,
    tag: 'FAST SITE DISPATCH',
    title: 'Lusaka & Copperbelt Rapid Site Fulfillment',
    subtitle: 'Bulk orders packed, branded, and delivered directly to your project sites.',
    ctaText: 'Request Wholesale Quote',
    badge: '2–3 Day Lead Time',
    accentColor: '#C0392B',
  },
];

export const HeroPromo: React.FC = () => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  // Auto rotate slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className="relative bg-[#1a2e4a] text-white overflow-hidden py-10 sm:py-16">
      {/* Background accents */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[#C0392B]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded text-[11px] font-bold uppercase tracking-wider text-[#C0392B] bg-white mb-4">
            <span className="w-2 h-2 rounded-full bg-[#C0392B]" />
            <span className="text-slate-900">{slide.tag}</span>
            <span className="text-slate-400">·</span>
            <span className="text-[#C0392B]">{slide.badge}</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4 text-balance">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-200 mb-8 max-w-2xl leading-relaxed">
            {slide.subtitle}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#new-products"
              className="bg-[#C0392B] hover:bg-[#a82e21] text-white px-6 py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              {slide.ctaText}
            </a>
            <a
              href="https://wa.me/260962334797?text=Hi%20ALFS!%20I%20would%20like%20to%20enquire%20about%20contractor%20pricing%20for%20safety%20gear."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-3.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
            >
              WhatsApp Support
            </a>
          </div>
        </div>

        {/* Carousel Navigation Arrows & Dots */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/15">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  current === idx ? 'w-8 bg-[#C0392B]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Prev / Next controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
