import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Cpu, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';
import { AnalyticalTrace } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  traces: AnalyticalTrace[];
  onSelectTrace: (trace: AnalyticalTrace) => void;
  onOpenIngest: () => void;
  onOpenQuery: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  traces,
  onSelectTrace,
  onOpenIngest,
  onOpenQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTraces = traces.filter((t) =>
    t.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.traceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.sources.some((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl max-w-lg w-full border border-[#e2e8f0] shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#e2e8f0]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search knowledge nodes, corpora, traces..."
            className="flex-1 text-[13px] text-slate-800 placeholder-slate-400 outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {searchTerm === '' && (
            <div className="px-2 pt-1 pb-1">
              <span className="font-geist text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Quick Actions
              </span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => {
                    onClose();
                    onOpenQuery();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left group"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#1d4ed8]" />
                    <span className="font-geist text-[12.5px] font-medium">New Query Session</span>
                  </div>
                  <span className="text-[10.5px] font-mono-code text-slate-400 group-hover:text-slate-600">
                    Enter ↵
                  </span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenIngest();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-slate-700 text-left group"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#1d4ed8]" />
                    <span className="font-geist text-[12.5px] font-medium">Ingest Document to Corpus</span>
                  </div>
                  <span className="text-[10.5px] font-mono-code text-slate-400 group-hover:text-slate-600">
                    Upload
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Traces result section */}
          <div className="px-2 pt-2 pb-1">
            <span className="font-geist text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Indexed Traces &amp; Syntheses
            </span>
            <div className="mt-1 space-y-1">
              {filteredTraces.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching traces or documents found.
                </div>
              ) : (
                filteredTraces.map((trace) => (
                  <button
                    key={trace.id}
                    onClick={() => {
                      onSelectTrace(trace);
                      onClose();
                    }}
                    className="w-full p-2 rounded-lg hover:bg-slate-50 text-left border border-transparent hover:border-[#e2e8f0] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-mono-code text-[#1d4ed8] font-medium">
                        {trace.matchScore}% Match · {trace.traceNumber}
                      </span>
                      <span className="text-slate-400 font-geist">{trace.timestamp}</span>
                    </div>
                    <p className="font-geist text-[12px] text-slate-800 line-clamp-1">
                      {trace.query}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-3.5 py-2 bg-slate-50 border-t border-[#e2e8f0] flex items-center justify-between text-[10.5px] text-slate-500 font-mono-code">
          <span>Search index: 14,892 vectors (HNSW)</span>
          <span>ESC to exit</span>
        </div>
      </div>
    </div>
  );
};
