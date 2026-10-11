import React, { useState } from 'react';
import { BENCHMARK_THREADS, BenchmarkThread } from '../data/mockData';

interface WorkbenchPreviewProps {
  onOpenConsole?: () => void;
}

export const WorkbenchPreview: React.FC<WorkbenchPreviewProps> = ({ onOpenConsole }) => {
  const [activeThreadIndex, setActiveThreadIndex] = useState(0);
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [branching, setBranching] = useState(false);
  const [activeMode, setActiveMode] = useState<'deterministic' | 'stochastic'>('deterministic');

  const currentThread: BenchmarkThread = BENCHMARK_THREADS[activeThreadIndex];

  const handleCopy = () => {
    const textToCopy = `${currentThread.synthesizedLead}\n\n${currentThread.steps
      .map((s) => `${s.number}. ${s.title}: ${s.description}`)
      .join('\n')}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBranch = () => {
    setBranching(true);
    setTimeout(() => {
      setActiveThreadIndex((prev) => (prev + 1) % BENCHMARK_THREADS.length);
      setBranching(false);
    }, 450);
  };

  return (
    <div className="w-full mt-6 relative max-w-6xl mx-auto" id="workbench-preview">
      {/* Floating Pill Badges around the window (Exact mockup layout) */}
      <div className="hidden xl:flex absolute -left-8 top-20 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-xl border border-slate-300/70 text-left transition-all hover:scale-105">
        <div className="w-9 h-9 rounded-xl bg-[#e5eeff] flex items-center justify-center text-[#004ac6]">
          <span className="material-symbols-outlined text-[20px]">verified</span>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[#0b1c30]">100% Deterministic</div>
          <div className="text-[11px] text-[#434655]">Zero speculative tokens</div>
        </div>
      </div>

      <div className="hidden xl:flex absolute -right-6 top-16 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-xl border border-slate-300/70 text-left transition-all hover:scale-105">
        <div className="w-9 h-9 rounded-xl bg-[#e5eeff] flex items-center justify-center text-[#1d4ed8]">
          <span className="material-symbols-outlined text-[20px]">timer</span>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[#0b1c30]">42ms Latency</div>
          <div className="text-[11px] text-[#434655]">P95 retrieval + proving</div>
        </div>
      </div>

      <div className="hidden xl:flex absolute -right-8 bottom-28 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-white shadow-xl border border-slate-300/70 text-left transition-all hover:scale-105">
        <div className="w-9 h-9 rounded-xl bg-[#e5eeff] flex items-center justify-center text-[#1d4ed8]">
          <span className="material-symbols-outlined text-[20px]">security</span>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-[#0b1c30]">0 Hallucination Drift</div>
          <div className="text-[11px] text-[#434655]">Merkle root verified</div>
        </div>
      </div>

      {/* Main Glass Workbench Container */}
      <div
        className="w-full rounded-3xl bg-white shadow-2xl overflow-hidden text-left border-t"
        style={{
          borderTop: '1.5px solid rgba(148, 163, 184, 0.55)',
          borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
          borderRight: '1px solid rgba(226, 232, 240, 0.8)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      >
        {/* Top Control Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#eff4ff] flex flex-wrap items-center justify-between gap-3 border-b border-[#c3c6d7]/30">
          <div className="flex items-center gap-3">
            {/* macOS-style window controls */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ba1a1a]/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#ffb77d] inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-[#dce1ff] inline-block"></span>
            </div>
            <div className="h-4 w-px bg-[#c3c6d7]/40 mx-1 hidden sm:block"></div>
            
            {/* Thread Title & Indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse"></span>
              <span className="font-semibold text-[#0b1c30] tracking-tight text-[15px] sm:text-[16px] truncate max-w-[240px] sm:max-w-md">
                {currentThread.title}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#434655] font-mono text-[11px] font-semibold">
                {currentThread.id}
              </span>
            </div>
          </div>

          {/* Right Corpus & Branch Actions */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
            <span className="text-[#434655] hidden md:flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#004ac6]">folder_supervised</span>
              <span>Corpus: {currentThread.corpus}</span>
              <span className="text-[#737686]">({currentThread.fragmentsCount})</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#d3e4fe] text-[#1d4ed8] font-medium hidden sm:inline-block">
              Sync Active
            </span>
            <button
              onClick={handleBranch}
              disabled={branching}
              className="px-3 py-1 rounded-full bg-white text-[#0b1c30] hover:bg-[#e5eeff] transition-all shadow-xs flex items-center gap-1 font-semibold text-[11px] border border-[#c3c6d7]/40 active:scale-95"
              title="Switch to next benchmark verification thread"
            >
              <span className={`material-symbols-outlined text-[14px] ${branching ? 'animate-spin' : ''}`}>
                {branching ? 'sync' : 'fork_right'}
              </span>
              <span>{branching ? 'Evaluating...' : 'Branch Thread'}</span>
            </button>
          </div>
        </div>

        {/* Workbench Body Grid (2 Columns: Query/Response left, Evidence Inspector right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Left Column: Operator Query & Deterministic Synthesis */}
          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-8 flex flex-col gap-5 bg-white border-r border-[#c3c6d7]/30">
            {/* Operator Query Message Box */}
            <div className="flex items-start gap-3.5 bg-[#eff4ff] p-4 rounded-2xl border border-blue-100/60">
              <div className="w-9 h-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[15px] text-[#0b1c30]">
                    {currentThread.operator.name}
                  </span>
                  <span className="text-[11px] text-[#434655] font-mono">
                    {currentThread.operator.role}
                  </span>
                </div>
                <p className="text-[14px] sm:text-[15px] text-[#0b1c30] leading-relaxed">
                  {currentThread.query}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentThread.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-[#e5eeff] text-[11px] font-mono text-[#434655]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Synthesized Output Box */}
            <div className="flex items-start gap-3.5 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-[#0b1c30]">
                      Synthesized Verification & Operational Path
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#004ac6] text-[10px] font-bold tracking-wider">
                      {activeMode === 'deterministic' ? 'DETERMINISTIC' : 'STOCHASTIC (UNSAFE)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#434655]">
                    <button
                      onClick={handleCopy}
                      className="p-1 hover:text-[#004ac6] rounded hover:bg-slate-100 transition-colors"
                      title="Copy synthesized response"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copied ? 'done' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      onClick={() => onOpenConsole?.()}
                      className="p-1 hover:text-[#004ac6] rounded hover:bg-slate-100 transition-colors"
                      title="Open in full workbench console"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  </div>
                </div>

                <p className="text-[13px] sm:text-[14px] text-[#0b1c30] leading-relaxed">
                  {currentThread.synthesizedLead}{' '}
                  <button
                    onClick={() => setSelectedCitation(1)}
                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e5eeff] text-[#1d4ed8] font-bold text-xs hover:bg-blue-200 transition-colors cursor-pointer"
                  >
                    [1]
                  </button>
                  .
                </p>

                {/* Steps */}
                <div className="flex flex-col gap-2.5 pt-1">
                  {currentThread.steps.map((step) => {
                    const isHighlighted = selectedCitation === step.citationId;
                    return (
                      <div
                        key={step.number}
                        className={`flex items-start gap-2.5 p-3 rounded-xl transition-all ${
                          isHighlighted
                            ? 'bg-blue-100/70 ring-1 ring-blue-500'
                            : 'bg-[#eff4ff]'
                        }`}
                      >
                        <span className="px-1.5 py-0.5 rounded bg-[#dce1ff] text-[#004ac6] font-mono text-[11px] font-bold">
                          {step.number}
                        </span>
                        <div className="text-xs text-[#0b1c30] leading-relaxed">
                          <span className="font-semibold">{step.title}: </span>
                          <span>{step.description} </span>
                          <button
                            onClick={() => setSelectedCitation(step.citationId)}
                            className="text-[#1d4ed8] font-bold hover:underline cursor-pointer"
                          >
                            [{step.citationId}]
                          </button>
                          .
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Code / Config Spec Preview */}
                <div className="rounded-xl bg-[#eff4ff] p-3.5 text-xs text-[#0b1c30] space-y-1 border border-slate-200/80">
                  <div className="text-[#1d4ed8] font-semibold text-[11px] uppercase tracking-wider font-mono">
                    {currentThread.codeConfig.filename}
                  </div>
                  <pre className="overflow-x-auto text-[12px] leading-relaxed text-[#434655] font-mono whitespace-pre-wrap">
                    {currentThread.codeConfig.code}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Inspector */}
          <div className="lg:col-span-4 p-5 sm:p-6 bg-[#eff4ff] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#004ac6]">fact_check</span>
                <span className="font-semibold text-[14px] text-[#0b1c30]">Evidence Inspector</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#434655] text-[11px] font-mono font-medium">
                {currentThread.sources.length} Verified Sources
              </span>
            </div>

            {/* Circular Grounding Fidelity Metric Card */}
            <div className="p-3.5 rounded-2xl bg-white shadow-xs flex items-center justify-between border border-slate-200">
              <div>
                <div className="text-[11px] text-[#434655]">Grounding Fidelity</div>
                <div className="text-2xl font-bold text-[#1d4ed8]">
                  {currentThread.groundingFidelity}%
                </div>
                <div className="text-[11px] text-[#737686]">0 Hallucination Drift</div>
              </div>

              {/* Radial gauge SVG */}
              <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#1d4ed8]">
                <svg className="w-9 h-9" viewBox="0 0 36 36">
                  <path
                    className="text-blue-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-[#1d4ed8]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="99.8, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
              </div>
            </div>

            {/* Source Citation Cards */}
            {currentThread.sources.map((src) => {
              const isSelected = selectedCitation === src.badgeIndex;
              return (
                <div
                  key={src.id}
                  onClick={() => setSelectedCitation(src.badgeIndex)}
                  className={`p-3 rounded-2xl bg-white shadow-xs flex flex-col gap-1.5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-400/20 bg-blue-50/30'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[11px] text-[#1d4ed8] font-bold font-mono">
                      [{src.badgeIndex}] {src.filename}
                    </span>
                    <span className="text-[#434655] text-[11px] font-mono">{src.section}</span>
                  </div>
                  <p className="text-[12px] text-[#434655] italic line-clamp-3 leading-snug">
                    {src.quote}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                    <span className="text-[#004ac6] font-medium">Sim: {src.similarity}</span>
                    <span className="text-[#737686]">SHA256: {src.sha256}</span>
                  </div>
                </div>
              );
            })}

            {/* Cryptographic Receipt Node Card */}
            <div className="mt-auto p-3 rounded-2xl bg-white flex items-center gap-2.5 border border-slate-200 shadow-xs">
              <span className="material-symbols-outlined text-[20px] text-[#004ac6]">verified</span>
              <div className="text-[12px] leading-tight text-[#0b1c30]">
                <div className="font-semibold">Cryptographic Receipt Signed</div>
                <span className="text-[#434655] text-[11px] font-mono">{currentThread.enclaveNode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workbench Bottom Telemetry Footer Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#eff4ff] flex flex-wrap items-center justify-between text-[11px] text-[#434655] border-t border-[#c3c6d7]/30">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]"></span>
              <span>
                p95 Latency: <strong className="text-[#0b1c30]">{currentThread.p95Latency}</strong>
              </span>
            </span>
            <span>
              Tokens Synthesized:{' '}
              <strong className="text-[#0b1c30]">{currentThread.tokensSynthesized} tokens</strong>
            </span>
            <span>
              Grounding Pass Rate:{' '}
              <strong className="text-[#0b1c30]">{currentThread.groundingPassRate}</strong>
            </span>
          </div>
          <div className="text-[#1d4ed8] font-medium hidden sm:block">
            Zero transport reset signals recorded
          </div>
        </div>
      </div>
    </div>
  );
};
