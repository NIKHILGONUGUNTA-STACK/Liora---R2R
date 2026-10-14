import React from 'react';
import { Upload, Terminal } from 'lucide-react';

interface WorkspaceBannerProps {
  clusterName: string;
  onOpenIngestModal: () => void;
  onOpenQueryWorkspace: () => void;
}

export const WorkspaceBanner: React.FC<WorkspaceBannerProps> = ({
  clusterName,
  onOpenIngestModal,
  onOpenQueryWorkspace,
}) => {
  return (
    <div className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-[#e2e8f0] bg-white">
      <div className="flex flex-col gap-0.5 min-w-0">
        {/* Cluster & fidelity meta indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-[#e2e8f0] text-slate-600 font-mono-code text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            <span>us-east-2 · production-cluster-04</span>
          </span>
          <span className="font-mono-code text-[11px] text-slate-400">|</span>
          <span className="font-geist text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
            Fidelity 99.8% Deterministic
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-geist text-[22px] sm:text-[25px] font-semibold text-slate-900 tracking-tight mt-1 leading-snug">
          Welcome back, Evelyn
        </h1>
        <p className="font-sans text-[13px] text-slate-500">
          Workspace index is active across 4 connected secure data silos.
        </p>
      </div>

      {/* Quick Action Bar */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenIngestModal}
          className="inline-flex items-center gap-1.5 font-geist font-medium text-[12.5px] text-slate-700 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          <span>+ Ingest Document</span>
        </button>
        <button
          onClick={onOpenQueryWorkspace}
          className="inline-flex items-center gap-1.5 font-geist font-medium text-[12.5px] text-slate-700 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-slate-500" />
          <span>Query Workspace</span>
        </button>
      </div>
    </div>
  );
};
