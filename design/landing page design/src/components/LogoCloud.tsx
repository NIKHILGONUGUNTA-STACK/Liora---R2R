import React from 'react';

export const LogoCloud: React.FC = () => {
  const logos = [
    { name: 'DATADOG', style: 'tracking-tighter font-black text-xl sm:text-2xl' },
    { name: 'Figma', style: 'tracking-tight font-bold text-xl sm:text-2xl' },
    { name: 'stripe', style: 'tracking-tight font-extrabold text-xl sm:text-2xl lowercase' },
    { name: 'Notion', style: 'tracking-normal font-bold text-xl sm:text-2xl' },
    { name: '▲ Vercel', style: 'tracking-tight font-bold text-xl sm:text-2xl' },
    { name: 'snowflake', style: 'tracking-wide font-extrabold text-xl sm:text-2xl lowercase' },
    { name: 'CLOUDFLARE', style: 'tracking-tight font-black text-xl sm:text-2xl' },
  ];

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-[#eff4ff] border-y border-[#c3c6d7]/30">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-center">
        <span className="text-[12px] text-[#434655] uppercase tracking-wider font-semibold">
          Trusted by high-assurance infrastructure &amp; AI teams worldwide
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-[#0b1c30]">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className={`${logo.style} opacity-85 hover:opacity-100 hover:text-[#004ac6] transition-all cursor-default select-none`}
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
