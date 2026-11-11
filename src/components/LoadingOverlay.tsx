import { motion } from 'motion/react';

interface LoadingOverlayProps {
  siteLogo?: string;
  key?: string | number;
}

export default function LoadingOverlay({ siteLogo }: LoadingOverlayProps) {
  return (
    <motion.div
      initial={{ y: '0%' }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.65, ease: [0.4, 0, 1, 1] }}
      style={{ willChange: 'transform' }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center min-h-screen gap-3 relative overflow-hidden"
    >
      {/* Background site logo watermark (opacity 0.15, not animated separately) */}
      {siteLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-15">
          <img 
            src={siteLogo} 
            alt="Site Logo Watermark" 
            className="max-w-[70vw] max-h-[50vh] object-contain"
          />
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3">
        {/* BEAT 1: Geometric Hard Hat SVG Icon (delay 0s, duration 0.35s) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0, ease: [0.0, 0.0, 0.2, 1] }}
          className="flex items-center justify-center"
        >
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 48 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 30 H40" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 30 Q6 26 10 26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M42 30 Q42 26 38 26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 26 Q10 14 24 14 Q38 14 38 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M24 14 L24 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M20 10 H28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </motion.div>

        {/* BEAT 2: Horizontal Line Divider (delay 0.35s, duration 0.4s) */}
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.0, 0.0, 0.2, 1] }}
          style={{ transformOrigin: 'center' }}
          className="h-[2px] w-[56px] md:w-[72px] bg-[#E63946]"
        />

        {/* BEAT 3: ALFS LIMITED Text Row (delays 0.75s and 0.85s) */}
        <div className="flex items-center justify-center gap-2 md:gap-3 leading-none select-none">
          <motion.span
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.75, ease: [0.0, 0.0, 0.2, 1] }}
            className="font-bebas text-5xl text-white tracking-wider"
          >
            ALFS
          </motion.span>
          <motion.span
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.85, ease: [0.0, 0.0, 0.2, 1] }}
            className="font-bebas text-5xl text-[#E63946] tracking-wider"
          >
            LIMITED
          </motion.span>
        </div>

        {/* BEAT 4: Subtitle Text (delay 1.05s, duration 0.3s) */}
        <motion.div
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 1, letterSpacing: '0.35em' }}
          transition={{ duration: 0.3, delay: 1.05, ease: [0.25, 0, 0, 1] }}
          className="text-[10px] uppercase font-bold text-white/50 tracking-[0.35em] text-center"
        >
          ZAMBIA&apos;S PREMIER SUPPLY PARTNER
        </motion.div>
      </div>
    </motion.div>
  );
}
