import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, MessageCircle, Phone, X, Plus } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { SHOW_PRODUCTS } from '../config/features';

interface FloatingActionsProps {
  cartCount: number;
  onCartOpen: () => void;
  whatsappNumber: string;
}

export default function FloatingActions({ cartCount, onCartOpen, whatsappNumber }: FloatingActionsProps) {
  const [open, setOpen] = useState(false);

  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello ALFS! I'd like to enquire about your products.")}`;
  const callHref = `tel:+${whatsappNumber}`;

  const buttons = [
    ...(SHOW_PRODUCTS ? [{
      icon: <ShoppingCart size={20} />,
      label: 'Order List',
      onClick: () => { onCartOpen(); setOpen(false); },
      bg: 'bg-alfs-red',
      badge: cartCount > 0 ? cartCount : null,
    }] : []),
    {
      icon: <MessageCircle size={20} />,
      label: 'WhatsApp',
      href: waHref,
      onClick: () => trackEvent('whatsapp_click', { location: 'floating_button' }),
      bg: 'bg-[#25D366]',
    },
    {
      icon: <Phone size={20} />,
      label: 'Call Us',
      href: callHref,
      onClick: () => trackEvent('call_click', { location: 'floating_button' }),
      bg: 'bg-alfs-blue',
    },
  ];

  return (
    <div className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-[1000] flex flex-col items-end gap-3">
      {/* Action buttons — expand upward */}
      <AnimatePresence>
        {open && (
          <>
            {buttons.map((btn, i) => (
              <motion.div
                key={btn.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                className="flex items-center gap-3 justify-end"
              >
                {/* Label */}
                <span className="bg-alfs-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 shadow-lg whitespace-nowrap">
                  {btn.label}
                </span>

                {/* Button */}
                {btn.href ? (
                  <a
                    href={btn.href}
                    onClick={btn.onClick}
                    target={btn.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className={`${btn.bg} text-white w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow-xl active:scale-95 transition-transform flex-shrink-0`}
                  >
                    {btn.icon}
                  </a>
                ) : (
                  <button
                    onClick={btn.onClick}
                    className={`${btn.bg} text-white w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow-xl active:scale-95 transition-transform flex-shrink-0 relative`}
                  >
                    {btn.icon}
                    {btn.badge && (
                      <span className="absolute -top-1.5 -right-1.5 bg-white text-alfs-red text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-alfs-red">
                        {btn.badge > 9 ? '9+' : btn.badge}
                      </span>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB toggle */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.92 }}
        className="bg-alfs-black text-white w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-2xl relative"
        aria-label="Quick actions"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Plus size={24} />
        </motion.div>

        {/* Cart badge on the main button when closed */}
        {!open && SHOW_PRODUCTS && cartCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 bg-alfs-red text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center"
          >
            {cartCount > 9 ? '9+' : cartCount}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}
