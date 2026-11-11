import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#1a2e4a] text-white text-[11px] sm:text-xs py-2 px-4 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="font-semibold text-white/95">
            Contractor pricing available. Sign up today for trade rates.
          </span>
          <span className="hidden md:inline text-white/60">·</span>
          <span className="hidden md:inline text-white/75">
            Delivery available, fee depends on location (2–3 day lead time)
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-white/80 text-[11px]">
          <a
            href="https://wa.me/260962334797"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            WhatsApp: 0962334797
          </a>
          <span>·</span>
          <span>Lusaka &amp; Chingola</span>
        </div>
      </div>
    </div>
  );
};
