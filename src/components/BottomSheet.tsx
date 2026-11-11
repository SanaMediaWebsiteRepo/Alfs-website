import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, MessageCircle, Plus, Minus } from 'lucide-react';
import { Product } from '../hooks/useProducts';
import { waLink } from '../lib/utils';

interface BottomSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, colour?: string) => void;
}

export default function BottomSheet({ product, isOpen, onClose, onAddToCart }: BottomSheetProps) {
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
    `Spec: ${product.spec}\n` +
    `Quantity: ${quantity} units` +
    (selectedColour ? `\nColour: ${selectedColour}` : '') +
    `\n\nPlease advise on pricing and availability. Thank you!`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[199] backdrop-blur-[2px]"
          />

          {/* Bottom sheet content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 z-[200] bg-white rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto flex flex-col border-t-2 border-alfs-red pb-6"
          >
            {/* Drag Handle & Close */}
            <div className="sticky top-0 bg-white z-10 pt-3 pb-2 px-4 border-b border-alfs-grey flex flex-col items-center">
              <div className="w-10 h-1 bg-neutral-300 rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bebas text-xl text-alfs-black tracking-wide leading-none">{product.name}</h3>
                    {product.supplier && (
                      <span className="bg-white text-alfs-black border border-black/15 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest leading-none">
                        {product.supplier}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-alfs-text mt-1 block">ID: {product.id}</span>
                </div>
                <button onClick={onClose} className="p-1 rounded-full bg-alfs-grey hover:text-alfs-red transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Bottom Sheet Body */}
            <div className="p-4 space-y-5 flex-grow overflow-y-auto">
              {/* Product Image */}
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(e) => {
                    if (product.fallbackImage && e.currentTarget.src !== product.fallbackImage) {
                      e.currentTarget.src = product.fallbackImage;
                    }
                  }}
                  onClick={() => setIsImageZoomed(true)}
                  className="w-full aspect-[4/3] object-contain bg-alfs-grey rounded-lg border border-alfs-grey cursor-pointer hover:opacity-95 transition-opacity"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-alfs-black rounded-lg flex items-center justify-center">
                  <span className="text-6xl font-bebas text-alfs-red">{product.name.charAt(0)}</span>
                </div>
              )}

              {/* Spec */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-alfs-blue mb-1">Specification</p>
                <p className="text-sm font-bold text-alfs-black leading-snug">{product.spec}</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-alfs-blue mb-1">Description</p>
                <p className="text-xs text-alfs-text leading-relaxed">{product.desc}</p>
              </div>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-alfs-blue mb-2">Features</p>
                  <ul className="space-y-1.5 text-xs text-alfs-text">
                    {product.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-alfs-red rounded-full mt-1.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Applications */}
              {product.applications && product.applications.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-alfs-blue mb-2">Applications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.applications.map((app, i) => (
                      <span
                        key={i}
                        className="bg-alfs-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest"
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colour selection */}
              {product.colours.length > 0 && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-alfs-blue mb-2">
                    Select Colour {selectedColour && <span className="text-alfs-red">— {selectedColour}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colours.map((colour, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColour(selectedColour === colour ? undefined : colour)}
                        className={`w-7 h-7 rounded-full border transition-all ${
                          selectedColour === colour
                            ? 'border-alfs-red scale-110 ring-2 ring-alfs-red/20'
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
                <p className="text-[9px] font-black uppercase tracking-widest text-alfs-blue mb-2">Quantity</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 bg-alfs-grey border border-black/10 flex items-center justify-center rounded"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) setQuantity(v);
                    }}
                    className="w-14 h-8 text-center text-sm font-bold border border-black/10 outline-none focus:border-alfs-red rounded"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 bg-alfs-grey border border-black/10 flex items-center justify-center rounded"
                  >
                    <Plus size={12} />
                  </button>
                  <span className="text-[10px] font-bold uppercase text-alfs-text">units</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-alfs-grey space-y-2.5">
                <button
                  onClick={handleAdd}
                  className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                    added ? 'bg-green-600 text-white' : 'bg-alfs-red text-white hover:bg-alfs-red-hover hover:shadow-glow-red'
                  }`}
                >
                  <ShoppingCart size={14} />
                  {added ? '✓ Added to Order List' : 'Add to Order List'}
                </button>

                <a
                  href={waLink(quoteMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1da851] transition-all active:scale-95 shadow-sm"
                >
                  <MessageCircle size={14} />
                  WhatsApp Enquire
                </a>
              </div>
            </div>
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
