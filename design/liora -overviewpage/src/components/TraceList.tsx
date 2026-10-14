import React, { useState } from 'react';
import {
  Filter,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Radio,
  Check,
} from 'lucide-react';
import { AnalyticalTrace } from '../types';

interface TraceListProps {
  traces: AnalyticalTrace[];
  onOpenInChat: (trace: AnalyticalTrace) => void;
  onViewMoreSessions?: () => void;
}

export const TraceList: React.FC<TraceListProps> = ({
  traces,
  onOpenInChat,
  onViewMoreSessions,
}) => {
  const [expandedSnippets, setExpandedSnippets] = useState<Record<string, boolean>>({});
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_fidelity' | 'recent'>('all');
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(true);

  const toggleSnippet = (traceId: string) => {
    setExpandedSnippets((prev) => ({
      ...prev,
      [traceId]: !prev[traceId],
    }));
  };

  const filteredTraces = traces.filter((trace) => {
    if (activeFilter === 'high_fidelity') {
      return trace.matchScore >= 98.0;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-0.5">
        <div>
          <h2 className="font-geist font-semibold text-[15px] sm:text-[16px] text-slate-900 tracking-tight">
            Recent Syntheses &amp; Analytical Traces
          </h2>
          <p className="font-sans text-[12px] text-slate-500">
            Real-time inference records with deterministic source alignments
          </p>
        </div>

        {/* Live sync & Filter buttons */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setIsLiveSyncActive(!isLiveSyncActive)}
            className={`font-mono-code text-[11px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
              isLiveSyncActive
                ? 'bg-slate-50 border-[#e2e8f0] text-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-400 line-through'
            }`}
            title="Click to toggle live ingestion streaming"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveSyncActive ? 'bg-[#10b981] animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>Live Sync</span>
          </button>

          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className="inline-flex items-center justify-center w-7.5 h-7.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            aria-label="Filter traces"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          {/* Filter dropdown */}
          {filterMenuOpen && (
            <div className="absolute right-0 top-9 w-44 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-30 py-1 text-xs">
              <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Filter Traces
              </div>
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setFilterMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 text-slate-700"
              >
                <span>All Traces (3)</span>
                {activeFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />}
              </button>
              <button
                onClick={() => {
                  setActiveFilter('high_fidelity');
                  setFilterMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 text-slate-700"
              >
                <span>Fidelity &gt; 98.0%</span>
                {activeFilter === 'high_fidelity' && (
                  <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trace items */}
      <div className="space-y-3">
        {filteredTraces.map((trace) => {
          const isExpanded = !!expandedSnippets[trace.id];
          return (
            <article
              key={trace.id}
              className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#e2e8f0] hover:border-[#1d4ed8]/40 transition-all shadow-2xs group"
            >
              {/* Top metadata & Open in chat */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-[#dce1ff] text-[#0039b5] font-semibold">
                    {trace.matchScore.toFixed(1)}% Match
                  </span>
                  <span className="font-geist text-[11px] text-slate-500 font-medium">
                    {trace.traceNumber}
                  </span>
                  <span className="font-geist text-[11px] text-slate-400">
                    · {trace.timestamp}
                  </span>
                </div>

                <button
                  onClick={() => onOpenInChat(trace)}
                  className="inline-flex items-center gap-1 text-[#1d4ed8] hover:text-[#1e40af] font-geist font-medium text-[12px] transition-colors shrink-0 group-hover:underline cursor-pointer"
                >
                  <span>Open in Chat</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Question title */}
              <h3 className="font-geist font-semibold text-[14px] text-slate-900 mt-2 tracking-tight leading-snug">
                {trace.query}
              </h3>

              {/* Inferred synthesis answer quote */}
              <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border border-[#e2e8f0]">
                <p className="font-sans text-[12.5px] text-slate-700 leading-relaxed">
                  {trace.summary}
                  {trace.highlightValue && (
                    <span
                      className={`font-mono-code text-[11px] px-1 py-0.5 rounded font-medium ${
                        trace.id === 'trace-1'
                          ? 'bg-blue-100/90 text-[#1d4ed8]'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {trace.highlightValue}
                    </span>
                  )}
                  {trace.summarySuffix}
                </p>
              </div>

              {/* Sources & Vector Toggle */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-geist text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-0.5">
                    Cited Sources:
                  </span>
                  {trace.sources.map((src, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono-code text-[10.5px]"
                    >
                      <FileText className="w-3 h-3 text-[#1d4ed8]" />
                      <span>{src.title}</span>
                      <span className="text-slate-400">· {src.detail}</span>
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => toggleSnippet(trace.id)}
                  className="font-geist text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{isExpanded ? 'Hide Chunk Vector' : 'Show Chunk Vector'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Collapsible Chunk Vector Snippet */}
              {isExpanded && (
                <div className="mt-2 p-2 rounded-lg bg-slate-100/90 border border-slate-200 font-mono-code text-[11px] text-slate-700 animate-in fade-in duration-150 break-all leading-normal">
                  <span className="text-blue-700 font-semibold">
                    [VECTOR DUMP: ID {trace.vectorChunk.id}]
                  </span>{' '}
                  <span className="text-slate-600">
                    cosine_sim: {trace.vectorChunk.cosineSim} | chunk_bytes:{' '}
                    {trace.vectorChunk.chunkBytes} | context:{' '}
                  </span>
                  <span className="text-slate-800 italic">
                    "{trace.vectorChunk.context}"
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* View all recent sessions button */}
      <div className="flex items-center justify-center pt-1 pb-1">
        <button
          onClick={onViewMoreSessions}
          className="inline-flex items-center gap-1.5 font-geist font-medium text-[12px] text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <span>View all 148 recent sessions</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
