import React from 'react';
import { Layers, Loader2, RefreshCw } from 'lucide-react';
import { IngestionWorker } from '../types';

interface IngestionPipelineProps {
  workers: IngestionWorker[];
}

export const IngestionPipeline: React.FC<IngestionPipelineProps> = ({ workers }) => {
  return (
    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#e2e8f0] shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1d4ed8]" />
          <h2 className="font-geist font-semibold text-[14px] text-slate-900 tracking-tight">
            Ingestion Pipeline
          </h2>
        </div>
        <span className="font-geist text-[11px] text-slate-400 font-medium">
          {workers.length} active workers
        </span>
      </div>

      {/* Worker list */}
      <div className="space-y-2.5 mt-2.5">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="p-2.5 rounded-lg bg-slate-50 border border-[#e2e8f0]"
          >
            <div className="flex items-center justify-between text-slate-900">
              <div className="flex items-center gap-2 min-w-0">
                {worker.isSpinning ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#1d4ed8] animate-spin shrink-0" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                )}
                <span className="font-geist font-medium text-[12px] text-slate-800 truncate">
                  {worker.filename}
                </span>
              </div>
              <span
                className={`font-mono-code text-[11px] font-medium shrink-0 ml-2 ${
                  worker.color === 'blue' ? 'text-[#1d4ed8]' : 'text-slate-600'
                }`}
              >
                {worker.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  worker.color === 'blue' ? 'bg-[#1d4ed8]' : 'bg-[#f59e0b]'
                }`}
                style={{ width: `${worker.progress}%` }}
              />
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between mt-1.5 font-mono-code text-[10.5px] text-slate-500">
              <span className="truncate mr-2">{worker.statusText}</span>
              <span className="shrink-0">{worker.speedOrChunks}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
