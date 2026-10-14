import React from 'react';

export const Footer: React.FC = () => {
  return (
    <>
      <footer className="w-full bg-white text-[#0b1c30] pt-16 pb-12 border-t border-[#c3c6d7]/30 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
          {/* Main 5-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-[#c3c6d7]/20">
            {/* Col 1 & 2: Brand & Description */}
            <div className="lg:col-span-2 flex flex-col gap-3 pr-4">
              <div className="flex items-center gap-2">
                <img
                  alt="Liora Logo"
                  className="h-7 w-auto object-contain"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1UAzCtz0qsekGSzPoEyo2D10_mqR5uWpVHlCjAwDWtjalx5mRpNkYSmyNCIzaFOwHqqxF1Vf4nqj4tddVvONyvzE1L-LqOUwQH8DumkXwNbFWBt2F0b_RsZJc1gHK_Yk_P0DAz1KRFo4OYt4bwD9TXvExucE2zgEdVKLpncSSNzUN2wtqSWVPcVAyHztNudPEfSDmmDvV5Ah3AYBVOQPLNeLDlMWzbFuaEwxznbj78-uARAmJal7Je5guo"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <span className="font-bold text-xl tracking-tight text-[#0b1c30]">
                  Liora
                </span>
              </div>
              <p className="text-[13px] text-[#434655] max-w-sm leading-relaxed">
                High-clarity knowledge intelligence and synthesis engine built for precision research, cross-domain verification, and enterprise-scale optical retrieval.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eff4ff] border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse"></span>
                  <span className="text-[11px] text-[#0b1c30] font-medium">
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>

            {/* Col 3: Platform */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] uppercase tracking-wider text-[#0b1c30] font-bold">
                Platform
              </span>
              <a href="#workbench-preview" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Product Overview
              </a>
              <a href="#benchmark" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Synthetics &amp; Benchmarks
              </a>
              <a href="#architecture" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Connectors &amp; Integrations
              </a>
              <a href="#pricing" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Enterprise Pricing
              </a>
            </div>

            {/* Col 4: Architecture */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] uppercase tracking-wider text-[#0b1c30] font-bold">
                Architecture
              </span>
              <a href="#architecture" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Core Engine Whitepaper
              </a>
              <a href="#architecture" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Vector Consensus Spec
              </a>
              <a href="#benchmark" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Optical Retrieval Graph
              </a>
              <a href="#workbench-preview" className="text-[13px] text-[#434655] hover:text-[#004ac6] transition-colors">
                Intelligence API
              </a>
            </div>

            {/* Col 5: Assurance */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[12px] uppercase tracking-wider text-[#0b1c30] font-bold">
                Assurance
              </span>
              <div className="flex flex-col gap-2 pt-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff4ff] border border-blue-200 text-[#0b1c30] text-[11px] w-fit font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#004ac6]">verified_user</span>
                  <span>SOC2 Type II</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff4ff] border border-blue-200 text-[#0b1c30] text-[11px] w-fit font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#004ac6]">health_and_safety</span>
                  <span>HIPAA Ready</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff4ff] border border-blue-200 text-[#0b1c30] text-[11px] w-fit font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#004ac6]">lock</span>
                  <span>FIPS 140-3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Legal Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[#434655] text-xs">
            <p>© 2026 Liora Intelligence Systems Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-[#004ac6] transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-[#004ac6] transition-colors">Terms of Service</a>
              <a href="#trust" className="hover:text-[#004ac6] transition-colors">Trust Center</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Giant Typographic LIORA Wordmark Banner */}
      <section className="w-full bg-white overflow-hidden select-none pb-12 pt-8 border-t border-[#c3c6d7]/20">
        <div className="w-full px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto flex items-center justify-center">
          <svg
            className="w-full h-auto select-none block"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 1140 280"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              fill="#1B4EF5"
              fontFamily="'Plus Jakarta Sans', 'Arial Black', sans-serif"
              fontSize="260"
              fontWeight="900"
              lengthAdjust="spacingAndGlyphs"
              letterSpacing="-0.04em"
              textLength="100%"
              x="0"
              y="230"
            >
              LIORA
            </text>
          </svg>
        </div>
      </section>
    </>
  );
};
