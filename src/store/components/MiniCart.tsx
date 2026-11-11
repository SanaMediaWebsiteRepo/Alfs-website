import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatKwacha } from '../lib/format';

export const MiniCart: React.FC = () => {
  const { lines, totalItems, subtotal, totalSavings, isContractorPricing, isMiniCartOpen, closeMiniCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!isMiniCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div onClick={closeMiniCart} className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#1a2e4a]" />
            <span className="font-black text-[#1a2e4a] text-base">Your Cart</span>
            <span className="text-xs text-slate-500 font-semibold">({totalItems} items)</span>
          </div>
          <button onClick={closeMiniCart} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-200" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingBag size={48} className="text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-800">Your cart is empty</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Add contractor workwear and PPE to review items here.</p>
              <button onClick={() => { closeMiniCart(); navigate('/store/search'); }} className="bg-[#1a2e4a] text-white px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider">
                Start Shopping
              </button>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.lineKey} className="flex gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-16 h-16 bg-white border border-slate-300 rounded flex flex-col items-center justify-center shrink-0 p-1 text-center">
                  <span className="text-[9px] font-bold text-[#1a2e4a] line-clamp-1">{line.product.category}</span>
                  <span className="text-[8px] text-slate-400 font-mono">SPEC</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{line.product.name}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5 space-x-2">
                    {line.size && <span>Size: {line.size}</span>}
                    {line.colour && <span>Colour: {line.colour}</span>}
                  </div>
                  <div className="text-xs font-black text-[#1a2e4a] font-mono mt-1">
                    {formatKwacha(line.lineTotal)}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-slate-300 rounded bg-white">
                      <button onClick={() => updateQuantity(line.lineKey, line.quantity - 1)} className="p-1 text-slate-600 hover:bg-slate-100">
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-bold font-mono">{line.quantity}</span>
                      <button onClick={() => updateQuantity(line.lineKey, line.quantity + 1)} className="p-1 text-slate-600 hover:bg-slate-100">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(line.lineKey)} className="text-slate-400 hover:text-[#C0392B] p-1" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">Subtotal</span>
              <span className="text-lg font-black text-slate-900 font-mono">{formatKwacha(subtotal)}</span>
            </div>
            {isContractorPricing && totalSavings > 0 && (
              <p className="text-[11px] text-[#C0392B] font-bold">
                Contractor rate applied · You saved {formatKwacha(totalSavings)}!
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/store/cart" onClick={closeMiniCart} className="py-2.5 px-3 bg-white border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl text-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs">
                View Cart
              </Link>
              <Link to="/store/checkout" onClick={closeMiniCart} className="py-2.5 px-3 bg-[#C0392B] hover:bg-[#a82e21] text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1 shadow-sm hover:shadow-glow-red active:scale-95 transition-all">
                <span>Checkout</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
