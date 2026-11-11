import React from 'react';
import { CheckCircle2, MessageCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PopulatedCartLine } from '../context/CartContext';
import { DeliveryZone } from '../data/deliveryZones';
import { formatKwacha } from '../lib/format';

interface OrderConfirmationProps {
  orderNumber: string;
  lines: PopulatedCartLine[];
  subtotal: number;
  deliveryZone: DeliveryZone | null;
  total: number;
  customerName: string;
  customerPhone: string;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderNumber,
  lines,
  subtotal,
  deliveryZone,
  total,
  customerName,
  customerPhone,
}) => {
  const openWhatsApp = () => {
    const summary = lines.map((l) => `- ${l.product.name} (Qty: ${l.quantity}${l.size ? ', Size: ' + l.size : ''}): ${formatKwacha(l.lineTotal)}`).join('\n');
    const msg = `Hi ALFS! I just placed Demo Order #${orderNumber}.\nName: ${customerName}\nPhone: ${customerPhone}\nDelivery: ${deliveryZone?.name || 'Standard'}\nItems:\n${summary}\nSubtotal: ${formatKwacha(subtotal)}\nDelivery Fee: ${formatKwacha(deliveryZone?.fee || 0)}\nTotal: ${formatKwacha(total)}\nPlease confirm invoice & payment details.`;
    window.open(`https://wa.me/260962334797?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
        <CheckCircle2 size={36} />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-[#C0392B] bg-red-50 px-3 py-1 rounded">
        Order Received (Demo)
      </span>
      <h1 className="text-2xl sm:text-3xl font-black text-[#1a2e4a] mt-2 mb-1">
        Order #{orderNumber}
      </h1>
      <p className="text-xs text-slate-500 mb-6">
        Thank you, {customerName}. Your quote request has been recorded for dispatch processing.
      </p>

      {/* Payment Instructions Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-left mb-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-1">
          Payment instructions
        </h3>
        <p className="text-xs text-amber-800">
          Payment instructions will be added here.
        </p>
      </div>

      {/* Summary lines */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left mb-6 divide-y divide-slate-200 text-xs">
        <div className="pb-3 space-y-1.5">
          {lines.map((l) => (
            <div key={l.lineKey} className="flex justify-between text-slate-700">
              <span>{l.quantity}x {l.product.name} {l.size ? `(${l.size})` : ''}</span>
              <span className="font-mono font-semibold">{formatKwacha(l.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="py-2 flex justify-between text-slate-600">
          <span>Delivery ({deliveryZone?.name || 'TBD'}):</span>
          <span className="font-mono font-semibold">{formatKwacha(deliveryZone?.fee || 0)}</span>
        </div>
        <div className="pt-2 flex justify-between font-bold text-slate-900 text-sm">
          <span>Total Amount:</span>
          <span className="font-mono text-base font-black text-[#1a2e4a]">{formatKwacha(total)}</span>
        </div>
      </div>

      {/* WhatsApp Support CTA */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={openWhatsApp}
          className="w-full py-3.5 bg-[#C0392B] hover:bg-[#a82e21] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-xs flex items-center justify-center gap-2"
        >
          <MessageCircle size={16} />
          <span>Enquire on WhatsApp about this order</span>
        </button>

        <Link to="/store" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold pt-2">
          <ArrowLeft size={14} />
          <span>Return to Store Front</span>
        </Link>
      </div>
    </div>
  );
};
