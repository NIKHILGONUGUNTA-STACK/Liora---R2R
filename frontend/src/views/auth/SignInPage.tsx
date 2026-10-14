import React, { useState, useRef, useEffect } from 'react';
import { LioraLogo } from '../../components/LioraLogo';
import { saveSession } from '../../lib/session';

/*
 * SignInPage — Clean glass design, grey borders, no shadows.
 *
 * Flow:
 *   Email + Password → Sign In → green circle + white tick (stay here)
 *   OR Continue with Google / GitHub (no OAuth yet, just buttons)
 *   "Don't have an account?" → navigates to Create Account
 *   "Forgot password?" → navigates to ForgotPasswordPage
 */

interface SignInPageProps {
  onSuccess: () => void;
  onGoToCreateAccount: () => void;
  onGoToForgotPassword: () => void;
  onGoToLanding: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSuccess,
  onGoToCreateAccount,
  onGoToForgotPassword,
  onGoToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // Try backend first
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const resp = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (resp.ok) {
        const data = await resp.json();
        saveSession({
          token: data.access_token,
          email,
          firstName: email.split('@')[0],
          role: 'USER',
        });
        setIsLoading(false);
        setIsSuccess(true);
        return;
      }
    } catch {
      // Backend unavailable, fallback
    }

    // Local fallback
    setTimeout(() => {
      saveSession({
        token: `liora_${Date.now()}`,
        email,
        firstName: email.split('@')[0],
        role: 'USER',
      });
      setIsLoading(false);
      setIsSuccess(true);
    }, 600);
  };

  // Success state — green circle with white tick, stay on page
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-5 animate-[fadeIn_0.4s_ease-out]">
          {/* Green circle with white tick */}
          <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[#1e293b] text-lg font-semibold">Signed in successfully</p>
          <p className="text-[#64748b] text-sm">Welcome back, {email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="w-full px-6 py-5 flex items-center justify-between max-w-lg mx-auto sm:max-w-xl">
        <button onClick={onGoToLanding} className="flex items-center gap-2 cursor-pointer">
          <LioraLogo className="w-7 h-7" />
          <span className="font-semibold text-[17px] text-[#0f172a] tracking-tight">Liora</span>
        </button>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start justify-center px-5 pt-8 sm:pt-16">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[26px] font-bold text-[#0f172a] tracking-tight mb-1">Sign in</h1>
          <p className="text-[14px] text-[#64748b] mb-7">Enter your credentials to continue.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[13px]">
              {error}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              type="button"
              className="w-full h-[42px] rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-[#1e293b] text-[13.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full h-[42px] rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-[#1e293b] text-[13.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4.5 h-4.5" fill="#1e293b" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-[#e2e8f0] flex-1" />
            <span className="text-[12px] text-[#94a3b8] uppercase tracking-wider font-medium">or</span>
            <div className="h-px bg-[#e2e8f0] flex-1" />
          </div>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full h-[42px] px-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-[#374151]">Password</label>
                <button
                  type="button"
                  onClick={onGoToForgotPassword}
                  className="text-[12.5px] text-[#2563eb] hover:text-[#1d4ed8] font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full h-[42px] px-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[42px] rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#64748b] mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onGoToCreateAccount}
              className="text-[#2563eb] hover:text-[#1d4ed8] font-medium cursor-pointer"
            >
              Create account
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
