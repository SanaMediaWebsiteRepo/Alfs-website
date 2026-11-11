import React from 'react';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StoreFooter: React.FC = () => {
  return (
    <footer className="bg-[#1a2e4a] text-white pt-12 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div>
            <div className="flex flex-col mb-4">
              <span className="text-2xl font-black tracking-tight text-white leading-none">
                ALFS<span className="text-[#C0392B]">STORE</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase mt-1">
                Achilles Labour Force Services Limited
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Zambia's professional standard for industrial workwear, SABS-certified PPE, safety footwear, and site contractor supply.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#C0392B] bg-white px-3 py-1.5 rounded">
              <span>SABS &amp; EN Certified Gear</span>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 border-b border-white/10 pb-2">
              Contact &amp; Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#C0392B]" />
                <a href="tel:0962334797" className="hover:text-white transition-colors">
                  0962334797
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-[#C0392B]" />
                <a
                  href="https://wa.me/260962334797"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: +260 96 233 4797
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#C0392B]" />
                <a href="mailto:admin@alfslimited.com" className="hover:text-white transition-colors">
                  admin@alfslimited.com
                </a>
              </li>
              <li className="flex items-start gap-2 pt-1">
                <MapPin size={14} className="text-[#C0392B] shrink-0 mt-0.5" />
                <span>Lusaka Hub &amp; Chingola Office, Zambia</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 border-b border-white/10 pb-2">
              Customer Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/store/cart" className="hover:text-white transition-colors">
                  View Cart
                </Link>
              </li>
              <li>
                <Link to="/store/checkout" className="hover:text-white transition-colors">
                  Order Checkout
                </Link>
              </li>
              {['Contractor Account Application', 'Order Lead Times & Logistics', 'Bulk PPE Quote Request', 'Size Charts & Spec Sheets'].map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="hover:text-white transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal / Policy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 border-b border-white/10 pb-2">
              Information
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {['About ALFS Limited', 'Mining Compliance Standards', 'Privacy Policy', 'Terms & Conditions', 'Site Delivery Schedule'].map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="hover:text-white transition-colors text-left"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} ALFS Limited. All rights reserved. Zambia.</p>
          <p className="text-slate-400">
            Designed &amp; Created by <span className="text-white font-semibold">Mupenda Chama</span>
          </p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-white transition-colors">
              ALFS Home
            </Link>
            <span>·</span>
            <span>Online Trade Supply</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
