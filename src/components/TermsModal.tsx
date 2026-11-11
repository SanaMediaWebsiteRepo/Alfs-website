import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose?: () => void;
}

export default function TermsModal({ isOpen, onAccept, onClose }: TermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch logo on mount
  useEffect(() => {
    async function fetchLogo() {
      try {
        const { data } = await supabase.from('alfs_site_config').select('value').eq('id', 'site_logo').single();
        if (data?.value) {
          setLogoUrl(data.value);
        }
      } catch (err) {
        console.error('Error fetching site logo for TermsModal:', err);
      }
    }
    fetchLogo();
  }, []);

  // Reset scroll state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      // Let's do a micro-task check if the content is small enough to not need scrolling
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;
          if (scrollHeight <= clientHeight + 10) {
            setHasScrolledToBottom(true);
          }
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, clientHeight, scrollHeight } = target;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl rounded-lg overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        id="terms-modal-card"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3" id="terms-modal-header-brand">
            {logoUrl && <img src={logoUrl} alt="ALFS Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />}
            <div>
              <h2 className="text-lg font-black text-[#1B2A4A] uppercase tracking-wide" id="terms-modal-title">ALFS Terms & Conditions</h2>
              <p className="text-xs text-slate-500">Version 1 — Effective June 2026</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-[#C0392B] p-1.5 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer text-slate-400"
              aria-label="Close modal"
              id="terms-modal-close-btn"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="scrollable-content overflow-y-auto flex-1 px-6 py-4 text-sm text-slate-700 leading-relaxed space-y-4"
          id="terms-modal-body"
        >
          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">1. Acceptance of Terms</h3>
            <p>
              By creating an account on the ALFS Labour-Force Hub ("the Platform"), you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, you must not register for or use the Platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">2. Nature of Service</h3>
            <p>
              ALFS — Achilles Labour-Force Services operates solely as an intermediary platform connecting job seekers ("Employees") and businesses seeking labour ("Employers") within Zambia. ALFS does not employ Employees, does not act as an employer of record, and is not a party to any employment relationship, contract, or agreement formed between an Employee and an Employer through the Platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">3. No Liability</h3>
            <p>
              ALFS assumes no liability whatsoever for: the conduct, qualifications, reliability, or performance of any Employee or Employer; the accuracy of information submitted by any user; workplace safety, injury, illness, or death arising from any engagement; non-payment, underpayment, or disputes over wages or terms; the outcome, duration, or termination of any employment arrangement; or any direct, indirect, incidental, or consequential damages arising from use of the Platform. All employment relationships, including any contracts generated through the Platform, are formed directly and solely between the Employee and the Employer. ALFS's role ends at facilitating introduction and, where applicable, generating template documentation.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">4. Information You Provide</h3>
            <p>
              You agree that any information you submit — including but not limited to your full name, National Registration Card (NRC) number, phone number, employment history, certifications, and uploaded documents — is accurate, current, and provided voluntarily for the purpose of facilitating labour-force matching. You are solely responsible for the accuracy of this information. ALFS reserves the right to verify, reject, or remove any listing or account found to contain false, misleading, or fraudulent information.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">5. Data Collection and Use</h3>
            <p>
              ALFS collects and stores the information you provide in order to operate the Platform — including displaying your profile to prospective Employers or Employees, processing introduction requests, generating contract and PPE documentation, and maintaining records of platform activity. ALFS does not sell your personal information to third parties. Your information may be visible to other registered users of the Platform as reasonably necessary for the Platform's function (e.g. Employers viewing Employee trade listings, or vice versa). You may request correction or removal of your information by contacting ALFS directly.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">6. No Guarantee of Outcome</h3>
            <p>
              ALFS does not guarantee that any Employee will be hired, or that any Employer will successfully fill a position. Use of the Platform does not constitute a promise of employment, income, or business outcome of any kind.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">7. Account Conduct and Termination</h3>
            <p>
              You agree to use the Platform honestly and in good faith. ALFS reserves the right to suspend or permanently remove any account, listing, or content that it determines, in its sole discretion, to be fraudulent, abusive, harassing, unlawful, or otherwise in violation of these Terms — without prior notice.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">8. Communication</h3>
            <p>
              By registering, you consent to receive communications from ALFS via email, WhatsApp, or phone regarding your account, requests, or matters relating to the Platform's operation.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">9. Changes to These Terms</h3>
            <p>
              ALFS may update these Terms from time to time. Where changes are made, your continued use of the Platform following notice of such changes, or a renewed acceptance prompt, constitutes your agreement to the updated Terms.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">10. Contact Information Usage</h3>
            <p>
              Users who obtain contact details (phone numbers, email addresses) of other users through the Platform agree to use such information solely for the purpose of the specific introduction facilitated by ALFS. It is strictly prohibited to use contact details obtained through the Platform to bypass ALFS's introduction process in future engagements, or to contact other users for purposes unrelated to the Platform's function. ALFS reserves the right to permanently suspend any account found to be misusing contact information obtained through the Platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">11. Non-Payment of Platform Fees</h3>
            <p>
              Where ALFS introduces service fees for use of the Platform or for specific introduction services, all fees become due and payable upon the terms communicated at the time of introduction. In the event of non-payment of any applicable fees, ALFS reserves the right to suspend or terminate the relevant account, withhold further introductions, and pursue recovery of outstanding fees through such legal means as are available under the laws of the Republic of Zambia. ALFS further reserves the right to publish a record of non-paying accounts on the Platform to protect the interests of other users.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">12. Intellectual Property</h3>
            <p>
              All content generated by the Platform — including but not limited to PPE Checklists, contract templates, and platform documentation — remains the intellectual property of ALFS — Achilles Labour-Force Services. Users are granted a limited, non-transferable licence to use generated documents solely for the purpose of the specific employment arrangement to which they relate. Generated documents may not be reproduced, resold, or distributed for commercial purposes without ALFS's prior written consent.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">13. Worker Payment Disputes</h3>
            <p>
              ALFS is not a party to any wage or payment arrangement between Employers and Employees. If an Employer fails to pay agreed wages to an Employee introduced through the Platform, ALFS encourages the affected Employee to report this through the Platform's reporting mechanism. Upon receiving a substantiated non-payment complaint, ALFS reserves the right to suspend or permanently remove the non-compliant Employer's account pending investigation. ALFS may also, at its discretion, refer persistent non-payment cases to the Ministry of Labour and Social Security of the Republic of Zambia. ALFS assumes no financial liability for non-payment by any Employer.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-[#1B2A4A] mb-1">14. Governing Law</h3>
            <p>
              These Terms are governed by the laws of the Republic of Zambia.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50" id="terms-modal-footer">
          <div className="flex flex-col gap-1" id="terms-modal-footer-info">
            <span className="text-xs text-slate-500 font-medium" id="terms-modal-scroll-indicator">
              {hasScrolledToBottom ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  ✓ Thank you for reviewing our terms.
                </span>
              ) : (
                <span className="text-amber-600 animate-pulse">
                  ↓ Please scroll to the bottom to continue
                </span>
              )}
            </span>
            <a 
              href={`${import.meta.env.BASE_URL}labour/terms`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('pdf_download', { document: 'terms' })}
              className="text-[11px] text-[#1B2A4A] hover:text-[#C0392B] font-bold underline transition-colors w-fit"
            >
              View full terms in a new tab
            </a>
          </div>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
            className="bg-[#1B2A4A] text-white hover:bg-[#C0392B] disabled:bg-slate-300 disabled:text-slate-500 font-black text-xs uppercase tracking-wider px-6 py-3 min-h-[44px] rounded transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            id="terms-modal-accept-btn"
          >
            I Agree & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
