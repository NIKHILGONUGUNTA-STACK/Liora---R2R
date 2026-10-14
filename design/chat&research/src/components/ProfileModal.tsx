import React, { useState } from 'react';
import { Icon } from './Icon';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  generationMode?: 'stream' | 'instant';
  onGenerationModeChange?: (mode: 'stream' | 'instant') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'nikhilgonugunta2000@gmail.com',
  generationMode = 'stream',
  onGenerationModeChange = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'security' | 'billing'>('overview');
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText('liora_live_sk_a79618a108d649a39d9c874c62a8f684');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-[15px] shadow-xs">
              <Icon name="person" size={20} className="text-on-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-[15px] font-semibold text-on-surface">
                  Dr. Evelyn Voss
                </h2>
                <span className="px-2 py-0.2 rounded-full bg-[#10b981]/15 text-[#10b981] font-label-sm text-[10.5px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                  Active Enterprise
                </span>
              </div>
              <p className="font-code-sm text-[11.5px] text-secondary">
                {userEmail} • Lead Cognitive Eng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icon name="close" size={18} className="text-secondary" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-[#e2e8f0] flex items-center gap-4 text-[12.5px] font-label-md bg-white">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Icon name="dashboard" size={14} className={activeTab === 'overview' ? 'text-primary' : 'text-secondary'} />
            <span>Account & Quotas</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'models'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Icon name="memory" size={14} className={activeTab === 'models' ? 'text-primary' : 'text-secondary'} />
            <span>Neural Engines</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Icon name="shield" size={14} className={activeTab === 'security' ? 'text-primary' : 'text-secondary'} />
            <span>mTLS & API Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2.5 border-b-2 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'billing'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <Icon name="credit_card" size={14} className={activeTab === 'billing' ? 'text-primary' : 'text-secondary'} />
            <span>Plan & Invariant SLA</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[13px] flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Plan Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container text-white flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-[10px] uppercase tracking-wider text-primary-fixed block">
                    Current Deployment Tier
                  </span>
                  <h3 className="font-headline-sm text-[15px] font-semibold mt-0.5">
                    Enterprise Production Cluster (US-EAST-01)
                  </h3>
                  <p className="text-[11.5px] text-primary-fixed-dim mt-0.5">
                    Dedicated SDS control plane with zero-downstream reset SLA
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-code-sm text-[11px] font-semibold">
                    UNLIMITED
                  </span>
                </div>
              </div>

              {/* Usage Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                  <span className="font-label-sm text-[10px] uppercase text-secondary block font-semibold">
                    Monthly Token Quota
                  </span>
                  <div className="font-code-sm text-[16px] font-bold text-on-surface mt-1">
                    1.42M <span className="text-[11px] font-normal text-secondary">/ 10M</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: '14.2%' }}></div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                  <span className="font-label-sm text-[10px] uppercase text-secondary block font-semibold">
                    Indexed Fragments
                  </span>
                  <div className="font-code-sm text-[16px] font-bold text-on-surface mt-1">
                    42,910
                  </div>
                  <span className="font-code-sm text-[10.5px] text-[#10b981] mt-1 block">
                    ● Aegis Vault Synced
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                  <span className="font-label-sm text-[10px] uppercase text-secondary block font-semibold">
                    Grounding Fidelity
                  </span>
                  <div className="font-code-sm text-[16px] font-bold text-on-surface mt-1">
                    99.8%
                  </div>
                  <span className="font-code-sm text-[10.5px] text-primary mt-1 block">
                    Zero Hallucinations
                  </span>
                </div>
              </div>

              {/* Profile Details Table */}
              <div className="rounded-xl border border-[#e2e8f0] overflow-hidden">
                <div className="bg-slate-50 px-3.5 py-2 font-semibold text-on-surface text-[12px] border-b border-[#e2e8f0]">
                  Production Operator Identity
                </div>
                <div className="divide-y divide-[#e2e8f0] bg-white text-[12px]">
                  <div className="flex justify-between px-3.5 py-2">
                    <span className="text-secondary">Assigned Operator:</span>
                    <span className="font-medium text-on-surface">Dr. Evelyn Voss</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2">
                    <span className="text-secondary">Primary Email:</span>
                    <span className="font-medium font-mono text-on-surface">{userEmail}</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2">
                    <span className="text-secondary">SPIFFE Identity:</span>
                    <span className="font-mono text-primary text-[11px]">spiffe://aegis.internal/operator/evoss</span>
                  </div>
                  <div className="flex justify-between px-3.5 py-2">
                    <span className="text-secondary">Role Permission:</span>
                    <span className="font-medium text-on-surface">Cluster Lead (Read / Synthesize / Spec Export)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-3">
              <div className="text-[12px] text-secondary">
                Configure default reasoning engines and grounding thresholds for cognitive synthesis.
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-primary bg-primary-fixed/20 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-on-surface text-[13px]">Liora Precision 4.5</span>
                      <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9.5px] font-semibold">DEFAULT</span>
                    </div>
                    <p className="text-secondary text-[11.5px] mt-0.5">
                      Deterministic mTLS AST validation, strict cosine verification (&gt;0.90)
                    </p>
                  </div>
                  <span className="font-code-sm text-[11px] text-primary font-semibold">412ms Latency</span>
                </div>

                <div className="p-3 rounded-xl border border-[#e2e8f0] bg-white hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface text-[13px]">Liora Ultra 4.2</span>
                    <p className="text-secondary text-[11.5px] mt-0.5">
                      128k context window, multi-region topological diagramming
                    </p>
                  </div>
                  <span className="font-code-sm text-[11px] text-secondary">580ms Latency</span>
                </div>

                <div className="p-3 rounded-xl border border-[#e2e8f0] bg-white hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface text-[13px]">Liora Fast-Inference 3.0</span>
                    <p className="text-secondary text-[11.5px] mt-0.5">
                      Sub-120ms response, quick corpus fragment indexing
                    </p>
                  </div>
                  <span className="font-code-sm text-[11px] text-secondary">118ms Latency</span>
                </div>
              </div>

              {/* Answer Generation Mode (Streaming vs Instant) */}
              <div className="pt-3 border-t border-[#e2e8f0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface text-[12.5px]">Answer Synthesis Mode</span>
                  <span className="font-code-sm text-[10.5px] text-secondary">ChatGPT progressive vs Batch</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onGenerationModeChange('stream')}
                    type="button"
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      generationMode === 'stream'
                        ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                        : 'border-[#e2e8f0] bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[12px] text-on-surface">Token Streaming</span>
                      {generationMode === 'stream' && (
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-secondary mt-0.5">
                      Streams tokens progressively in real-time (ChatGPT style)
                    </p>
                  </button>

                  <button
                    onClick={() => onGenerationModeChange('instant')}
                    type="button"
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      generationMode === 'instant'
                        ? 'border-primary bg-primary-fixed/20 ring-1 ring-primary'
                        : 'border-[#e2e8f0] bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[12px] text-on-surface">Instant Output</span>
                      {generationMode === 'instant' && (
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-secondary mt-0.5">
                      Delivers full synthesized invariant at once when ready
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="text-[12px] text-secondary">
                Cryptographic keys and Envoy SDS service access credentials.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface text-[12px]">Live Production API Key</span>
                  <button
                    onClick={handleCopyKey}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-semibold text-[11.5px] cursor-pointer"
                  >
                    <Icon name={copiedKey ? 'check' : 'content_copy'} size={13} />
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="p-2 bg-slate-200/80 rounded-lg font-mono text-[11px] text-on-surface select-all">
                  liora_live_sk_a79618a108d649a39d9c874c62a8f684
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#e2e8f0] space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-secondary">mTLS Root Anchor:</span>
                  <span className="font-mono text-on-surface">aegis_dual_intermediate_bundle</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Cert Rotation Grace Window:</span>
                  <span className="font-medium text-on-surface">72 Hours Parallel Handshake</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Active SDS Enclave:</span>
                  <span className="text-[#10b981] font-semibold">● Connected (GRPC v3)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-3 text-[12px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[13px] text-on-surface">Enterprise Dedicated Agreement</h4>
                  <p className="text-secondary text-[11.5px]">Contract: AC-2024-AEGIS-PROD • Renews October 2027</p>
                </div>
                <span className="px-2 py-1 rounded bg-[#10b981]/15 text-[#10b981] font-semibold text-[11px]">
                  99.999% SLA
                </span>
              </div>
              <ul className="space-y-1.5 text-secondary pl-4 list-disc text-[12px]">
                <li>Zero-data-loss failover guarantee across regional partitions</li>
                <li>Unlimited grounded queries and spec generation</li>
                <li>Dedicated neural inference enclave with custom CA anchors</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e2e8f0] bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-label-md text-[12.5px] font-medium hover:bg-primary-container cursor-pointer"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
