import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { dbClient, isSandboxActive, isSupabasePropertiesLoaded, deactivateSandbox } from '../lib/dbClient';
import { supabase } from '../lib/supabase';
import { KeyRound, Mail, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, User, CheckCircle2 } from 'lucide-react';
import SupabaseErrorPrompt from '../components/SupabaseErrorPrompt';
import TermsModal from '../components/TermsModal';

export default function LabourAuth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active View: 'login' | 'register' | 'forgot'
  const [activeView, setActiveView] = useState<'login' | 'register' | 'forgot'>('login');

  // Register Fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Login Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState('');

  // UI Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);
  const [siteLogo, setSiteLogo] = useState('');

  useEffect(() => {
    const fetchSiteLogo = async () => {
      try {
        const { data } = await supabase.from('alfs_site_config').select('value').eq('id', 'site_logo').single();
        if (data?.value) setSiteLogo(data.value);
      } catch (err) {
        console.error('Error fetching site logo:', err);
      }
    };
    fetchSiteLogo();
  }, []);

  // Admin Emails Constant
  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || 'admin@alfslimited.com')
    .split(',')
    .map((e: string) => e.trim().toLowerCase());

  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const originalContent = viewportMeta 
      ? viewportMeta.getAttribute('content') 
      : 'width=device-width, initial-scale=1.0';
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }

    return () => {
      if (viewportMeta && originalContent) {
        viewportMeta.setAttribute('content', originalContent);
      }
    };
  }, []);

  useEffect(() => {
    // Check configuration parameters
    if (!isSupabasePropertiesLoaded() && !isSandboxActive()) {
      setShowConfigPrompt(true);
    }

    const modeParam = searchParams.get('mode');
    const roleParam = searchParams.get('role');

    if (modeParam === 'register') {
      setActiveView('register');
    } else if (modeParam === 'forgot') {
      setActiveView('forgot');
    } else {
      setActiveView('login');
    }

    if (roleParam === 'employer') {
      setRole('employer');
    } else {
      setRole('seeker');
    }
  }, [searchParams]);

  // Handle forms submission
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (activeView === 'register') {
        // Validation
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (regPassword !== regConfirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (regPassword.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (!termsAccepted) {
          setShowTermsModal(true);
          throw new Error('You must accept the Terms & Conditions to register.');
        }

        const { data, error } = await dbClient.signUp(regEmail, regPassword, role, fullName);

        if (error) throw error;

        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          if (regEmail && ADMIN_EMAILS.includes(regEmail.toLowerCase())) {
            navigate('/admin');
          } else {
            navigate('/labour/dashboard');
          }
        }, 1200);

      } else if (activeView === 'login') {
        const { data, error } = await dbClient.signIn(loginEmail, loginPassword);

        if (error) {
          if (error.message?.toLowerCase().includes('email not confirmed') || error.message?.toLowerCase().includes('confirm your email')) {
            throw new Error('Please verify your email before logging in');
          }
          throw error;
        }

        if (data?.user) {
          const user = data.user;
          



          const userEmail = user.email;
          const userRole = user.user_metadata?.role || 'seeker';

          setSuccessMessage('Successfully signed in. Redirecting...');

          setTimeout(async () => {
            if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
              navigate('/admin');
              return;
            }
            navigate('/labour/dashboard');
          }, 1200);
        } else {
          throw new Error('Authentication failed. Please verify your credentials.');
        }

      } else if (activeView === 'forgot') {
        if (!forgotEmail.trim()) {
          throw new Error('Please enter your registered email address.');
        }

        const resetURL = window.location.origin + import.meta.env.BASE_URL + 'labour/reset-password';
        const { error } = await dbClient.resetPasswordForEmail(forgotEmail, resetURL);

        if (error) throw error;

        setSuccessMessage('Password reset link sent. Check your email.');
        setForgotEmail('');
      }
    } catch (err: any) {
      const isCredentialsError = err.message?.toLowerCase().includes('credentials') || err.message?.toLowerCase().includes('password');
      const isFetchError = err.message?.toLowerCase().includes('failed to fetch');
      const isAlreadyRegisteredError = err.message?.toLowerCase().includes('already registered') || 
                                       err.message?.toLowerCase().includes('already exists') || 
                                       err.message?.toLowerCase().includes('already in use');

      if (isCredentialsError) {
        console.warn('Authentication mismatch (handled):', err.message);
      } else if (isFetchError) {
        console.warn('Authentication fetch/network error (handled):', err.message);
      } else if (isAlreadyRegisteredError) {
        console.warn('User already registered (handled):', err.message);
      } else {
        console.error('Auth exception:', err);
      }
      if (isFetchError) {
        setShowConfigPrompt(true);
      }
      
      let friendlyError = err.message || 'An unexpected error occurred during authentication.';
      if (isAlreadyRegisteredError) {
        friendlyError = 'This email address is already registered. Please sign in above or reset your password if you forgot it.';
      }
      setErrorMessage(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSandbox = () => {
    deactivateSandbox();
    window.location.reload();
  };

  // Switch wrapper helpers to clear alerts
  const switchView = (view: 'login' | 'register' | 'forgot') => {
    setActiveView(view);
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (showConfigPrompt && !isSandboxActive()) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center py-10">
        <div className="absolute top-6 left-6">
          <Link 
            to="/labour" 
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1B2A4A] hover:text-[#C0392B] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Labour Hub</span>
          </Link>
        </div>
        <SupabaseErrorPrompt 
          customMessage="Authentication operations require active configuration keys. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY inside your settings pane or activate Sandbox Mode below." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center py-6 md:py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-[#C41E3A]/10 selection:text-[#C41E3A]">
      
      {/* Sandbox Mode Ribbon */}
      {isSandboxActive() && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 px-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] flex justify-center items-center gap-4 shadow-sm z-50">
          <span>RUNNING IN MEMORY SANDBOX MODE (OFFLINE DEMO)</span>
          <button 
            onClick={handleDisableSandbox}
            className="bg-black/20 hover:bg-black/40 text-white px-2.5 py-0.5 text-[9px] font-black uppercase transition-all rounded"
          >
            Exit Sandbox & Retry Real URL
          </button>
        </div>
      )}

      {/* Main card box container */}
      <div className="w-full max-w-md relative pt-4">
        
        {/* Back Link */}
        <div className="mb-3 md:mb-4 flex justify-start">
          <Link 
            to="/labour" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1B2A4A] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Labour Hub</span>
          </Link>
        </div>

        {/* Refined Card */}
        <div className="bg-white rounded-xl shadow border border-slate-100 p-4 sm:p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
          
          {/* Header Branding */}
          <div className="text-center mb-4 md:mb-6">
            {siteLogo && (
              <img src={siteLogo} alt="ALFS Logo" className="h-10 w-auto object-contain mx-auto mb-1.5" />
            )}
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1B2A4A] select-none text-center">
              ALFS <span className="text-[#C41E3A]">LABOUR</span>
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider">
              Zambia's Labour Force Platform
            </p>
          </div>

          <div className="mb-3 md:mb-4 text-center">
            <h2 className="text-base font-bold text-slate-800">
              {activeView === 'login' && 'Sign In to Your Account'}
              {activeView === 'register' && 'Create a New Account'}
              {activeView === 'forgot' && 'Reset Password'}
            </h2>
            {activeView === 'register' && (
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Bridge the gap between employee and employer
              </p>
            )}
            {activeView === 'forgot' && (
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Retrieve password recovery parameters
              </p>
            )}
          </div>

          <div className="relative">
            
            {/* Custom Tabs */}
            {activeView !== 'forgot' && (
              <div className="flex bg-[#F4F5F7] p-1.5 rounded-xl gap-1 mb-4 md:mb-6">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm rounded-lg transition-all cursor-pointer ${
                    activeView === 'login' 
                      ? 'bg-[#1B2A4A] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className={`flex-1 py-2.5 text-center font-bold text-xs sm:text-sm rounded-lg transition-all cursor-pointer ${
                    activeView === 'register' 
                      ? 'bg-[#1B2A4A] text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Feedback messages */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border-l-4 border-[#C41E3A] text-[#C41E3A] rounded-r-lg text-xs flex items-start gap-2.5 shadow-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-r-lg text-xs flex items-start gap-2.5 shadow-xs">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {/* REGISTER VIEW ADDITIONAL FIELDS */}
              {activeView === 'register' && (
                <>
                  {/* Full name */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                      Full Name <span className="text-[#C41E3A]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User size={16} />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chilufya Kabwe"
                        className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  {/* Email address */}
                  <div>
                    <label htmlFor="regEmail" className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                      Email address <span className="text-[#C41E3A]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        id="regEmail"
                        name="regEmail"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium lowercase"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="regPassword" className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                      Password <span className="text-[#C41E3A]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} />
                      </div>
                      <input
                        id="regPassword"
                        name="regPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="block w-full pl-10 pr-10 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1B2A4A] transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label htmlFor="regConfirmPassword" className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                      Confirm Password <span className="text-[#C41E3A]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} />
                      </div>
                      <input
                        id="regConfirmPassword"
                        name="regConfirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="block w-full pl-10 pr-10 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1B2A4A] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Classification simple toggle buttons */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                      I am a... <span className="text-[#C41E3A]">*</span>
                    </label>
                    <div className="grid grid-cols-2 bg-[#F4F5F7] p-1.5 rounded-xl gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRole('seeker')}
                        className={`h-[38px] flex items-center justify-center font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                          role === 'seeker'
                            ? 'bg-[#1B2A4A] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
                        }`}
                      >
                        Job Seeker
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`h-[38px] flex items-center justify-center font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                          role === 'employer'
                            ? 'bg-[#1B2A4A] text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
                        }`}
                      >
                        Employer
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* LOGIN VIEW FIELDS */}
              {activeView === 'login' && (
                <>
                  {/* Email address */}
                  <div>
                    <label htmlFor="loginEmail" className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        id="loginEmail"
                        name="loginEmail"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="loginPassword" className="block text-xs font-bold uppercase tracking-wide text-slate-[#1B2A4A]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-xs font-bold uppercase tracking-wider text-[#C41E3A] hover:text-[#A9172F] transition-colors cursor-pointer animate-none bg-transparent"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} />
                      </div>
                      <input
                        id="loginPassword"
                        name="loginPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-10 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1B2A4A] transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* FORGOT PASSWORD VIEW FIELDS */}
              {activeView === 'forgot' && (
                <>
                  <div className="border-l-4 border-[#C41E3A] bg-slate-50 p-3.5 mb-3 rounded-r-lg text-xs font-medium leading-relaxed text-slate-600">
                    Enter your registered email address below. We'll send you a password reset link to update your credentials securely.
                  </div>
                  {/* Email Address */}
                  <div>
                    <label htmlFor="forgotEmail" className="block text-xs font-bold uppercase tracking-wide text-slate-705 mb-1.5">
                       Registrant Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        id="forgotEmail"
                        name="forgotEmail"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeView === 'register' && (
                <div className={`flex items-start gap-2.5 my-3 p-2 rounded-lg transition-colors ${!termsAccepted && errorMessage.toLowerCase().includes('terms') ? 'bg-red-50 border border-red-200 ring-2 ring-red-400/30' : ''}`}>
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#1B2A4A] accent-[#1B2A4A] cursor-pointer"
                  />
                  <label htmlFor="terms-checkbox" className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none">
                    I agree to the{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#1B2A4A] font-bold underline hover:text-[#C41E3A] transition-colors">
                      Terms & Conditions
                    </button>
                  </label>
                </div>
              )}

              {/* Core Action Button (ALFS Red - #C41E3A) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C41E3A] hover:bg-[#A9172F] text-white h-[46px] rounded-lg font-bold uppercase tracking-wider text-xs sm:text-sm shadow-md transition-colors flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin shrink-0" size={16} />
                      <span>Processing Link...</span>
                    </>
                  ) : (
                    <>
                      {activeView === 'login' && <span>SIGN IN</span>}
                      {activeView === 'register' && <span>REGISTER</span>}
                      {activeView === 'forgot' && <span>SEND RESET LINK</span>}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Alternate flow links */}
            {activeView === 'forgot' && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-xs font-bold uppercase tracking-wider text-slate-450 hover:text-[#1B2A4A] transition-colors underline bg-transparent border-0 cursor-pointer"
                >
                  Back to login
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Terms Modal */}
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
