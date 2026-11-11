import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from './context/CartContext';
import { formatKwacha } from './lib/format';
import { AnnouncementBar } from './AnnouncementBar';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';

export const CartPage: React.FC = () => {
  const { lines, totalItems, subtotal, totalSavings, isContractorPricing, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#C0392B]/10 selection:text-[#C0392B]">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <Link to="/store" className="hover:text-slate-800">Store</Link>
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">Shopping Cart</span>
        </nav>

        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a2e4a] tracking-tight">Shopping Cart</h1>
            <p className="text-xs text-slate-500 mt-1">{totalItems} {totalItems === 1 ? 'item' : 'items'} ready for order enquiry</p>
          </div>
          {lines.length > 0 && (
            <button onClick={clearCart} className="text-xs text-slate-500 hover:text-[#C0392B] font-semibold underline">
              Clear Cart
            </button>
          )}
        </div>

        {lines.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-md mx-auto my-8">
            <ShoppingBag size={48} className="text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800">Your shopping cart is empty</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">Browse our SABS-approved industrial PPE and footwear to begin.</p>
            <Link to="/store/search" className="inline-block bg-[#1a2e4a] hover:bg-[#15253c] text-white px-6 py-3 rounded text-xs font-bold uppercase tracking-wider">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Line Items */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-xs divide-y divide-slate-100">
              {lines.map((line) => (
                <div key={line.lineKey} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center shrink-0 p-1 text-center">
                      <span className="text-[9px] font-bold text-[#1a2e4a] line-clamp-1">{line.product.category}</span>
                      <span className="text-[8px] text-slate-400 font-mono">SPEC</span>
                    </div>
                    <div>
                      <Link to={`/store/product/${line.productId}`} className="text-sm font-bold text-slate-900 hover:text-[#1a2e4a] line-clamp-1">
                        {line.product.name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                        {line.size && <span>Size: {line.size}</span>}
                        {line.colour && <span>Colour: {line.colour}</span>}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Unit price: <span className="font-mono font-bold">{formatKwacha(line.unitPrice)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                    <div className="flex items-center border border-slate-300 rounded bg-white">
                      <button onClick={() => updateQuantity(line.lineKey, line.quantity - 1)} className="p-2 text-slate-600 hover:bg-slate-100" aria-label="Decrease">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono">{line.quantity}</span>
                      <button onClick={() => updateQuantity(line.lineKey, line.quantity + 1)} className="p-2 text-slate-600 hover:bg-slate-100" aria-label="Increase">
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="text-base font-black text-slate-900 font-mono">{formatKwacha(line.lineTotal)}</div>
                      <button onClick={() => removeItem(line.lineKey)} className="text-slate-400 hover:text-[#C0392B] text-[11px] flex items-center gap-1 mt-1 ml-auto">
                        <Trash2 size={12} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Box */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4 sticky top-28">
              <h2 className="text-base font-black text-[#1a2e4a] uppercase tracking-wider pb-3 border-b border-slate-200">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatKwacha(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery fee:</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              {isContractorPricing && totalSavings > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-[#C0392B] text-xs font-bold">
                  Contractor pricing applied: You saved {formatKwacha(totalSavings)} compared to standard retail!
                </div>
              )}

              <Link
                to="/store/checkout"
                className="w-full py-3.5 bg-[#C0392B] hover:bg-[#a82e21] text-white text-xs font-bold uppercase tracking-wider rounded text-center transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/store/search" className="block text-center text-xs text-slate-500 hover:text-slate-800 font-semibold pt-1">
                ← Continue shopping
              </Link>
            </div>
          </div>
        )}
      </main>

      <StoreFooter />
    </div>
  );
};

export default CartPage;
