import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { dbClient, isSandboxActive, isSupabasePropertiesLoaded } from '../lib/dbClient';
import { User, Phone, Mail, Briefcase, MapPin, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import SupabaseErrorPrompt from '../components/SupabaseErrorPrompt';
import TermsModal from '../components/TermsModal';

const TRADE_CATEGORIES = [
  'Civil Works',
  'Structural Works',
  'Plumbing Works',
  'Electrical Works',
  'Mechanical Works',
  'HVAC Works',
  'Finishing Works',
  'Plant & Equipment Operators',
  'Site Management & Professional Services',
  'HSE & Quality',
  'General Labour',
];

const PROVINCES = [
  'Lusaka', 'Copperbelt', 'Central', 'Southern', 'Eastern',
  'Western', 'Northern', 'North-Western', 'Luapula', 'Muchinga',
];

export default function LabourQuickJoin() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [trade, setTrade] = useState('');
  const [region, setRegion] = useState('Lusaka');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showConfigPrompt] = useState(!isSupabasePropertiesLoaded() && !isSandboxActive());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !phone.trim() || !email.trim() || !trade || !region) {
      setErrorMessage('Please fill in every field so we can match you to the right jobs.');
      return;
    }
    if (!termsAccepted) {
      setShowTermsModal(true);
      setErrorMessage('Please accept the Terms & Conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await dbClient.quickRegisterSeeker({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        trade,
        region,
        website,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showConfigPrompt) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center py-10">
        <SupabaseErrorPrompt customMessage="Registration requires active configuration keys." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-3 md:mb-4 flex justify-start">
          <Link to="/labour" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1B2A4A] transition-colors">
            <ArrowLeft size={16} />
            <span>Back to Labour Hub</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-100 p-4 sm:p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-800">You're registered!</h2>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Check <span className="font-semibold text-slate-700">{email}</span> for a link to set your password and finish your profile — add your photo, NRC and certifications so employers can find you faster.
              </p>
              <Link to="/labour" className="inline-block mt-4 text-xs font-bold uppercase tracking-wider text-[#C41E3A] hover:underline">
                Back to Labour Hub
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#1B2A4A]">
                  ALFS <span className="text-[#C41E3A]">LABOUR</span>
                </h1>
                <p className="mt-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Quick Registration
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  No password needed right now — just the basics, and we'll email you a link to finish setting up.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-[#C41E3A] text-[#C41E3A] rounded-r-lg text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chilufya Kabwe"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+260 XX XXX XXXX"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 font-medium lowercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">Trade / Skill Area</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase size={16} />
                    </div>
                    <select
                      required
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      className="block w-full pl-10 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 font-medium appearance-none"
                    >
                      <option value="">Select a category...</option>
                      {TRADE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">Region</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <select
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="block w-full pl-10 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 font-medium appearance-none"
                    >
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${!termsAccepted && errorMessage.toLowerCase().includes('terms') ? 'bg-red-50 border border-red-200 ring-2 ring-red-400/30' : ''}`}>
                  <input
                    type="checkbox"
                    id="quick-terms-checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1B2A4A] accent-[#1B2A4A] cursor-pointer"
                  />
                  <label htmlFor="quick-terms-checkbox" className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none">
                    I agree to the{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#1B2A4A] font-bold underline hover:text-[#C41E3A] transition-colors">
                      Terms & Conditions
                    </button>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C41E3A] hover:bg-[#A9172F] text-white h-[46px] rounded-lg font-bold uppercase tracking-wider text-xs sm:text-sm shadow-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <span>Get Registered</span>}
                </button>
              </form>

              <p className="mt-5 text-center text-[11px] text-slate-400">
                Prefer to set a password now?{' '}
                <Link to="/labour/auth?mode=register&role=seeker" className="text-[#1B2A4A] font-bold underline">
                  Use the full sign-up form
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
}
