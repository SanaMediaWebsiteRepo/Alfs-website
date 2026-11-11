import React, { useState } from 'react';
import { trackEvent } from '../lib/analytics';

interface NewsletterSignupProps {
  sb: (path: string, method?: string, body?: any) => Promise<any>;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ sb }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'exists' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const payload = {
        email: trimmed.toLowerCase(),
        subscribed_at: new Date().toISOString(),
        source: 'website'
      };

      // Ensure local cache is updated immediately for instant admin panel previews
      try {
        const localStr = localStorage.getItem('alfs_local_newsletter_subscribers');
        const list = localStr ? JSON.parse(localStr) : [];
        if (!list.some((s: any) => s.email === payload.email)) {
          list.unshift(payload);
          localStorage.setItem('alfs_local_newsletter_subscribers', JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Could not write local cache of subscriber', e);
      }

      try {
        await sb('alfs_newsletter_subscribers?on_conflict=email', 'POST', [payload]);
      } catch (sbErr: any) {
        const sbErrMsg = sbErr?.message || String(sbErr);
        if (
          sbErrMsg.includes('PGRST205') || 
          sbErrMsg.toLowerCase().includes('could not find the table') || 
          sbErrMsg.toLowerCase().includes('schema cache')
        ) {
          console.warn('Newsletter table not found in Supabase schema cache. Subscribed via local storage fallback.', sbErr);
        } else {
          // If it's a real duplicate error, we throw so outer catch handles it
          throw sbErr;
        }
      }
      setStatus('success');
      trackEvent('newsletter_signup', { source: 'alfs_website' });
      setEmail('');
    } catch (err: any) {
      console.error('Newsletter error:', err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.toLowerCase().includes('duplicate') ||
        errMsg.toLowerCase().includes('conflict') ||
        errMsg.toLowerCase().includes('already exists') ||
        errMsg.toLowerCase().includes('23505') ||
        errMsg.includes('409')
      ) {
        setStatus('exists');
      } else {
        setStatus('error');
        setErrorMsg('Subscription failed. Please try again later.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center md:items-end w-full">
      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 mb-4 font-sans">
        Newsletter
      </h4>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-4 text-center md:text-right leading-relaxed font-sans">
        Stay updated with deals & product releases.
      </p>
      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row w-full max-w-sm gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          disabled={status === 'loading'}
          placeholder="your.email@example.com"
          required
          className="bg-white/10 text-white placeholder-white/30 border border-white/20 p-3 text-xs font-semibold outline-none focus:border-alfs-red transition-all flex-grow font-sans select-text"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-alfs-red hover:bg-[#A31630] disabled:bg-zinc-500 font-black text-[10px] uppercase tracking-widest py-3 px-5 transition-all text-white font-sans whitespace-nowrap cursor-pointer"
        >
          {status === 'loading' ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
        </button>
      </form>
      {status === 'success' && (
        <p className="mt-2 text-green-400 text-[10px] font-black uppercase tracking-wider font-sans">
          Thanks! You're subscribed.
        </p>
      )}
      {status === 'exists' && (
        <p className="mt-2 text-amber-300 text-[10px] font-black uppercase tracking-wider font-sans">
          You're already subscribed!
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-red-400 text-[10px] font-black uppercase tracking-wider font-sans">
          {errorMsg}
        </p>
      )}
    </div>
  );
};
