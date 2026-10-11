import React, { useState } from 'react';

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const proPrice = billingCycle === 'annual' ? 39 : 49;
  const proPeriod = billingCycle === 'annual' ? '/ month (billed annually)' : '/ month';

  return (
    <section className="w-full py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#f8f9ff]" id="pricing">
      <div className="max-w-7xl mx-auto flex flex-col gap-14 sm:gap-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
          <span className="text-[12px] uppercase tracking-wider text-[#004ac6] font-bold">
            Predictable &amp; Sovereign Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0b1c30] tracking-tight leading-tight">
            Built for production reliability at any scale.
          </h2>
          <p className="text-base text-[#434655]">
            Zero token markups on your own models. Choose fully autonomous hosting or managed enclave acceleration.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#eff4ff] border border-slate-300/70 mx-auto mt-4 shadow-2xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs transition-all font-semibold ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#0b1c30] shadow-sm'
                  : 'text-[#434655] hover:text-[#0b1c30]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-xs transition-all font-semibold ${
                billingCycle === 'annual'
                  ? 'bg-white text-[#0b1c30] shadow-sm'
                  : 'text-[#434655] hover:text-[#0b1c30]'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
          {/* Plan 1: BYO Keys */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between h-full shadow-xs hover:shadow-md transition-all">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl text-[#0b1c30] font-bold">
                  BYO Keys
                </span>
                <span className="px-3 py-1 rounded-full bg-[#e5eeff] text-[#0b1c30] text-[11px] font-semibold border border-[#c3c6d7]/30">
                  Developer
                </span>
              </div>
              <p className="text-[13px] text-[#434655]">
                Free forever when using your own LLM API keys and local embedding models.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold text-[#0b1c30] tracking-tight">
                  $0
                </span>
                <span className="text-xs text-[#434655]">/ month forever</span>
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <div className="flex flex-col gap-3 text-xs sm:text-[13px] text-[#0b1c30]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Up to 10,000 query verifications/mo</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Connect OpenAI, Anthropic &amp; Ollama</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Single-hop vector graph traversal</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Community Discord &amp; GitHub issues</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={() => onSelectPlan('BYO Keys')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] font-semibold text-[14px] transition-all border border-slate-300/70"
              >
                <span>Get Started Free</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Plan 2: Managed Team (Most Popular, Elevated) */}
          <div className="p-7 sm:p-9 lg:p-10 rounded-3xl bg-white backdrop-blur-xl border-2 border-[#004ac6]/40 flex flex-col justify-between relative shadow-lg lg:-translate-y-4">
            {/* Most popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#004ac6] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 whitespace-nowrap">
              <span className="material-symbols-outlined text-[14px]">star</span>
              <span>Most Popular</span>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl text-[#0b1c30] font-bold">
                  Managed Team
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#004ac6] text-[11px] font-bold border border-blue-200">
                  Pro Engine
                </span>
              </div>
              <p className="text-[13px] text-[#434655]">
                High-throughput deterministic verification for fast-growing engineering teams.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold text-[#004ac6] tracking-tight">
                  ${proPrice}
                </span>
                <span className="text-xs text-[#434655]">{proPeriod}</span>
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <div className="flex flex-col gap-3 text-xs sm:text-[13px] text-[#0b1c30]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span className="font-semibold">Unlimited deterministic verifications</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>42ms p95 hardware enclave routing</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Multi-hop cryptographic Merkle proofs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Corpus sync: GitHub, Notion, Confluence</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Dedicated Slack support channel</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={() => onSelectPlan('Managed Team')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#004ac6] text-white hover:bg-[#1d4ed8] font-semibold text-[14px] shadow-md transition-all hover:scale-[1.01]"
              >
                <span>Start 14-Day Free Trial</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Plan 3: Enterprise Sovereign */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between h-full shadow-xs hover:shadow-md transition-all">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xl sm:text-2xl text-[#0b1c30] font-bold">
                  Enterprise Sovereign
                </span>
                <span className="px-3 py-1 rounded-full bg-[#e5eeff] text-[#824500] text-[11px] font-bold border border-[#c3c6d7]/30">
                  Custom
                </span>
              </div>
              <p className="text-[13px] text-[#434655]">
                Air-gapped deployment inside AWS Nitro Enclaves, private Kubernetes, or bare metal.
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-bold text-[#0b1c30] tracking-tight">
                  Custom
                </span>
                <span className="text-xs text-[#434655]">annual contracts</span>
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <div className="flex flex-col gap-3 text-xs sm:text-[13px] text-[#0b1c30]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>100% On-Premise &amp; Air-Gapped deploy</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Enforceable Zero Data Retention SLA</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>FIPS 140-3 &amp; SOC 2 Type II attestation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-[#004ac6]">check_circle</span>
                  <span>Custom fine-tuned embeddings &amp; 24/7 SLA</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={() => onSelectPlan('Enterprise Sovereign')}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] font-semibold text-[14px] transition-all border border-slate-300/70"
              >
                <span>Contact Enterprise Sales</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
