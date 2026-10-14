import React, { useState } from 'react';

export const BenchmarkSection: React.FC = () => {
  const [selectedRadarAxis, setSelectedRadarAxis] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(3); // Step 4 selected by default

  const radarMetrics = [
    { name: 'Citation Precision', liora: 99.8, baseline: 52.4, desc: 'Exact source byte offset grounding' },
    { name: 'Multi-hop Depth', liora: 98.2, baseline: 61.0, desc: '8-hop document traversal without truncation' },
    { name: 'Enclave Isolation', liora: 100.0, baseline: 24.5, desc: 'Hardware-verified Nitro enclave memory' },
    { name: 'Latency Consistency', liora: 97.4, baseline: 46.2, desc: 'P95 latency bounded under 50ms' },
    { name: 'Zero-Hallucination', liora: 99.9, baseline: 34.8, desc: 'Rejection of speculative hallucinated tokens' },
  ];

  const pipelineSteps = [
    {
      num: '01',
      title: 'Query Ingestion & Sharded Embeddings',
      desc: 'Raw query parsed; 512-token chunks mapped to deterministic vector coordinate space.',
      duration: '4ms',
    },
    {
      num: '02',
      title: 'Deterministic Sub-graph Traversal',
      desc: 'Hierarchical HNSW traversal with cosine parity gate ≥ 0.942, pruning 99.2% irrelevant branches.',
      duration: '18ms',
    },
    {
      num: '03',
      title: 'Ephemeral Cryptographic Merkle Proof',
      desc: 'SHA-256 byte offset leaf hashing executed inside isolated AWS Nitro Enclave memory.',
      duration: '12ms',
    },
    {
      num: '04',
      title: 'Synthesized Answer with Proof Receipt',
      desc: '100% verified citation tags [1][2], zero speculative tokens, signed with hardware key.',
      duration: '8ms',
      highlight: true,
    },
  ];

  return (
    <section className="w-full py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#eff4ff]/30 border-y border-slate-200/80" id="benchmark">
      <div className="max-w-7xl mx-auto flex flex-col gap-12 sm:gap-14">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-[#004ac6] text-[11px] font-bold tracking-wider uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#004ac6] animate-pulse"></span>
            <span>EMPIRICAL EVALUATION &amp; LAB BENCHMARKS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0b1c30] tracking-tight leading-tight">
            Mathematical grounding replaces probabilistic guesswork.
          </h2>
          <p className="text-base text-[#434655] leading-relaxed">
            Benchmarked over 120,000 multi-hop enterprise queries across regulatory, financial, and infrastructure corpora with strict zero-shadow lab precision.
          </p>
        </div>

        {/* 4 Stat KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hallucination Rate */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-4 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#004ac6] font-mono text-[11px] font-bold border border-blue-200">
                HALLUCINATION RATE
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#004ac6]">verified_user</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
                &lt; 0.05%
              </div>
              <div className="text-[12px] text-[#434655] mt-1 leading-snug">
                Zero speculative hallucination drift across verified test sets.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-[#737686]">
              <span className="text-[#004ac6] font-bold">99.82% pass rate</span>
              <span>vs 18.4% baseline</span>
            </div>
          </div>

          {/* Card 2: Deterministic Latency */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-4 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#1d4ed8] font-mono text-[11px] font-bold border border-blue-200">
                DETERMINISTIC LATENCY
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#1d4ed8]">speed</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#1d4ed8] tracking-tight">
                42ms
              </div>
              <div className="text-[12px] text-[#434655] mt-1 leading-snug">
                P95 retrieval &amp; zero-knowledge proving in AWS Nitro Enclaves.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-[#737686]">
              <span className="text-[#1d4ed8] font-semibold">FIPS 140-3 verified</span>
              <span>EU-WEST &amp; US-EAST</span>
            </div>
          </div>

          {/* Card 3: Cryptographic Proof */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-4 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#824500] font-mono text-[11px] font-bold border border-amber-200">
                CRYPTOGRAPHIC PROOF
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#824500]">pin</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
                100% Byte Audit
              </div>
              <div className="text-[12px] text-[#434655] mt-1 leading-snug">
                Every synthesized token tied to source byte offsets via SHA-256.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-[#737686]">
              <span className="text-[#824500] font-medium truncate">0x74f2b9...9d71a</span>
              <span>Immutable Root</span>
            </div>
          </div>

          {/* Card 4: Multi-Hop Reasoning */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-4 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#004ac6] font-mono text-[11px] font-bold border border-blue-200">
                MULTI-HOP REASONING
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#004ac6]">hub</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
                99.4%
              </div>
              <div className="text-[12px] text-[#434655] mt-1 leading-snug">
                Cross-document synthesis depth with zero context truncation.
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-[#737686]">
              <span className="text-[#004ac6] font-semibold">Zero Truncation</span>
              <span>Depth = 8 Hops</span>
            </div>
          </div>
        </div>

        {/* Telemetry Matrix & Benchmark Lab Container */}
        <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden flex flex-col shadow-sm">
          {/* Header Bar */}
          <div className="px-5 sm:px-6 py-4 bg-[#eff4ff]/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]"></span>
                <span className="font-bold text-[16px] text-[#0b1c30]">
                  Telemetry Matrix &amp; Benchmark Lab
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[#434655] font-mono text-[11px]">
                Multi-Tenant Stress Test N=120,000
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#434655]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-red-500 rounded-full"></span>
                <span>Standard Vector RAG (Stochastic)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-[#004ac6] rounded-full"></span>
                <span className="text-[#004ac6] font-semibold">Liora Deterministic Engine</span>
              </div>
            </div>
          </div>

          {/* Grid: Radar Stress Test (Left) + Live Trace Timeline (Right) */}
          <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Grounding Architecture Radar & Stress Test */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#eff4ff]/40 border border-slate-200/90 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#004ac6]">radar</span>
                    <span className="font-bold text-[15px] text-[#0b1c30]">
                      Grounding Architecture Radar &amp; Stress Test
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#004ac6] font-mono text-[10px] font-bold border border-blue-200">
                    5-AXIS AUDIT
                  </span>
                </div>
                <p className="text-xs text-[#434655] leading-relaxed">
                  Evaluation across 5 rigorous cryptographic &amp; semantic integrity vectors under high contention.
                </p>

                {/* Radar SVG */}
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 flex flex-col items-center justify-center relative">
                  <svg className="w-full max-w-[320px] h-60 overflow-visible" viewBox="0 0 320 240">
                    {/* Concentric pentagon grids */}
                    <polygon
                      fill="none"
                      points="160,30 265,75 225,185 95,185 55,75"
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <polygon
                      fill="none"
                      points="160,60 230,90 205,165 115,165 90,90"
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <polygon
                      fill="none"
                      points="160,90 195,105 185,145 135,145 125,105"
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />

                    {/* Radial axis lines */}
                    <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="160" y1="120" y2="30" />
                    <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="265" y1="120" y2="75" />
                    <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="225" y1="120" y2="185" />
                    <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="95" y1="120" y2="185" />
                    <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="55" y1="120" y2="75" />

                    {/* Red baseline polygon */}
                    <polygon
                      fill="rgba(239, 68, 68, 0.12)"
                      points="160,82 205,102 180,148 128,155 105,100"
                      stroke="#ef4444"
                      strokeDasharray="3 2"
                      strokeWidth="1.8"
                    />

                    {/* Blue Liora polygon */}
                    <polygon
                      fill="rgba(0, 74, 198, 0.18)"
                      points="160,36 260,78 221,180 99,180 60,78"
                      stroke="#004ac6"
                      strokeWidth="2.2"
                    />

                    {/* Vertex markers */}
                    <circle cx="160" cy="36" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="260" cy="78" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="221" cy="180" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="99" cy="180" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5" />
                    <circle cx="60" cy="78" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5" />

                    {/* Text labels matching exactly */}
                    <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="middle" x="160" y="20">
                      Citation Precision (99.8%)
                    </text>
                    <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="start" x="272" y="78">
                      Multi-hop Depth
                    </text>
                    <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="start" x="230" y="200">
                      Enclave Isolation
                    </text>
                    <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="end" x="90" y="200">
                      Latency Consistency
                    </text>
                    <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="end" x="48" y="78">
                      Zero-Hallucination
                    </text>
                  </svg>
                </div>
              </div>

              {/* Tags below radar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-[#0b1c30]">
                  100k Multi-hop Queries
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-[#0b1c30]">
                  Zero-Drift Threshold (&gt;0.942)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-[#0b1c30]">
                  Split-Brain Failover
                </span>
              </div>
            </div>

            {/* Right: Live Trace & Proof Synthesis Timeline */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-slate-200/90 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#1d4ed8]">timeline</span>
                    <span className="font-bold text-[15px] text-[#0b1c30]">
                      Live Trace &amp; Proof Synthesis Timeline
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#1d4ed8] font-mono text-[10px] font-bold border border-blue-200">
                    REAL-TIME PIPELINE
                  </span>
                </div>
                <p className="text-xs text-[#434655] leading-relaxed">
                  Step-by-step cryptographic traversal path executed inside hardware-isolated enclaves.
                </p>

                {/* Steps List */}
                <div className="flex flex-col gap-2.5">
                  {pipelineSteps.map((step, idx) => (
                    <div
                      key={step.num}
                      onClick={() => setActiveStep(idx)}
                      className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                        step.highlight
                          ? 'bg-[#eff4ff]/60 border-slate-200/90 hover:border-blue-400'
                          : 'bg-[#eff4ff]/40 border-slate-200/90 hover:border-blue-300'
                      }`}
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] shrink-0 ${
                          step.highlight
                            ? 'bg-[#004ac6] text-white'
                            : 'bg-[#e5eeff] text-[#004ac6]'
                        }`}
                      >
                        {step.num}
                      </span>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="font-semibold text-[#0b1c30] flex items-center justify-between">
                          <span>{step.title}</span>
                          <span className="text-[10px] font-mono text-[#737686]">{step.duration}</span>
                        </div>
                        <p className="text-[#434655] text-[11px] leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Pipeline Status */}
              <div className="p-3 rounded-xl bg-[#eff4ff] border border-slate-200/90 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#0b1c30] font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-[#004ac6]">done_all</span>
                  <span>Pipeline Verified: 0 tokens ungrounded</span>
                </div>
                <span className="text-[#004ac6] font-bold font-mono text-[11px]">42ms Total</span>
              </div>
            </div>
          </div>

          {/* Dataset Validation Bottom Bar */}
          <div className="px-5 sm:px-6 py-4 bg-[#eff4ff]/60 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-[12px]">
            <span className="font-bold text-[#0b1c30] text-xs uppercase tracking-wider">
              Benchmark Dataset Validation:
            </span>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-mono">
              <div className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
                <span className="text-[#434655]">FinanceBench: </span>
                <span className="text-[#004ac6] font-bold">99.8%</span>
                <span className="text-[#c3c6d7]"> vs 64.2%</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
                <span className="text-[#434655]">LegalBench: </span>
                <span className="text-[#004ac6] font-bold">99.4%</span>
                <span className="text-[#c3c6d7]"> vs 58.1%</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
                <span className="text-[#434655]">BioMedQA: </span>
                <span className="text-[#004ac6] font-bold">99.9%</span>
                <span className="text-[#c3c6d7]"> vs 71.3%</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
                <span className="text-[#434655]">RFC/Infra Spec: </span>
                <span className="text-[#004ac6] font-bold">100%</span>
                <span className="text-[#c3c6d7]"> vs 62.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Foundation Models Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2 text-[#434655] text-[13px]">
          <span className="font-bold text-[#0b1c30]">Seamless foundation model support:</span>
          {['Claude 3.5 Sonnet', 'GPT-4o', 'DeepSeek-R1', 'Llama 3.3 (vLLM)', 'Ollama Air-Gapped'].map((model) => (
            <span
              key={model}
              className="px-3.5 py-1 rounded-full bg-white border border-slate-200/90 text-[#0b1c30] font-medium shadow-2xs hover:border-blue-400 transition-colors"
            >
              {model}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
