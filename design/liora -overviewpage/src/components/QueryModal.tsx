import React, { useState } from 'react';
import { Terminal, X, Send, Sparkles, FileText, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { AnalyticalTrace } from '../types';

interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrace: AnalyticalTrace | null;
  onRunQuery?: (prompt: string) => void;
}

export const QueryModal: React.FC<QueryModalProps> = ({
  isOpen,
  onClose,
  selectedTrace,
}) => {
  const [prompt, setPrompt] = useState(
    selectedTrace ? selectedTrace.query.replace(/^"|"$/g, '') : ''
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [response, setResponse] = useState<AnalyticalTrace | null>(selectedTrace);

  // Sync when selectedTrace changes
  React.useEffect(() => {
    if (selectedTrace) {
      setPrompt(selectedTrace.query.replace(/^"|"$/g, ''));
      setResponse(selectedTrace);
    }
  }, [selectedTrace]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      setResponse({
        id: `synth-${Date.now()}`,
        traceNumber: `Trace #TX-${Math.floor(88000 + Math.random() * 999)}`,
        matchScore: 99.2,
        timestamp: 'Just now',
        query: `"${prompt}"`,
        summary:
          'Deterministic evaluation over multi-layer embeddings verified concordance across primary security parameters. Strict cryptographic parity achieved across all 4 secure silos.',
        highlightValue: '99.8% Ground-Truth Verified',
        summarySuffix:
          ' with zero synthetic hallucination artifacts detected.',
        sources: [
          { title: 'Aegis-Auth-Spec-v4.pdf', detail: 'Page 14' },
          { title: 'SecOps-ZeroTrust-Architecture.pdf', detail: '§2.4' },
        ],
        vectorChunk: {
          id: `${Math.floor(10000 + Math.random() * 90000)}-C1`,
          cosineSim: 0.9924,
          chunkBytes: 520,
          context: 'Target assertion validated across clustered HNSW vectors...',
        },
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl max-w-xl w-full p-5 border border-[#e2e8f0] shadow-2xl relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-[#1d4ed8]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-geist font-semibold text-[14.5px] text-slate-900">
                Workspace Query &amp; Synthesis
              </h3>
              <p className="font-mono-code text-[10.5px] text-slate-400">
                us-east-2 · production-cluster-04
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Query Input */}
        <form onSubmit={handleSubmit} className="mt-3.5">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask questions against 14,892 indexed vectors..."
              className="w-full h-9 pl-3 pr-20 text-[12.5px] rounded-lg border border-[#e2e8f0] bg-slate-50 focus:bg-white focus:border-[#1d4ed8] outline-none font-sans"
            />
            <button
              type="submit"
              disabled={isSynthesizing || !prompt.trim()}
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-geist text-[11.5px] font-medium rounded-md flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <span>Query</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

        {/* Synthesis Result Body */}
        <div className="flex-1 overflow-y-auto mt-3.5 space-y-3 pr-1">
          {isSynthesizing ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="font-geist text-[12.5px] text-slate-700 font-medium">
                Running 3,072-dense vector cosine traversal...
              </p>
              <p className="font-mono-code text-[11px] text-slate-400 mt-1">
                Synthesizing Claude 3.5 Sonnet / Liora 4.5 citations
              </p>
            </div>
          ) : response ? (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-[#e2e8f0]">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-blue-100 text-[#1d4ed8] font-semibold">
                    {response.matchScore}% Match
                  </span>
                  <span className="font-geist text-slate-500 font-medium text-[11px]">
                    {response.traceNumber}
                  </span>
                </div>
                <span className="font-mono-code text-[10.5px] text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Deterministic Check Passed
                </span>
              </div>

              <div className="mt-2.5">
                <h4 className="font-geist font-semibold text-[13px] text-slate-900 mb-1.5">
                  {response.query}
                </h4>
                <p className="font-sans text-[12.5px] text-slate-700 leading-relaxed">
                  {response.summary}
                  {response.highlightValue && (
                    <span className="font-mono-code text-[11px] px-1 py-0.5 rounded bg-blue-100 text-[#1d4ed8] font-medium mx-1">
                      {response.highlightValue}
                    </span>
                  )}
                  {response.summarySuffix}
                </p>
              </div>

              {/* Cited Sources */}
              <div className="mt-3 pt-2.5 border-t border-slate-200">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-geist text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1">
                    Cited Sources:
                  </span>
                  {response.sources.map((src, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-slate-700 font-mono-code text-[10.5px] border border-slate-200"
                    >
                      <FileText className="w-3 h-3 text-[#1d4ed8]" />
                      <span>{src.title}</span>
                      <span className="text-slate-400">· {src.detail}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-sans">
              Type a prompt or choose an indexed trace to synthesize real-time citations.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-slate-500 font-mono-code">
          <span>Engine: Claude 3.5 Sonnet / Liora 4.5</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-geist font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
