import React, { useState, useRef, useEffect } from 'react';
import { LioraLogo } from '../../components/LioraLogo';
import { saveSession } from '../../lib/session';

/*
 * CreateAccountPage — Step-by-step flow:
 *   Step 1: Name + Email + Verify button beside email → sends OTP
 *   Step 2: Enter OTP (6 digits)
 *   Step 3: Set Password + Confirm Password → Create Account
 *   Step 4: Green circle + white tick → success, stay on page
 *
 *   Also: Continue with Google / GitHub buttons (not implemented yet)
 *   "Already have an account?" → goes to Sign In
 */

interface CreateAccountPageProps {
  onSuccess: () => void;
  onGoToSignIn: () => void;
  onGoToLanding: () => void;
}

type Step = 'details' | 'otp' | 'password' | 'success';

export const CreateAccountPage: React.FC<CreateAccountPageProps> = ({
  onSuccess,
  onGoToSignIn,
  onGoToLanding,
}) => {
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoCode, setDemoCode] = useState('123456');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleOtpChange = (idx: number, val: string) => {
    if (val.length > 1) {
      // Paste support
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtpDigits(newOtp);
      const next = Math.min(digits.length, 5);
      otpRefs.current[next]?.focus();
      return;
    }
    const clean = val.replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[idx] = clean;
    setOtpDigits(newOtp);
    if (clean && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  // Step 1: Verify email → send OTP
  const handleVerifyEmail = async () => {
    setError(null);
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return; }

    setIsLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setDemoCode(data.demo_code || '123456');
      }
    } catch { /* fallback */ }

    setIsLoading(false);
    setResendCooldown(30);
    setStep('otp');
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = () => {
    setError(null);
    const code = otpDigits.join('');
    if (code.length < 6) { setError('Enter the full 6-digit code.'); return; }
    if (code !== demoCode && code !== '123456') {
      setError('Invalid code. Try 123456.');
      return;
    }
    setStep('password');
  };

  // Step 3: Set password → create account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);

    try {
      const resp = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpDigits.join(''),
          password,
          first_name: name,
          last_name: '',
          company: '',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        saveSession({ token: data.access_token, email, firstName: name, role: 'USER' });
        setIsLoading(false);
        setStep('success');
        return;
      }
    } catch { /* fallback */ }

    // Local fallback
    setTimeout(() => {
      saveSession({ token: `liora_${Date.now()}`, email, firstName: name, role: 'USER' });
      setIsLoading(false);
      setStep('success');
    }, 500);
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    try {
      const resp = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setDemoCode(data.demo_code || '123456');
      }
    } catch {}
    setIsLoading(false);
    setResendCooldown(30);
  };

  // ===== SUCCESS STATE =====
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center font-sans antialiased">
        <div className="flex flex-col items-center gap-5 animate-[fadeIn_0.4s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-[#22c55e] flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[#1e293b] text-lg font-semibold">Account created successfully</p>
          <p className="text-[#64748b] text-sm">Welcome, {name}</p>
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

      <main className="flex-1 flex items-start justify-center px-5 pt-8 sm:pt-16">
        <div className="w-full max-w-[400px]">
          <h1 className="text-[26px] font-bold text-[#0f172a] tracking-tight mb-1">Create account</h1>
          <p className="text-[14px] text-[#64748b] mb-7">
            {step === 'details' && 'Get started with Liora.'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {step === 'password' && 'Set your password to complete registration.'}
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[13px]">
              {error}
            </div>
          )}

          {/* ===== STEP 1: NAME + EMAIL ===== */}
          {step === 'details' && (
            <>
              {/* OAuth buttons */}
              <div className="flex flex-col gap-2.5 mb-5">
                <button type="button" className="w-full h-[42px] rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-[#1e293b] text-[13.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>
                <button type="button" className="w-full h-[42px] rounded-lg border border-[#d1d5db] bg-white hover:bg-[#f9fafb] text-[#1e293b] text-[13.5px] font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer">
                  <svg className="w-4.5 h-4.5" fill="#1e293b" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="h-px bg-[#e2e8f0] flex-1" />
                <span className="text-[12px] text-[#94a3b8] uppercase tracking-wider font-medium">or</span>
                <div className="h-px bg-[#e2e8f0] flex-1" />
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="w-full h-[42px] px-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="flex-1 h-[42px] px-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={isLoading}
                      className="px-4 h-[42px] rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isLoading ? 'Sending...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== STEP 2: OTP ===== */}
          {step === 'otp' && (
            <div className="flex flex-col gap-5">
              <div className="flex justify-center gap-2.5">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-[18px] font-bold rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all font-mono"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full h-[42px] rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Verify code
              </button>

              <div className="flex items-center justify-between text-[13px]">
                <button type="button" onClick={() => setStep('details')} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`font-medium cursor-pointer ${resendCooldown > 0 ? 'text-[#94a3b8]' : 'text-[#2563eb] hover:text-[#1d4ed8]'}`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              {/* Show demo code hint */}
              <p className="text-center text-[12px] text-[#94a3b8]">
                Demo code: <span className="font-mono font-bold text-[#64748b]">{demoCode}</span>
              </p>
            </div>
          )}

          {/* ===== STEP 3: SET PASSWORD ===== */}
          {step === 'password' && (
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full h-[42px] px-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full h-[42px] px-3.5 rounded-lg border border-[#d1d5db] bg-white text-[#0f172a] text-[14px] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[42px] rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50 mt-1"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}

          {/* Bottom link - always visible in non-success steps */}
          <p className="text-center text-[13px] text-[#64748b] mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onGoToSignIn}
              className="text-[#2563eb] hover:text-[#1d4ed8] font-medium cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
