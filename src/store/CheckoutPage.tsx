import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useCart, PopulatedCartLine } from './context/CartContext';
import { DELIVERY_ZONES, DeliveryZone } from './data/deliveryZones';
import { formatKwacha } from './lib/format';
import { AnnouncementBar } from './AnnouncementBar';
import { StoreHeader } from './StoreHeader';
import { StoreFooter } from './StoreFooter';
import { OrderConfirmation } from './components/OrderConfirmation';
import { CheckoutForm } from './components/CheckoutForm';

export const CheckoutPage: React.FC = () => {
  const { lines, subtotal, clearCart } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(DELIVERY_ZONES[0]?.id || '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string;
    lines: PopulatedCartLine[];
    subtotal: number;
    zone: DeliveryZone;
    total: number;
    name: string;
    phone: string;
  } | null>(null);

  // Totals are calculated in the browser for the demo only. Real totals must be calculated on the server.
  const selectedZone = DELIVERY_ZONES.find((z) => z.id === selectedZoneId) || DELIVERY_ZONES[0];
  const deliveryFee = selectedZone ? selectedZone.fee : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email address is required.';
    if (!selectedZone) newErrors.zone = 'Please select a delivery or pickup option.';
    if (!selectedZone?.isPickup && !address.trim()) newErrors.address = 'Delivery address is required for dispatch.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const orderNumber = `ALFS-${Math.floor(100000 + Math.random() * 900000)}`;
    setPlacedOrder({
      orderNumber,
      lines: [...lines],
      subtotal,
      zone: selectedZone,
      total: grandTotal,
      name: fullName,
      phone,
    });
    clearCart();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-[#C0392B]/10 selection:text-[#C0392B]">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight size={12} className="text-slate-400" />
          <Link to="/store" className="hover:text-slate-800">Store</Link>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="font-semibold text-slate-800">Checkout</span>
        </nav>

        {placedOrder ? (
          <OrderConfirmation
            orderNumber={placedOrder.orderNumber}
            lines={placedOrder.lines}
            subtotal={placedOrder.subtotal}
            deliveryZone={placedOrder.zone}
            total={placedOrder.total}
            customerName={placedOrder.name}
            customerPhone={placedOrder.phone}
          />
        ) : lines.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center max-w-md mx-auto my-8">
            <h2 className="text-lg font-bold text-slate-800 mb-2">No items in your cart</h2>
            <p className="text-xs text-slate-500 mb-6">Please add items to your cart before proceeding to checkout.</p>
            <Link to="/store/search" className="inline-block bg-[#1a2e4a] text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider">
              Browse Products
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <CheckoutForm
                fullName={fullName} setFullName={setFullName}
                phone={phone} setPhone={setPhone}
                email={email} setEmail={setEmail}
                company={company} setCompany={setCompany}
                selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId}
                selectedZone={selectedZone}
                address={address} setAddress={setAddress}
                notes={notes} setNotes={setNotes}
                errors={errors}
              />
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4 sticky top-28">
              <h2 className="text-base font-black text-[#1a2e4a] uppercase tracking-wider pb-3 border-b border-slate-200">
                Order Summary
              </h2>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
                {lines.map((l) => (
                  <div key={l.lineKey} className="pt-2 first:pt-0 flex justify-between text-slate-700">
                    <span className="truncate max-w-[200px]">{l.quantity}x {l.product.name}</span>
                    <span className="font-mono font-bold shrink-0">{formatKwacha(l.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-bold">{formatKwacha(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery fee ({selectedZone?.name}):</span>
                  <span className="font-mono font-bold text-[#1a2e4a]">{formatKwacha(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base text-[#C0392B]">{formatKwacha(grandTotal)}</span>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-[#C0392B] hover:bg-[#a82e21] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs cursor-pointer active:scale-98">
                Place order
              </button>

              <Link to="/store/cart" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold justify-center w-full pt-1">
                <ArrowLeft size={12} />
                <span>Return to Cart</span>
              </Link>
            </div>
          </form>
        )}
      </main>

      <StoreFooter />
    </div>
  );
};

export default CheckoutPage;
