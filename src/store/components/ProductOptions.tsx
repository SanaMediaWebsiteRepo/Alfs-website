import React, { useState } from 'react';
import { ShoppingCart, MessageCircle, Plus, Minus } from 'lucide-react';
import { SampleProduct } from '../data/sampleProducts';
import { useCart } from '../context/CartContext';

interface ProductOptionsProps {
  product: SampleProduct;
}

export const ProductOptions: React.FC<ProductOptionsProps> = ({ product }) => {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || '');
  const [selectedColour, setSelectedColour] = useState<string>(product.colours[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      size: selectedSize || undefined,
      colour: selectedColour || undefined,
      quantity,
    });
  };

  const handleWhatsAppEnquire = () => {
    const sizeStr = selectedSize ? `Size: ${selectedSize}, ` : '';
    const colourStr = selectedColour ? `Colour: ${selectedColour}, ` : '';
    const msg = `Hi ALFS! I would like to order/enquire about:\nProduct: ${product.name}\n${sizeStr}${colourStr}Quantity: ${quantity}\nPrice: ${product.normalPrice}\nPlease confirm delivery options and quote.`;
    window.open(`https://wa.me/260962334797?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 pt-3">
      {/* Size Selector */}
      {product.sizes.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Size: <span className="text-[#1a2e4a]">{selectedSize || 'Select'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                className={`py-2 px-3 text-xs font-semibold rounded border transition-all ${
                  selectedSize === s
                    ? 'border-[#1a2e4a] bg-[#1a2e4a] text-white'
                    : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colour Selector */}
      {product.colours.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Colour: <span className="text-[#C0392B]">{selectedColour || 'Select'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {product.colours.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColour(c)}
                className={`py-2 px-3 text-xs font-semibold rounded border transition-all ${
                  selectedColour === c
                    ? 'border-[#C0392B] bg-[#C0392B] text-white'
                    : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Stepper */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
          Quantity:
        </label>
        <div className="flex items-center w-36 border border-slate-300 rounded overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2.5 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full text-center text-sm font-bold font-mono text-slate-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="p-2.5 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3.5 px-6 bg-[#1a2e4a] hover:bg-[#14233a] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <ShoppingCart size={16} />
          <span>Add to cart</span>
        </button>

        <button
          type="button"
          onClick={handleWhatsAppEnquire}
          className="flex-1 py-3.5 px-6 bg-[#C0392B] hover:bg-[#a82e21] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <MessageCircle size={16} />
          <span>Enquire on WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
