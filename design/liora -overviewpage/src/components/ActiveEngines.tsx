import React from 'react';
import { Cpu } from 'lucide-react';
import { EngineStatus } from '../types';

interface ActiveEnginesProps {
  engines: EngineStatus[];
}

export const ActiveEngines: React.FC<ActiveEnginesProps> = ({ engines }) => {
  return (
    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#e2e8f0] shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#1d4ed8]" />
          <h2 className="font-geist font-semibold text-[14px] text-slate-900 tracking-tight">
            Active Engines
          </h2>
        </div>
        <span className="font-mono-code text-[11px] text-[#10b981] flex items-center gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>All Nodes Operational</span>
        </span>
      </div>

      {/* Engine Items */}
      <div className="space-y-2 mt-2.5">
        {engines.map((engine) => (
          <div
            key={engine.id}
            className="p-2.5 rounded-lg bg-slate-50 border border-[#e2e8f0] flex items-center justify-between gap-2.5 hover:bg-slate-100/70 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-geist font-medium text-[12.5px] text-slate-900 truncate">
                  {engine.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono-code text-[10px] font-medium shrink-0 ${
                    engine.badgeType === 'primary'
                      ? 'bg-blue-100 text-[#1d4ed8]'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {engine.badge}
                </span>
              </div>
              <p className="font-sans text-[11px] text-slate-500 truncate mt-0.5">
                {engine.description}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono-code text-[11px] text-slate-900 block font-medium">
                {engine.latencyOrStatus}
              </span>
              <span
                className={`font-geist text-[10px] block ${
                  engine.substatusColor === 'green'
                    ? 'text-[#10b981] font-medium'
                    : 'text-slate-400'
                }`}
              >
                {engine.substatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
