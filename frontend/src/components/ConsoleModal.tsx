import React, { useState } from 'react';
import { BENCHMARK_THREADS, BenchmarkThread } from '../data/mockData';

interface ConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsoleModal: React.FC<ConsoleModalProps> = ({ isOpen, onClose }) => {
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [queryInput, setQueryInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'merkle' | 'telemetry'>('response');
  const [mode, setMode] = useState<'deterministic' | 'stochastic'>('deterministic');
  const [showJsonExport, setShowJsonExport] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen) return null;

  const currentThread: BenchmarkThread = BENCHMARK_THREADS[selectedThreadIndex];

  const handleRunQuery = () => {
    if (!queryInput.trim()) return;
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 450);
  };

  const proofReceiptJson = JSON.stringify(
    {
      engine_version: 'v4.5-nitro-enclave',
      thread_id: currentThread.id,
      timestamp: new Date().toISOString(),
      enclave_node: currentThread.enclaveNode,
      p95_latency_ms: 42.1,
      merkle_root: '0x74f2b998cf2027e1a6c0b99144d189ca8f23479a95bc632a9e3089d71a',
      grounding_fidelity: mode === 'deterministic' ? 99.82 : 46.5,
      hallucination_drift: mode === 'deterministic' ? 0.0 : 53.5,
      zero_speculative_tokens: mode === 'deterministic',
      verified_sources: currentThread.sources.map((s) => ({
        index: s.badgeIndex,
        file: s.filename,
        sha256: s.sha256,
        byte_range: s.byteOffset,
        cosine_similarity: s.similarity,
      })),
      cryptographic_attestation: {
        pcr0: '88c30a4bf...e2891d4a',
        pcr1: '3200abf41...99bc1210',
        hardware_signature: 'ED25519_HARDWARE_KEY_SEALED',
      },
    },
    null,
    2
  );

  const handleCopyReceipt = () => {
    navigator.clipboard?.writeText(proofReceiptJson);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-[#eff4ff] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#004ac6] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#0b1c30]">
                  Liora Interactive Workbench Console
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#d3e4fe] text-[#1d4ed8] text-[10px] font-mono font-bold">
                  v4.5 LIVE
                </span>
              </div>
              <p className="text-xs text-[#434655]">
                Isolated Hardware Enclave • Sub-50ms Zero-Hallucination Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Engine Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 text-xs">
              <button
                onClick={() => setMode('deterministic')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  mode === 'deterministic'
                    ? 'bg-[#004ac6] text-white shadow-xs'
                    : 'text-[#434655] hover:text-[#0b1c30]'
                }`}
              >
                Deterministic (Verified)
              </button>
              <button
                onClick={() => setMode('stochastic')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  mode === 'stochastic'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-[#434655] hover:text-[#0b1c30]'
                }`}
              >
                Stochastic (Simulate Drift)
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Query / Thread Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          {/* Thread Presets Selector */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-[#434655] shrink-0 pr-1">
              Test Corpus:
            </span>
            {BENCHMARK_THREADS.map((thread, index) => (
              <button
                key={thread.id}
                onClick={() => {
                  setSelectedThreadIndex(index);
                  setQueryInput(thread.query);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedThreadIndex === index
                    ? 'bg-[#eff4ff] text-[#004ac6] border-blue-300 font-semibold shadow-2xs'
                    : 'bg-white text-[#434655] border-slate-200 hover:border-blue-200'
                }`}
              >
                {thread.id}
              </button>
            ))}
          </div>

          {/* Query input field */}
          <div className="flex-1 w-full flex items-center gap-2">
            <input
              type="text"
              value={queryInput || currentThread.query}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask any complex technical question against indexed knowledge..."
              className="flex-1 px-4 py-2 rounded-xl bg-[#eff4ff] border border-blue-100 text-xs sm:text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
            />
            <button
              onClick={handleRunQuery}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-[#004ac6] text-white hover:bg-[#1d4ed8] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRunning ? 'animate-spin' : ''}`}>
                {isRunning ? 'progress_activity' : 'bolt'}
              </span>
              <span>{isRunning ? 'Proving...' : 'Run Verification'}</span>
            </button>
          </div>
        </div>

        {/* Console Tab Selector */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('response')}
              className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'response'
                  ? 'border-[#004ac6] text-[#004ac6]'
                  : 'border-transparent text-[#434655] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Synthesized Response &amp; Citations</span>
            </button>
            <button
              onClick={() => setActiveTab('merkle')}
              className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'merkle'
                  ? 'border-[#004ac6] text-[#004ac6]'
                  : 'border-transparent text-[#434655] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              <span>Merkle Proof Tree &amp; Byte Offsets</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`pb-3 flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'telemetry'
                  ? 'border-[#004ac6] text-[#004ac6]'
                  : 'border-transparent text-[#434655] hover:text-[#0b1c30]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span>Latency &amp; Enclave Telemetry</span>
            </button>
          </div>

          <button
            onClick={() => setShowJsonExport(!showJsonExport)}
            className="text-xs text-[#004ac6] hover:underline flex items-center gap-1 font-mono pb-2"
          >
            <span className="material-symbols-outlined text-[14px]">data_object</span>
            <span>{showJsonExport ? 'Hide Raw Receipt' : 'Export JSON Receipt'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
          {showJsonExport ? (
            <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 font-mono text-xs relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
                <span className="text-blue-400 font-bold">cryptographic_proof_receipt.json</span>
                <button
                  onClick={handleCopyReceipt}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copiedReceipt ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedReceipt ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto leading-relaxed">{proofReceiptJson}</pre>
            </div>
          ) : activeTab === 'response' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left response card */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {mode === 'stochastic' && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-xs">
                    <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0">warning</span>
                    <div>
                      <span className="font-bold">Stochastic RAG Simulation Mode Active: </span>
                      Showing standard probabilistic output without zero-tolerance cosine gates. Notice hypothetical citations and hallucination risk drift (+53.5%).
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#0b1c30]">
                        Verified Response
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          mode === 'deterministic'
                            ? 'bg-[#e5eeff] text-[#004ac6]'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {mode === 'deterministic' ? 'ZERO-DRIFT GUARANTEED' : 'UNGROUNDED HYPOTHETICAL'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#737686]">
                      {currentThread.tokensSynthesized} tokens
                    </span>
                  </div>

                  <p className="text-sm text-[#0b1c30] leading-relaxed">
                    {currentThread.synthesizedLead}{' '}
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold font-mono text-xs">
                      [1]
                    </span>
                    .
                  </p>

                  <div className="flex flex-col gap-3">
                    {currentThread.steps.map((step) => (
                      <div
                        key={step.number}
                        className="p-3.5 rounded-xl bg-[#eff4ff] border border-blue-100 flex items-start gap-3"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-blue-200 text-[#004ac6] font-mono text-xs font-bold">
                          {step.number}
                        </span>
                        <div className="text-xs text-[#0b1c30] leading-relaxed">
                          <span className="font-bold">{step.title}: </span>
                          <span>{step.description} </span>
                          <span className="text-[#004ac6] font-mono font-bold">[{step.citationId}]</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs space-y-1">
                    <div className="text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
                      {currentThread.codeConfig.filename}
                    </div>
                    <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {currentThread.codeConfig.code}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Right verified evidence stack */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0b1c30]">Grounding Audit</span>
                    <span className="text-xs text-[#004ac6] font-bold font-mono">
                      {mode === 'deterministic' ? '99.82%' : '46.50%'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        mode === 'deterministic' ? 'bg-[#004ac6] w-[99.8%]' : 'bg-red-500 w-[46.5%]'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#737686] font-mono">
                    <span>Enclave Proof: Pass</span>
                    <span>P95: 42ms</span>
                  </div>
                </div>

                <div className="font-bold text-xs text-[#0b1c30] uppercase tracking-wider pt-1">
                  Matched Knowledge Fragments
                </div>

                {currentThread.sources.map((src) => (
                  <div
                    key={src.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#004ac6]">
                        [{src.badgeIndex}] {src.filename}
                      </span>
                      <span className="text-[11px] font-mono text-[#737686]">{src.section}</span>
                    </div>
                    <p className="text-xs text-[#434655] italic leading-relaxed">
                      {src.quote}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-100">
                      <span>Sim: {src.similarity}</span>
                      <span className="text-blue-700">{src.byteOffset}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'merkle' ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col gap-6">
              <div>
                <h4 className="font-bold text-base text-[#0b1c30]">
                  Cryptographic Merkle Proof Tree Explorer
                </h4>
                <p className="text-xs text-[#434655] mt-1">
                  Every byte offset of raw text is hashed into immutable leaf nodes. Merkle paths guarantee no synthesized text is interpolated without mathematically verifiable citations.
                </p>
              </div>

              {/* Visual Tree Display */}
              <div className="flex flex-col items-center gap-4 py-4 font-mono text-xs">
                {/* Root Node */}
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md text-center border border-blue-400">
                  <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">ROOT HASH</div>
                  <div className="font-bold text-xs mt-0.5">0x74f2b998cf2027e1a6c0...3089d71a</div>
                </div>

                {/* Connecting lines */}
                <div className="w-px h-6 bg-slate-300"></div>

                {/* Level 1 branches */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-xl text-center">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">BRANCH NODE A</div>
                    <div className="text-[11px] text-slate-800">0x4b9a1ef849...ac91</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">BRANCH NODE B</div>
                    <div className="text-[11px] text-slate-800">0x8a0c93d251...e18b</div>
                  </div>
                </div>

                <div className="w-px h-6 bg-slate-300"></div>

                {/* Level 0 Leaf nodes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  {currentThread.sources.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-left">
                      <div className="flex items-center justify-between text-[10px] font-bold text-blue-700 uppercase">
                        <span>LEAF [{s.badgeIndex}]</span>
                        <span>{s.byteOffset}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 truncate mt-1">
                        {s.filename}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        SHA256: {s.sha256}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
                <span className="text-xs text-[#737686] font-mono">P95 RETRIEVAL + PROVING</span>
                <span className="text-3xl font-bold text-[#004ac6] font-mono">42ms flat</span>
                <span className="text-xs text-[#434655]">Bounded execution within AWS Nitro Enclave CPU</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
                <span className="text-xs text-[#737686] font-mono">ENCLAVE ATTESTATION</span>
                <span className="text-3xl font-bold text-emerald-600 font-mono">SEALED</span>
                <span className="text-xs text-[#434655]">Hardware PCR0 hash verified against KMS</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-2">
                <span className="text-xs text-[#737686] font-mono">MEMORY ZEROIZATION</span>
                <span className="text-3xl font-bold text-[#1d4ed8] font-mono">100% WIPED</span>
                <span className="text-xs text-[#434655]">Ephemeral session RAM purged upon receipt sign</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#eff4ff] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#434655] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Connected: {currentThread.enclaveNode}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 text-[#0b1c30] font-medium border border-slate-300"
            >
              Exit Console
            </button>
            <button
              onClick={handleCopyReceipt}
              className="px-5 py-2 rounded-full bg-[#004ac6] hover:bg-[#1d4ed8] text-white font-medium shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedReceipt ? 'done' : 'content_copy'}
              </span>
              <span>{copiedReceipt ? 'Receipt Copied' : 'Copy Attestation Proof'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
