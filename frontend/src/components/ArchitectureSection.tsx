import React, { useState } from 'react';

export const ArchitectureSection: React.FC = () => {
  const [activeThreshold, setActiveThreshold] = useState(0.942);
  const [merkleVerified, setMerkleVerified] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);

  const fullHash = '0x74f2b998cf2027e1a6c0b99144d189ca8f23479a95bc632a9e3089d71a';

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(fullHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <section className="w-full py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#f8f9ff]" id="architecture">
      <div className="max-w-7xl mx-auto flex flex-col gap-14 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl flex flex-col gap-3">
            <span className="text-[12px] uppercase tracking-wider text-[#004ac6] font-bold">
              Deterministic Engine Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0b1c30] tracking-tight leading-tight">
              Built for environments where a 1% hallucination rate is unacceptable.
            </h2>
          </div>
          <p className="text-base text-[#434655] max-w-md leading-relaxed">
            Standard RAG stitches stochastic guesses together. Liora treats enterprise knowledge as a cryptographic ledger with strict mathematical verification boundaries.
          </p>
        </div>

        {/* Bento Grid (3 Pillars) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Hierarchical Vector Graph Traversal */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between transition-all hover:shadow-lg hover:border-blue-400 group">
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e5eeff] flex items-center justify-center text-[#004ac6] group-hover:bg-[#2563eb] group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[28px]">hub</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                Hierarchical Vector Graph Traversal
              </h3>
              <p className="text-[14px] text-[#434655] leading-relaxed">
                Synthesizes across tens of thousands of fragmented documents using multi-hop graph indices and zero-tolerance cosine thresholds.
              </p>
            </div>

            <div className="mt-8 pt-5 bg-[#eff4ff]/60 rounded-2xl p-4 flex flex-col gap-2.5 border border-blue-100/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#434655] font-medium">Cosine Parity Gate</span>
                <span className="text-[#1d4ed8] font-bold font-mono">
                  &gt; {activeThreshold.toFixed(3)} Thresh
                </span>
              </div>
              <div className="w-full bg-[#d3e4fe] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1d4ed8] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${activeThreshold * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#737686]">
                  Rejects ungrounded speculative tokens automatically
                </span>
                <button
                  onClick={() => setActiveThreshold(activeThreshold === 0.942 ? 0.985 : 0.942)}
                  className="text-[10px] text-[#004ac6] font-semibold underline cursor-pointer hover:text-blue-800"
                >
                  {activeThreshold === 0.942 ? 'Test Strict' : 'Reset'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Cryptographic Provenance Receipts */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between transition-all hover:shadow-lg hover:border-blue-400 group">
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e5eeff] flex items-center justify-center text-[#1d4ed8] group-hover:bg-[#1d4ed8] group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[28px]">token</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                Cryptographic Provenance Receipts
              </h3>
              <p className="text-[14px] text-[#434655] leading-relaxed">
                Every token synthesized carries an immutable SHA-256 Merkle root tied to source text byte offsets for regulatory audibility.
              </p>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-[#eff4ff]/60 text-[12px] text-[#0b1c30] space-y-1.5 border border-blue-100/60">
              <div className="flex items-center justify-between">
                <span className="text-[#004ac6] font-bold text-[11px] tracking-wider uppercase font-mono">
                  MERKLE ROOT RECEIPT
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-[10px] text-[#1d4ed8] font-mono hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {copiedHash ? 'done' : 'content_copy'}
                  </span>
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-[11px] text-[#434655] truncate font-mono bg-white/80 p-1.5 rounded border border-slate-200">
                0x74f2b9...e3089d71a
              </div>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#1d4ed8] font-semibold">
                <span className="material-symbols-outlined text-[15px]">done_all</span>
                <span>Byte-Range Parity Validated</span>
              </div>
            </div>
          </div>

          {/* Card 3: Air-Gapped & Sovereign Deployment */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between transition-all hover:shadow-lg hover:border-blue-400 group">
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e5eeff] flex items-center justify-center text-[#824500] group-hover:bg-[#a65900] group-hover:text-white transition-colors shadow-xs">
                <span className="material-symbols-outlined text-[28px]">lock_clock</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0b1c30]">
                Air-Gapped &amp; Sovereign Deployment
              </h3>
              <p className="text-[14px] text-[#434655] leading-relaxed">
                Deploy in AWS Nitro Enclaves, private Kubernetes, or locally with Ollama and vLLM. Zero customer tokens ever leave your designated boundary.
              </p>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-[#eff4ff]/60 flex items-center justify-between border border-blue-100/60">
              <div className="flex flex-col">
                <span className="text-[12px] text-[#0b1c30] font-semibold">
                  Zero Data Retention
                </span>
                <span className="text-[11px] text-[#434655]">
                  Ephemeral RAM Flushes
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#d3e4fe] text-[#004ac6] text-[11px] font-bold font-mono">
                FIPS 140-3
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
