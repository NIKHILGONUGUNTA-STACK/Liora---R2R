import React from 'react';
import { TrendingUp, ShieldCheck } from 'lucide-react';

interface MetricsStripProps {
  docCount?: number;
  citationCount?: string;
  fidelity?: string;
  vectorCount?: string;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({
  docCount = 84,
  citationCount = '1,428',
  fidelity = '99.82%',
  vectorCount = '14,892',
}) => {
  return (
    <div className="px-4 sm:px-6 pt-4 pb-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Synchronized Documents */}
        <div className="flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#e2e8f0] hover:border-slate-300 transition-colors shadow-2xs">
          <div>
            <span className="font-geist text-[10px] sm:text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold block">
              Synchronized Documents
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-geist text-[24px] sm:text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
                {docCount}
              </span>
              <span className="font-sans text-[11.5px] text-slate-500">
                files actively parsed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#e2e8f0] font-mono-code text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span>Zero parity lag</span>
          </div>
        </div>

        {/* Card 2: Verified Citations */}
        <div className="flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#e2e8f0] hover:border-slate-300 transition-colors shadow-2xs">
          <div>
            <span className="font-geist text-[10px] sm:text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold block">
              Verified Citations
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-geist text-[24px] sm:text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
                {citationCount}
              </span>
              <span className="font-sans text-[11.5px] text-slate-500">
                this billing cycle
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-[#e2e8f0] font-mono-code text-[11px] text-[#10b981] font-medium">
            <TrendingUp className="w-3 h-3 text-[#10b981]" />
            <span>+14.2% vs last month</span>
          </div>
        </div>

        {/* Card 3: Ground-Truth Fidelity */}
        <div className="flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#e2e8f0] hover:border-slate-300 transition-colors shadow-2xs">
          <div>
            <span className="font-geist text-[10px] sm:text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold block">
              Ground-Truth Fidelity
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-geist text-[24px] sm:text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
                {fidelity}
              </span>
              <span className="font-sans text-[11.5px] text-slate-500">
                deterministic check
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-[#e2e8f0] font-mono-code text-[11px] text-[#1d4ed8] font-medium">
            <ShieldCheck className="w-3 h-3 text-[#1d4ed8]" />
            <span>3 strict hallucination barriers</span>
          </div>
        </div>

        {/* Card 4: Indexed Vectors */}
        <div className="flex flex-col justify-between p-3.5 rounded-xl bg-white border border-[#e2e8f0] hover:border-slate-300 transition-colors shadow-2xs">
          <div>
            <span className="font-geist text-[10px] sm:text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold block">
              Indexed Vectors
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-geist text-[24px] sm:text-[26px] font-semibold text-slate-900 tracking-tight leading-none">
                {vectorCount}
              </span>
              <span className="font-sans text-[11.5px] text-slate-500">
                nodes embedded
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#e2e8f0] font-mono-code text-[11px] text-slate-500">
            <span>Dimensions: 3072-dense (HNSW)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
