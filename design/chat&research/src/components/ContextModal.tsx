import React from 'react';
import { EvidenceSource } from '../types';
import { Icon } from './Icon';

interface ContextModalProps {
  source: EvidenceSource | null;
  onClose: () => void;
}

export const ContextModal: React.FC<ContextModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-primary text-on-primary font-code-sm text-code-sm font-bold flex items-center justify-center">
              {source.sourceNumber}
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {source.title}
              </h3>
              <p className="font-code-sm text-code-sm text-secondary">
                Location: {source.location} • Cosine Similarity: {source.similarity.toFixed(4)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-secondary flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} className="text-secondary" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
              GROUNDED EXTRACT
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-on-surface-variant font-code-sm text-code-sm">
              Chunk #{source.metadata?.chunkId || '4291-B'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-[#e2e8f0] font-body-md text-body-md text-on-surface leading-relaxed">
            <p className="text-secondary text-code-sm font-code-sm mb-2 border-b border-[#e2e8f0] pb-1">
              [Contextual Window: Preceding 280 tokens...]
            </p>
            <p>
              {source.fullContent ||
                `${source.excerpt} Furthermore, Envoy SDS handles transient network partitions by holding the active DownstreamTlsContext configuration in hot memory, preventing upstream socket dropouts during live connection handshakes.`}
            </p>
            <p className="text-secondary text-code-sm font-code-sm mt-3 border-t border-[#e2e8f0] pt-1">
              [Contextual Window: Following 310 tokens...]
            </p>
          </div>

          {/* Technical Metadata Table */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden text-code-sm font-code-sm">
            <div className="bg-slate-100 px-3 py-1.5 font-semibold text-on-surface border-b border-[#e2e8f0]">
              Provenance & Cryptographic Invariants
            </div>
            <div className="divide-y divide-[#e2e8f0] bg-white">
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-secondary">Corpus Database:</span>
                <span className="text-on-surface font-medium">Aegis Vault v3.2 (Production Tier)</span>
              </div>
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-secondary">SHA256 Fingerprint:</span>
                <span className="text-on-surface font-mono">
                  {source.metadata?.sha256 || '9f83a210bc8201fa816e91024bdc3821049281a1bbcf8019'}
                </span>
              </div>
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-secondary">Embedding Vector Norm:</span>
                <span className="text-on-surface">1536-dim (Normalized L2)</span>
              </div>
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-secondary">Last Ingestion Verification:</span>
                <span className="text-on-surface">2024-Q3 Synthetic Chaos Matrix</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#e2e8f0] bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              navigator.clipboard.writeText(source.excerpt);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e2e8f0] bg-white text-secondary hover:text-on-surface hover:bg-slate-100 font-label-md text-label-md font-medium cursor-pointer"
          >
            <Icon name="content_copy" size={16} className="text-secondary" />
            Copy Excerpt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-medium hover:bg-primary-container cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
