import React from 'react';
import { AlertCircle, HelpCircle, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { activateSandbox } from '../lib/dbClient';

interface SupabaseErrorPromptProps {
  customMessage?: string;
  onRefresh?: () => void;
}

export default function SupabaseErrorPrompt({ customMessage, onRefresh }: SupabaseErrorPromptProps) {
  const currentSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const isUnconfigured = !currentSupabaseUrl || currentSupabaseUrl.includes('placeholder') || currentSupabaseUrl === '';

  const handleActivateSandbox = () => {
    activateSandbox();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 font-sans">
      <div className="bg-white border-4 border-[#C0392B] shadow-2xl p-8 md:p-12 text-[#0A0A0A] relative overflow-hidden">
        
        {/* Absolute Background Accent */}
        <div className="absolute right-0 top-0 bg-[#C0392B]/5 text-[#C0392B]/10 font-bold text-9xl tracking-tighter select-none pointer-events-none transform translate-x-12 -translate-y-6 select-none font-sans uppercase">
          ALFS
        </div>

        {/* Connection Block Header */}
        <div className="flex items-start gap-4 mb-6 border-b border-rose-100 pb-6 relative z-10">
          <div className="bg-[#C0392B]/10 p-3 text-[#C0392B] shrink-0">
            <AlertCircle size={32} />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#C0392B] uppercase block mb-1">
              DATABASE INTEGRATION NOTICE
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#1B2A4A]">
              {isUnconfigured 
                ? 'Supabase Connection Keys Missing' 
                : 'Connection Unreachable (Failed to Fetch)'}
            </h2>
            <p className="text-xs text-[#1B2A4A]/60 font-semibold mt-1">
              The Achilles Labour-Force registry requires active Supabase authentication and table schemas to operate in production mode.
            </p>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 relative z-10">
          <div>
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#1B2A4A] mb-3 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-[#C0392B]" />
              <span>What happened?</span>
            </h3>
            <p className="text-[#1B2A4A]/80 text-xs leading-relaxed mb-4">
              Your preview container or local client attempted to call the Supabase API to retrieve registered tradesmen or authenticate session security, but the request was unsuccessful.
            </p>
            <p className="text-[#1B2A4A]/80 text-xs leading-relaxed">
              {customMessage || "This is usually caused by missing/invalid variables in your environment, or because SQL tables have not been created yet."}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#1B2A4A] mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>How do I set this up permanently?</span>
            </h3>
            <ol className="list-decimal pl-5 text-xs text-[#1B2A4A]/70 space-y-2 font-medium">
              <li>
                Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#C0392B] font-bold underline inline-flex items-center gap-0.5">
                  supabase.com <ExternalLink size={10} />
                </a>
              </li>
              <li>
                Go to <span className="font-bold">Project Settings &rarr; API</span> and copy your URL and <span className="font-bold">anon public</span> API Key.
              </li>
              <li>
                Add them into your environment setup as <code className="bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-[#C0392B]">VITE_SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-[#C0392B]">VITE_SUPABASE_ANON_KEY</code>.
              </li>
              <li>
                Open the Supreme database SQL Editor and execute the schema commands specified in <code className="bg-slate-100 px-1 py-0.5 text-[10px] font-mono">/supabase_schema.sql</code>.
              </li>
            </ol>
          </div>
        </div>

        {/* Immediate Instant Play Action CTA */}
        <div className="bg-[#1B2A4A]/5 border border-[#1B2A4A]/10 p-6 flex flex-col md:flex-row justify-between items-center gap-5 relative z-10">
          <div className="text-center md:text-left">
            <h4 className="font-sans font-black text-xs uppercase text-[#1B2A4A] tracking-wider mb-1">
              Want to review the App instantly?
            </h4>
            <p className="text-[11px] text-[#1B2A4A]/70 font-semibold leading-relaxed">
              No Supabase account? Click activate sandbox to test the fully functional app. It populates professional Zambian seekers, recruiters, search lists, and admin views locally.
            </p>
          </div>
          
          <div className="flex shrink-0 gap-2.5 w-full md:w-auto">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="bg-white border-2 border-[#1B2A4A]/30 text-[#1B2A4A] hover:border-[#1B2A4A] font-black uppercase text-[10px] tracking-wider px-4 py-3 flex.1 text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>Retry</span>
              </button>
            )}
            <button
              onClick={handleActivateSandbox}
              className="bg-[#C0392B] hover:bg-[#1B2A4A] border-2 border-transparent text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 shrink-0 text-center cursor-pointer transition-colors"
            >
              Activate Sandbox Mode
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
