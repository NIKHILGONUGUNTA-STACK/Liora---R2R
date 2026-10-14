import React from 'react';
import { WorkbenchPreview } from './WorkbenchPreview';

interface HeroProps {
  onStartFree: () => void;
  onExploreDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartFree, onExploreDemo }) => {
  return (
    <section
      id="home"
      className="relative w-full overflow-hidden px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 pt-24 sm:pt-28"
      style={{
        background:
          'linear-gradient(rgb(27, 78, 245) 0%, rgb(27, 78, 245) 14%, rgba(27, 78, 245, 0.7) 24%, rgb(219, 234, 254) 38%, rgb(255, 255, 255) 48%, rgb(255, 255, 255) 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 pt-10 sm:pt-14">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide uppercase mb-6 shadow-sm border border-white/20">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
          </span>
          <span className="text-white font-medium">Deterministic Engine v4.5</span>
          <span className="text-white/40">•</span>
          <span className="text-sky-200 font-semibold">Sub-50ms Verification</span>
        </div>

        {/* Main Hero Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white tracking-tight mb-6 leading-tight max-w-4xl drop-shadow-xs">
          One Place for{' '}
          <span
            className="inline-flex items-center font-bold italic tracking-normal text-white mt-1 sm:mt-0"
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              padding: '4px 20px',
              borderRadius: '9999px',
              color: '#ffffff',
              textShadow: 'rgba(0, 0, 0, 0.15) 0px 1px 2px',
              boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 4px 16px rgba(0, 0, 0, 0.06)',
            }}
          >
            Everything You Need to Know.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg lg:text-[18px] max-w-2xl mb-9 leading-relaxed font-normal"
          style={{
            color: 'rgb(255, 255, 255)',
            textShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px',
            opacity: 0.96,
          }}
        >
          Bring your documents and knowledge together. Liora finds the relevant information and turns it into clear, grounded answers.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10">
          <button
            onClick={onStartFree}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#2563eb] text-[#eeefff] font-semibold text-[14px] shadow-[0_10px_25px_-5px_rgba(37,99,235,0.6)] hover:bg-[#1d4ed8] transition-all transform hover:-translate-y-0.5 border border-white/20 active:translate-y-0"
          >
            <span>Start Free with BYO API</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0b1c30] border border-slate-200/80 font-semibold text-[14px] shadow-sm hover:bg-slate-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="material-symbols-outlined text-[18px] text-[#004ac6]">play_circle</span>
            <span>Explore Live Interactive Demo</span>
          </button>
        </div>

        {/* Proof / Verification Bar */}
        <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-6 sm:gap-x-8 text-[#434655] text-[12px] pt-1 pb-6">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <span className="font-bold text-[#0b1c30]">4.95/5</span>
            <span className="text-slate-600">(280+ engineering teams)</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#004ac6]">check_circle</span>
            <span className="text-[#0b1c30] font-medium">Bring your own API key free forever</span>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#004ac6]">verified_user</span>
            <span className="text-[#0b1c30] font-medium">FIPS 140-3 & SOC 2 Type II compliant</span>
          </div>
        </div>

        {/* Embedded Interactive Workbench Preview */}
        <WorkbenchPreview onOpenConsole={onExploreDemo} />
      </div>
    </section>
  );
};
