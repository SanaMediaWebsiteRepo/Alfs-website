import { motion } from 'motion/react';
import { ShoppingCart, ChevronRight, MessageSquare } from 'lucide-react';
import { Product } from '../hooks/useProducts';
import { waLink } from '../lib/utils';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onRequestQuote: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  conti: 'Conti Suits',
  boiler: 'Boiler & Protective',
  hivis: 'Hi-Vis',
  ppe: 'Industrial PPE',
  footwear: 'Footwear',
  hospitality: 'Hospitality',
  safety: 'Safety Systems',
  security: 'Security',
  leisure: 'Leisurewear',
};

export default function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps) {
  const quoteMsg = `Hello ALFS! I'm interested in the *${product.name}* (ID: ${product.id}).\nCould you please send me a quote?`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 transition-all duration-300 hover:shadow-card-hover hover:border-slate-300/80 overflow-hidden"
    >
      {/* Image Container with matching inner radius */}
      <div
        className="relative aspect-square bg-slate-100/70 overflow-hidden cursor-pointer rounded-xl m-2.5"
        onClick={() => onViewDetails(product)}
      >
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
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-7xl font-bebas text-alfs-red/80 select-none">{product.name.charAt(0)}</span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-alfs-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          <div className="bg-alfs-blue/95 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider self-start shadow-xs">
            {CATEGORY_LABELS[product.category] || product.category}
          </div>
          {product.supplier && (
            <div className="bg-white/95 backdrop-blur-xs text-alfs-black px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border border-black/10 self-start shadow-xs">
              Brand: {product.supplier}
            </div>
          )}
        </div>

        {/* Product ID on hover */}
        <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[8px] font-bold tracking-widest text-alfs-black opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
          {product.id}
        </div>

        {/* View details CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="bg-white text-alfs-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xl hover:scale-105 transition-transform">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4 pt-1">
        {/* Name: max 2 lines */}
        <h4
          className="font-sans text-[12px] font-bold leading-tight text-alfs-black group-hover:text-alfs-blue transition-colors cursor-pointer mb-1 line-clamp-2 md:hidden"
          onClick={() => onViewDetails(product)}
        >
          {product.name}
        </h4>
        <h4
          className="hidden md:block font-bebas text-xl text-alfs-black tracking-wide group-hover:text-alfs-blue transition-colors cursor-pointer mb-1 leading-tight"
          onClick={() => onViewDetails(product)}
        >
          {product.name}
        </h4>

        {/* Description/spec */}
        <div className="hidden md:block">
          <p className="text-[10px] text-alfs-text font-bold uppercase tracking-wider mb-3 leading-relaxed line-clamp-2">
            {product.desc}
          </p>

          {/* Colour swatches */}
          {product.colours.length > 0 && (
            <div className="flex gap-1.5 mb-4">
              {product.colours.slice(0, 6).map((c, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-black/15 flex-shrink-0 shadow-xs"
                  style={{ background: c }}
                  title={c}
                />
              ))}
              {product.colours.length > 6 && (
                <span className="text-[8px] font-bold text-alfs-text self-center">+{product.colours.length - 6}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2 pt-2">
          {/* Desktop actions */}
          <div className="hidden md:flex flex-col gap-2">
            <button
              onClick={() => onAddToCart(product)}
              className="w-full bg-alfs-red text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-alfs-red-hover transition-all duration-200 shadow-sm hover:shadow-glow-red hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart size={13} />
              Add to Order List
            </button>

            <a
              href={waLink(quoteMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-white border border-slate-300 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-alfs-black hover:bg-alfs-black hover:text-white hover:border-alfs-black transition-all duration-200 active:scale-[0.98] flex items-center justify-center"
            >
              Quick Quote
            </a>
          </div>

          {/* Mobile compact action button */}
          <button
            onClick={() => onViewDetails(product)}
            className="md:hidden flex items-center justify-center w-full py-2.5 bg-alfs-black text-white text-[10px] font-bold uppercase tracking-wider gap-1.5 rounded-xl active:scale-[0.98] transition-transform shadow-xs"
          >
            <MessageSquare size={11} className="text-white" />
            <span>Enquire</span>
            <ChevronRight size={11} className="text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
