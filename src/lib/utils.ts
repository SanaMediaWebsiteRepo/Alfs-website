import { trackEvent } from './analytics';

export const waLink = (msg: string) => `https://wa.me/260962334797?text=${encodeURIComponent(msg)}`;

export const handleWhatsAppChat = (message: string) => {
  trackEvent('whatsapp_click', { location: 'catalogue' });
  window.open(waLink(message), '_blank');
};
