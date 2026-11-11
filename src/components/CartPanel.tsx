import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingCart, MessageCircle, FileText, User, Building2, Phone } from 'lucide-react';
import { waLink } from '../lib/utils';
import { trackEvent } from '../lib/analytics';

export interface CartItem {
  id: string;
  name: string;
  spec: string;
  category: string;
  image?: string;
  fallbackImage?: string;
  colour?: string;
  quantity: number;
}

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

interface ContactInfo {
  name: string;
  company: string;
  phone: string;
}

function buildWhatsAppMessage(items: CartItem[], contact: ContactInfo): string {
  const date = new Date().toLocaleDateString('en-ZM', { day: '2-digit', month: 'short', year: 'numeric' });
  const ref = `ALFS-${Date.now().toString().slice(-6)}`;

  const header = contact.name
    ? `Hello ALFS! Quote request from *${contact.name}*${contact.company ? ` (${contact.company})` : ''}${contact.phone ? `\nPhone: ${contact.phone}` : ''}`
    : `Hello ALFS! I'd like to request a quote for the following`;

  const lines = items.map(
    (item) =>
      `  • ${item.name} (ID: ${item.id})${item.colour ? ` — Colour: ${item.colour}` : ''} × ${item.quantity} unit${item.quantity !== 1 ? 's' : ''}`
  );

  return (
    `${header}\n\n` +
    `*ORDER ENQUIRY*\n` +
    `Ref: ${ref} | Date: ${date}\n` +
    `─────────────────────\n` +
    lines.join('\n') +
    `\n─────────────────────\n` +
    `Please advise on availability and pricing.\n` +
    `Thank you!`
  );
}

const getCartKey = (item: CartItem) => item.id + (item.colour || '');

export default function CartPanel({ isOpen, onClose, items, onUpdateQty, onRemove, onClear }: CartPanelProps) {
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const [contact, setContact] = useState<ContactInfo>({ name: '', company: '', phone: '' });
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactInfo>>({});

  const validate = () => {
    const newErrors: Partial<ContactInfo> = {};
    if (!contact.name.trim()) newErrors.name = 'Required';
    if (!contact.phone.trim()) newErrors.phone = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWhatsApp = () => {
    if (!validate()) return;
    trackEvent('whatsapp_click', { location: 'quote_request' });
    const msg = buildWhatsAppMessage(items, contact);
    window.open(waLink(msg), '_blank');
  };

  const handleQuoteForm = () => {
    onClose();
    setTimeout(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[3000]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[3001] flex flex-col shadow-2xl border-l-4 border-alfs-red"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-alfs-grey bg-alfs-black text-white">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-alfs-red" />
                <span className="font-bebas text-2xl tracking-wider">YOUR ORDER LIST</span>
                {totalItems > 0 && (
                  <span className="bg-alfs-red text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:text-alfs-red transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingCart size={48} className="text-alfs-black/10" />
                  <p className="font-bebas text-2xl text-alfs-black/30">YOUR LIST IS EMPTY</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-alfs-text">
                    Browse the catalogue and add products
                  </p>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <motion.div
                      key={getCartKey(item)}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl group shadow-xs"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              if (item.fallbackImage && e.currentTarget.src !== item.fallbackImage) {
                                e.currentTarget.src = item.fallbackImage;
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <span className="font-bebas text-2xl text-alfs-red">{item.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <p className="font-bebas text-lg text-alfs-black leading-tight truncate">{item.name}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 truncate">{item.id}</p>
                        {item.colour && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-3 h-3 rounded-full border border-black/20" style={{ background: item.colour }} />
                            <span className="text-[9px] font-bold text-alfs-text">{item.colour}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => onUpdateQty(getCartKey(item), Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-sm hover:bg-alfs-black hover:text-white transition-all active:scale-95"
                          >−</button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              if (!isNaN(v) && v > 0) onUpdateQty(getCartKey(item), v);
                            }}
                            className="w-14 h-7 text-center text-[11px] font-black border border-slate-200 rounded-lg outline-none focus:border-alfs-red bg-white"
                          />
                          <button
                            onClick={() => onUpdateQty(getCartKey(item), item.quantity + 1)}
                            className="w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-sm hover:bg-alfs-black hover:text-white transition-all active:scale-95"
                          >+</button>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">units</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemove(getCartKey(item))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-alfs-red hover:text-red-700 p-1 self-start"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}

                  {/* Contact info form */}
                  <div className="mt-4 border-t-2 border-alfs-grey pt-4">
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-alfs-black mb-3"
                    >
                      <span className="flex items-center gap-2">
                        <User size={13} className="text-alfs-red" />
                        Your Contact Details
                      </span>
                      <span className="text-alfs-text">{showForm ? '▲' : '▼'}</span>
                    </button>

                    <AnimatePresence>
                      {showForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          {/* Name */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-alfs-text block mb-1">
                              Full Name *
                            </label>
                            <div className="relative">
                              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-alfs-text" />
                              <input
                                type="text"
                                value={contact.name}
                                onChange={(e) => { setContact(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                                placeholder="John Banda"
                                className={`w-full pl-8 pr-3 py-2.5 text-[11px] font-bold border outline-none transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-black/10 focus:border-alfs-red'}`}
                              />
                            </div>
                            {errors.name && <p className="text-[9px] text-red-500 font-bold mt-0.5">{errors.name}</p>}
                          </div>

                          {/* Company */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-alfs-text block mb-1">
                              Company (optional)
                            </label>
                            <div className="relative">
                              <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-alfs-text" />
                              <input
                                type="text"
                                value={contact.company}
                                onChange={(e) => setContact(p => ({ ...p, company: e.target.value }))}
                                placeholder="Your Company Ltd"
                                className="w-full pl-8 pr-3 py-2.5 text-[11px] font-bold border border-black/10 outline-none focus:border-alfs-red transition-all"
                              />
                            </div>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-alfs-text block mb-1">
                              Phone Number *
                            </label>
                            <div className="relative">
                              <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-alfs-text" />
                              <input
                                type="tel"
                                value={contact.phone}
                                onChange={(e) => { setContact(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })); }}
                                placeholder="+260 97 123 4567"
                                className={`w-full pl-8 pr-3 py-2.5 text-[11px] font-bold border outline-none transition-all ${errors.phone ? 'border-red-400 bg-red-50' : 'border-black/10 focus:border-alfs-red'}`}
                              />
                            </div>
                            {errors.phone && <p className="text-[9px] text-red-500 font-bold mt-0.5">{errors.phone}</p>}
                          </div>

                          {/* Preview */}
                          {contact.name && (
                            <div className="bg-alfs-grey border border-black/5 p-3 text-[10px] font-bold text-alfs-text leading-relaxed">
                              <p className="text-[9px] font-black uppercase tracking-widest text-alfs-black mb-2">Message preview:</p>
                              <p>Hello ALFS! Quote request from <strong>{contact.name}</strong>{contact.company && ` (${contact.company})`}</p>
                              {contact.phone && <p>Phone: {contact.phone}</p>}
                              <p className="mt-1 text-alfs-black/40">+ your {items.length} item{items.length !== 1 ? 's' : ''}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!showForm && (
                      <p className="text-[9px] text-alfs-text font-bold">
                        Add your name &amp; number so ALFS can identify your enquiry
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            {items.length > 0 && (
              <div className="p-6 border-t border-alfs-grey space-y-3 bg-white">
                <div className="text-[9px] font-black uppercase tracking-widest text-alfs-text mb-2">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} — Send via:
                </div>

                <button
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-[#1da851] transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <MessageCircle size={18} />
                  Send Order via WhatsApp
                </button>

                <button
                  onClick={handleQuoteForm}
                  className="w-full bg-alfs-blue text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:bg-alfs-blue-hover transition-all shadow-sm active:scale-95 cursor-pointer hover:shadow-glow-blue"
                >
                  <FileText size={18} />
                  Request Formal Quote
                </button>

                <button
                  onClick={onClear}
                  className="w-full bg-transparent border border-slate-200 text-slate-500 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:border-alfs-red hover:text-alfs-red transition-all active:scale-95 cursor-pointer"
                >
                  Clear List
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
