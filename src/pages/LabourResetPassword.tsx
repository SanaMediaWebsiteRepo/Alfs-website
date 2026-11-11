import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dbClient, isSandboxActive, isSupabasePropertiesLoaded, deactivateSandbox } from '../lib/dbClient';
import { KeyRound, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import SupabaseErrorPrompt from '../components/SupabaseErrorPrompt';

export default function LabourResetPassword() {
  const navigate = useNavigate();

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI visibilities
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);

  useEffect(() => {
    if (!isSupabasePropertiesLoaded() && !isSandboxActive()) {
      setShowConfigPrompt(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      // Validate Match
      if (!newPassword.trim()) {
        throw new Error('Please enter a new password.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Confirm password does not match the new password.');
      }
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters in length for cryptographic compliance.');
      }

      // Perform update
      const { error } = await dbClient.updateUser({ password: newPassword });

      if (error) throw error;

      setSuccessMessage('Password updated successfully');

      // Clear state
      setNewPassword('');
      setConfirmPassword('');

      // Redirect back to login
      setTimeout(() => {
        navigate('/labour/auth?mode=login');
      }, 2000);

    } catch (err: any) {
      const isFetchError = err.message?.toLowerCase().includes('failed to fetch');
      if (isFetchError) {
        console.warn('Password reset network / fetch error (handled):', err);
        setShowConfigPrompt(true);
      } else {
        console.error('Password reset failure:', err);
      }
      setErrorMessage(err.message || 'An unexpected error occurred while updating your credential settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSandbox = () => {
    deactivateSandbox();
    window.location.reload();
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
          customMessage="Restoring credentials requires active database connections. Please check your Supabase environment configurations or test offline using the Demo Sandbox." 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center py-12 px-6 lg:px-8 font-sans selection:bg-[#C0392B]/10 selection:text-[#C0392B] relative">
      {/* Sandbox Mode Ribbon */}
      {isSandboxActive() && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] flex justify-center items-center gap-4 shadow-sm z-50">
          <span>RUNNING IN MEMORY SANDBOX MODE (OFFLINE DEMO)</span>
          <button 
            onClick={handleDisableSandbox}
            className="bg-black/20 hover:bg-black/40 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase transition-colors rounded"
          >
            Exit Sandbox & Retry Real URL
          </button>
        </div>
      )}

      {/* Back to Hub / Auth Link */}
      <div className="absolute top-8 left-6">
        <Link 
          to="/labour/auth?mode=login" 
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#1B2A4A] hover:text-[#C0392B] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Authentication</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="text-3xl font-black uppercase tracking-tighter text-[#1B2A4A]">
            ALFS <span className="font-light text-[#C0392B]">LABOUR</span>
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black uppercase tracking-tight text-[#0A0A0A]">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-xs font-bold uppercase tracking-widest text-[#1B2A4A]/60">
          Re-establish secure access parameters to your ALFS profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-xl shadow border border-slate-100 py-8 px-6 sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
          
          {/* Header Description */}
          <div className="flex items-start gap-2.5 bg-slate-50 border-l-4 border-[#C0392B] p-4.5 mb-6">
            <ShieldCheck size={16} className="text-[#C0392B] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed font-semibold text-[#1B2A4A]/80">
              Your recovery token has been validated. Please type a premium secure password to override your previous authorization key.
            </p>
          </div>

          {/* Feedback Blocks */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-[#C0392B]/10 border-l-4 border-[#C0392B] text-[#C0392B] text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMessage}. Redirecting to sign in screen...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-[10px] font-black uppercase tracking-widest text-[#1B2A4A] mb-1.5">
                New Password <span className="text-[#C0392B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                  <KeyRound size={16} />
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="minimum 6 characters"
                  className="block w-full pl-10 pr-10 py-3 border border-[#1B2A4A]/20 text-xs placeholder-[#1B2A4A]/30 focus:outline-none focus:border-[#C0392B] bg-white text-[#0A0A0A] rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-[#1B2A4A] mb-1.5">
                Confirm New Password <span className="text-[#C0392B]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                  <KeyRound size={16} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="repeat your password"
                  className="block w-full pl-10 pr-10 py-3 border border-[#1B2A4A]/20 text-xs placeholder-[#1B2A4A]/30 focus:outline-none focus:border-[#C0392B] bg-white text-[#0A0A0A] rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#1B2A4A]/40 hover:text-[#1B2A4A] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B2A4A] text-white py-4 px-4 border-2 border-[#1B2A4A] font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-transparent hover:text-[#1B2A4A] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 rounded-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Encrypting credential updates...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>

          </form>

          {/* Secure indicator footer */}
          <div className="mt-8 border-t border-[#1B2A4A]/10 pt-4 text-center">
            <span className="text-[9px] text-[#1B2A4A]/40 font-mono flex items-center justify-center gap-1">
              SECURE CONNECTION :: SUPABASE ENCRYPTED SESSION
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
