import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ShoppingCart, MessageCircle, FileText, Plus, Minus } from 'lucide-react';
import { Product } from '../hooks/useProducts';
import { waLink } from '../lib/utils';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestQuote: (product: Product) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasNavigation?: boolean;
  onAddToCart: (product: Product, quantity: number, colour?: string) => void;
}

export default function ProductDetail({
  product,
  isOpen,
  onClose,
  onNavigate,
  hasNavigation = false,
  onAddToCart,
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColour, setSelectedColour] = useState<string | undefined>(undefined);
  const [added, setAdded] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageZoomed(false);
      }
    };
    if (isImageZoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageZoomed]);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedColour);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const quoteMsg =
    `Hello ALFS! I'd like to enquire about:\n\n` +
    `*${product.name}* (ID: ${product.id})\n` +
    `Quantity: ${quantity} units` +
    (selectedColour ? `\nColour: ${selectedColour}` : '') +
    `\n\nPlease advise on pricing and availability. Thank you!`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            className="fixed inset-4 md:inset-10 lg:inset-16 bg-white z-[2001] overflow-y-auto rounded-3xl border-t-4 border-alfs-red shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 py-4 z-10">
              <div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <h2 className="font-bebas text-2xl md:text-4xl text-alfs-black tracking-wide leading-none">
                    {product.name}
                  </h2>
                  {product.supplier && (
                    <span className="bg-slate-100 text-alfs-black border border-black/10 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider mt-1">
                      Brand: {product.supplier}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  ID: {product.id}
                </span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 hover:text-alfs-red transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left — Image */}
                <div>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (product.fallbackImage && e.currentTarget.src !== product.fallbackImage) {
                          e.currentTarget.src = product.fallbackImage;
                        }
                      }}
                      onClick={() => setIsImageZoomed(true)}
                      className="w-full aspect-square object-contain bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:scale-[1.01] transition-transform shadow-xs"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-alfs-black rounded-2xl flex items-center justify-center">
                      <span className="text-9xl font-bebas text-alfs-red">{product.name.charAt(0)}</span>
                    </div>
                  )}

                  {/* Image */}
                </div>

                {/* Right — Details + Order */}
                <div className="space-y-7">
                  {/* Description */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-alfs-blue mb-1">Description</p>
                    <p className="text-sm text-alfs-text leading-relaxed">{product.desc}</p>
                  </div>

                  {/* Colour picker */}
                  {product.colours && product.colours.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-alfs-blue mb-3">
                        Select Colour {selectedColour && <span className="text-alfs-red">— {selectedColour}</span>}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {product.colours.map((colour, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedColour(selectedColour === colour ? undefined : colour)}
                            className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                              selectedColour === colour
                                ? 'border-alfs-red scale-110 shadow-lg'
                                : 'border-black/10'
                            }`}
                            style={{ background: colour }}
                            title={colour}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-alfs-blue mb-3">Quantity</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-alfs-grey border border-black/10 flex items-center justify-center hover:bg-alfs-black hover:text-white transition-all"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v > 0) setQuantity(v);
                        }}
                        className="w-20 h-10 text-center text-base font-black border border-black/10 outline-none focus:border-alfs-red"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 bg-alfs-grey border border-black/10 flex items-center justify-center hover:bg-alfs-black hover:text-white transition-all"
                      >
                        <Plus size={14} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-alfs-text">units</span>
                    </div>
                  </div>

                  {/* Order actions */}
                  <div className="pt-6 border-t-2 border-alfs-grey space-y-3">
                    {/* Add to order list */}
                    <button
                      onClick={handleAdd}
                      className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                        added
                          ? 'bg-green-600 text-white'
                          : 'bg-alfs-red text-white hover:bg-alfs-red-hover hover:shadow-glow-red'
                      }`}
                    >
                      <ShoppingCart size={16} />
                      {added ? '✓ Added to Order List' : 'Add to Order List'}
                    </button>

                    {/* WhatsApp this item directly */}
                    <a
                      href={waLink(quoteMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#1da851] transition-all active:scale-95 shadow-sm"
                    >
                      <MessageCircle size={16} />
                      WhatsApp This Item
                    </a>

                    {/* Formal quote */}
                    <a
                      href="#contact"
                      onClick={onClose}
                      className="w-full bg-alfs-blue text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-alfs-blue-hover transition-all active:scale-95 shadow-sm hover:shadow-glow-blue"
                    >
                      <FileText size={16} />
                      Request Formal Quote
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Prev / Next navigation */}
            {hasNavigation && onNavigate && (
              <div className="sticky bottom-0 bg-white border-t border-alfs-grey flex justify-between px-6 py-3">
                <button
                  onClick={() => onNavigate('prev')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-alfs-black hover:text-alfs-red transition-colors"
                >
                  <ChevronLeft size={18} /> Previous
                </button>
                <button
                  onClick={() => onNavigate('next')}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-alfs-black hover:text-alfs-red transition-colors"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Zoomed Image Lightbox Overlay */}
          <AnimatePresence>
            {isImageZoomed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsImageZoomed(false)}
                className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center cursor-zoom-out p-4 md:p-8"
              >
                {/* Close Button top-right */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsImageZoomed(false);
                  }}
                  className="absolute top-6 right-6 text-white hover:text-alfs-red bg-black/40 hover:bg-black/60 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-[3010]"
                  aria-label="Close zoom"
                >
                  <X size={24} />
                </button>
                
                {/* Image */}
                <motion.img
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (product.fallbackImage && e.currentTarget.src !== product.fallbackImage) {
                      e.currentTarget.src = product.fallbackImage;
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="max-w-full max-h-full object-contain cursor-default"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
