import React from 'react';
import { Icon } from './Icon';

interface GraphAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraphAuditModal: React.FC<GraphAuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const nodes = [
    {
      title: 'Query Tokenizer & AST Parser',
      type: 'Ingress Stage',
      metric: '32 tokens parsed',
      status: 'OK',
    },
    {
      title: 'Aegis Core Vault (kNN Search)',
      type: 'Dense Vector Matrix',
      metric: 'k=32 / 42,910 fragments',
      status: 'OK',
    },
    {
      title: 'Hybrid BM25 + Cross-Encoder',
      type: 'Re-ranking Filter',
      metric: 'Top 3 selected (Sim > 0.914)',
      status: 'OK',
    },
    {
      title: 'Liora Precision 4.5 Grounding Engine',
      type: 'Synthesis & Invariant Guard',
      metric: 'Deterministic mTLS AST Verified',
      status: 'Deterministic',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Icon name="account_tree" size={20} className="text-primary" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Query Graph & Proof-of-Grounding DAG
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-secondary flex items-center justify-center cursor-pointer"
          >
            <Icon name="close" size={20} className="text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="font-body-sm text-body-sm text-secondary">
            Auditing execution trace for <code className="font-mono text-on-surface font-semibold">THREAD-8492</code>. All citations resolve to validated vector indexes within Aegis Vault v3.2.
          </p>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-primary-fixed-dim">
            {nodes.map((node, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-primary text-on-primary font-code-sm text-code-sm flex items-center justify-center ring-4 ring-white">
                  {i + 1}
                </span>
                <div className="flex-1 bg-slate-50 border border-[#e2e8f0] p-3 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {node.title}
                    </span>
                    <span className="font-code-sm text-code-sm bg-primary-fixed text-on-primary-fixed-variant px-1.5 py-0.5 rounded font-semibold">
                      {node.status}
                    </span>
                  </div>
                  <div className="font-code-sm text-code-sm text-secondary mt-1 flex justify-between">
                    <span>{node.type}</span>
                    <span className="text-on-surface font-medium">{node.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#e2e8f0] bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
