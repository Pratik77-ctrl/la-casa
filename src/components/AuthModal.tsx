import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { AuthModalMode, useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  loginWithEmail,
  loginWithGoogle,
  mapAuthErrorMessage,
  registerWithEmail,
  sendResetPassword,
} from '../firebase/services';
import { validateRegistrationForm } from '../utils/commerce';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal } = useAuth();
  const { showToast } = useStore();

  const [mode, setMode] = useState<AuthModalMode>(authModalMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    setFieldErrors({});
    setServerError(null);
    setInfoMessage(null);
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const switchMode = (next: AuthModalMode) => {
    setMode(next);
    setFieldErrors({});
    setServerError(null);
    setInfoMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setInfoMessage(null);

    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    if (!password) errs.password = 'Password is required.';
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      showToast('Welcome back to La Casa.');
      closeAuthModal();
    } catch (err) {
      setServerError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setInfoMessage(null);

    const errs = validateRegistrationForm({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    });
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail({ fullName, email, phone, password });
      showToast('Account created! Verification email sent.');
      closeAuthModal();
    } catch (err) {
      setServerError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setInfoMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setFieldErrors({ email: 'Enter your registered email address.' });
      return;
    }

    setSubmitting(true);
    try {
      await sendResetPassword(email);
      setInfoMessage('Password reset instructions sent to your email.');
    } catch (err) {
      setServerError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('Signed in with Google.');
      closeAuthModal();
    } catch (err) {
      setServerError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-[#FFF8ED] w-full max-w-md rounded-2xl border border-[#E5D5BF] shadow-xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-5 bg-[#641E24] text-[#FFF8ED] flex items-center justify-between">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-bold">
              {mode === 'login' && 'Sign in to La Casa'}
              {mode === 'register' && 'Create your La Casa account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p className="text-xs text-[#FFF8ED]/80 mt-0.5">
              Save favourite dishes, addresses, and track orders in real time
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close sign in dialog"
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EFE2CE]">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-white text-[#641E24] shadow-xs' : 'text-[#242424]/75'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-white text-[#641E24] shadow-xs' : 'text-[#242424]/75'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {serverError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="text-xs font-semibold text-[#242424]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-semibold text-[#641E24] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-[#242424] mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ananya Rawat"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {fieldErrors.fullName && <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-[#242424] mb-1">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@dgu.ac.in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#242424] mb-1">
                  Mobile Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-pass" className="block text-xs font-semibold text-[#242424] mb-1">
                    Password
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                  />
                  {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="block text-xs font-semibold text-[#242424] mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Customer Account
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Registered Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Password Reset Email
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs font-semibold text-[#641E24] hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {mode !== 'forgot' && (
            <>
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#E2D0B9]" />
                <span className="shrink mx-3 text-xs text-[#242424]/50">or continue with</span>
                <div className="flex-grow border-t border-[#E2D0B9]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#DFCBB3] text-[#242424] text-sm font-semibold hover:bg-[#FAF1E4] transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
