import React, { useState } from 'react';

interface CtaSectionProps {
  onDeploySandbox: (email: string) => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onDeploySandbox }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitted(true);
    onDeploySandbox(email);
  };

  return (
    <section className="w-full py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#f8f9ff] relative overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="w-full rounded-3xl p-8 sm:p-12 md:p-16 flex flex-col items-center text-center bg-white/70 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#e5eeff] text-[#1d4ed8] text-[11px] font-semibold border border-[#c3c6d7]/30 mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]"></span>
            </span>
            <span>Deterministic Knowledge Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0b1c30] tracking-tight leading-tight max-w-3xl mb-4">
            Ready to eliminate hallucinations in your knowledge workflows?
          </h2>

          <p className="text-base text-[#434655] max-w-2xl mb-8 leading-relaxed">
            Deploy Liora into your sovereign environment in minutes or test our isolated sandbox.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email..."
              required
              className="w-full px-5 py-3.5 rounded-full bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#737686] text-sm border border-[#c3c6d7]/40 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/40 transition-all"
            />
            <button
              type="submit"
              className="w-full sm:w-auto whitespace-nowrap px-7 py-3.5 rounded-full bg-[#004ac6] text-white font-semibold text-[14px] hover:bg-[#1d4ed8] transition-all flex items-center justify-center gap-2 shrink-0 shadow-md hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Deploy Sandbox</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-3 text-[#434655] text-[12px]">
            <span>Instant 14-day evaluation environment</span>
            <span className="text-slate-300">•</span>
            <span>No credit card required</span>
            <span className="text-slate-300">•</span>
            <span>SOC 2 Type II Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
};
