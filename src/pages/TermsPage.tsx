import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F2F2F2] py-12 px-4 font-sans" id="terms-page-wrapper">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-bold text-[#1B2A4A]/70 hover:text-[#1B2A4A] uppercase tracking-wider mb-6 cursor-pointer"
          id="terms-page-back-btn"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Brand Card Document */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200 p-6 md:p-10" id="terms-page-card">
          {/* Header/Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8" id="terms-page-header">
            <div className="flex items-center gap-3">
              <img src="/alfs-logo.png" alt="ALFS Logo" className="h-14 w-auto object-contain" referrerPolicy="no-referrer" />
              <div>
                <h1 className="text-xl md:text-2xl font-black text-[#1B2A4A] uppercase tracking-wide">ALFS Terms & Conditions</h1>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">Version 1 — Effective June 2026</p>
              </div>
            </div>
            <div className="text-left sm:text-right font-mono text-[10px] text-slate-400">
              <p>Achilles Labour-Force Services</p>
              <p>Zambia</p>
            </div>
          </div>

          {/* Full Terms Content */}
          <div className="text-sm text-slate-700 leading-relaxed space-y-6" id="terms-page-body">
            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">1. Acceptance of Terms</h3>
              <p>
                By creating an account on the ALFS Labour-Force Hub ("the Platform"), you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree, you must not register for or use the Platform.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">2. Nature of Service</h3>
              <p>
                ALFS — Achilles Labour-Force Services operates solely as an intermediary platform connecting job seekers ("Employees") and businesses seeking labour ("Employers") within Zambia. ALFS does not employ Employees, does not act as an employer of record, and is not a party to any employment relationship, contract, or agreement formed between an Employee and an Employer through the Platform.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">3. No Liability</h3>
              <p>
                ALFS assumes no liability whatsoever for: the conduct, qualifications, reliability, or performance of any Employee or Employer; the accuracy of information submitted by any user; workplace safety, injury, illness, or death arising from any engagement; non-payment, underpayment, or disputes over wages or terms; the outcome, duration, or termination of any employment arrangement; or any direct, indirect, incidental, or consequential damages arising from use of the Platform. All employment relationships, including any contracts generated through the Platform, are formed directly and solely between the Employee and the Employer. ALFS's role ends at facilitating introduction and, where applicable, generating template documentation.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">4. Information You Provide</h3>
              <p>
                You agree that any information you submit — including but not limited to your full name, National Registration Card (NRC) number, phone number, employment history, certifications, and uploaded documents — is accurate, current, and provided voluntarily for the purpose of facilitating labour-force matching. You are solely responsible for the accuracy of this information. ALFS reserves the right to verify, reject, or remove any listing or account found to contain false, misleading, or fraudulent information.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">5. Data Collection and Use</h3>
              <p>
                ALFS collects and stores the information you provide in order to operate the Platform — including displaying your profile to prospective Employers or Employees, processing introduction requests, generating contract and PPE documentation, and maintaining records of platform activity. ALFS does not sell your personal information to third parties. Your information may be visible to other registered users of the Platform as reasonably necessary for the Platform's function (e.g. Employers viewing Employee trade listings, or vice versa). You may request correction or removal of your information by contacting ALFS directly.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">6. No Guarantee of Outcome</h3>
              <p>
                ALFS does not guarantee that any Employee will be hired, or that any Employer will successfully fill a position. Use of the Platform does not constitute a promise of employment, income, or business outcome of any kind.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">7. Account Conduct and Termination</h3>
              <p>
                You agree to use the Platform honestly and in good faith. ALFS reserves the right to suspend or permanently remove any account, listing, or content that it determines, in its sole discretion, to be fraudulent, abusive, harassing, unlawful, or otherwise in violation of these Terms — without prior notice.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">8. Communication</h3>
              <p>
                By registering, you consent to receive communications from ALFS via email, WhatsApp, or phone regarding your account, requests, or matters relating to the Platform's operation.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">9. Changes to These Terms</h3>
              <p>
                ALFS may update these Terms from time to time. Where changes are made, your continued use of the Platform following notice of such changes, or a renewed acceptance prompt, constitutes your agreement to the updated Terms.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">10. Contact Information Usage</h3>
              <p>
                Users who obtain contact details (phone numbers, email addresses) of other users through the Platform agree to use such information solely for the purpose of the specific introduction facilitated by ALFS. It is strictly prohibited to use contact details obtained through the Platform to bypass ALFS's introduction process in future engagements, or to contact other users for purposes unrelated to the Platform's function. ALFS reserves the right to permanently suspend any account found to be misusing contact information obtained through the Platform.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">11. Non-Payment of Platform Fees</h3>
              <p>
                Where ALFS introduces service fees for use of the Platform or for specific introduction services, all fees become due and payable upon the terms communicated at the time of introduction. In the event of non-payment of any applicable fees, ALFS reserves the right to suspend or terminate the relevant account, withhold further introductions, and pursue recovery of outstanding fees through such legal means as are available under the laws of the Republic of Zambia. ALFS further reserves the right to publish a record of non-paying accounts on the Platform to protect the interests of other users.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">12. Intellectual Property</h3>
              <p>
                All content generated by the Platform — including but not limited to PPE Checklists, contract templates, and platform documentation — remains the intellectual property of ALFS — Achilles Labour-Force Services. Users are granted a limited, non-transferable licence to use generated documents solely for the purpose of the specific employment arrangement to which they relate. Generated documents may not be reproduced, resold, or distributed for commercial purposes without ALFS's prior written consent.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">13. Worker Payment Disputes</h3>
              <p>
                ALFS is not a party to any wage or payment arrangement between Employers and Employees. If an Employer fails to pay agreed wages to an Employee introduced through the Platform, ALFS encourages the affected Employee to report this through the Platform's reporting mechanism. Upon receiving a substantiated non-payment complaint, ALFS reserves the right to suspend or permanently remove the non-compliant Employer's account pending investigation. ALFS may also, at its discretion, refer persistent non-payment cases to the Ministry of Labour and Social Security of the Republic of Zambia. ALFS assumes no financial liability for non-payment by any Employer.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[#1B2A4A] text-base mb-2">14. Governing Law</h3>
              <p>
                These Terms are governed by the laws of the Republic of Zambia.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 mt-10 pt-6 text-center text-xs text-slate-400 font-mono">
            © 2026 Achilles Labour-Force Services Limited. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
