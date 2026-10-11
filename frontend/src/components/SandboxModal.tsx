import React, { useState, useEffect } from 'react';

interface SandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const SandboxModal: React.FC<SandboxModalProps> = ({ isOpen, onClose, email }) => {
  const [step, setStep] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }
    const timer1 = setTimeout(() => setStep(1), 600);
    const timer2 = setTimeout(() => setStep(2), 1400);
    const timer3 = setTimeout(() => setStep(3), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const mockApiKey = 'liora_live_sk_nitro_' + Math.random().toString(36).substring(2, 12);
  const curlCmd = `curl -X POST https://api.liora.ai/v4.5/verify \\\n  -H "Authorization: Bearer ${mockApiKey}" \\\n  -d '{"query": "mTLS SDS failover", "corpus_id": "aegis_vault"}'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#004ac6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">cloud_done</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0b1c30]">
                Sovereign Sandbox Initialized
              </h3>
              <p className="text-xs text-[#434655]">
                Assigned to: <strong className="text-[#0b1c30]">{email || 'evaluator@enterprise.io'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Provisioning Progress Steps */}
        <div className="flex flex-col gap-2.5 bg-[#eff4ff] p-4 rounded-2xl border border-blue-100 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            <span>Allocating AWS Nitro Enclave (#EU-WEST-4)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            {step >= 1 ? (
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-[16px] text-blue-600 animate-spin">progress_activity</span>
            )}
            <span>Zero Data Retention SLA &amp; RAM Flush Active</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            {step >= 2 ? (
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            ) : (
              <span className="material-symbols-outlined text-[16px] text-slate-400">hourglass_empty</span>
            )}
            <span>Sealing Ephemeral ECDH Hardware Attestation Keys</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            {step >= 3 ? (
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
            ) : (
              <span className="material-symbols-outlined text-[16px] text-slate-400">hourglass_empty</span>
            )}
            <span className="font-bold text-[#004ac6]">
              Sandbox Live: 14-Day Free Evaluation Tier Ready
            </span>
          </div>
        </div>

        {/* Generated Sandbox Token */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#0b1c30]">
            Ephemeral Sandbox API Key (Zero Token Markup)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={mockApiKey}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-[#0b1c30]"
            />
            <button
              onClick={() => {
                navigator.clipboard?.writeText(mockApiKey);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#004ac6] text-white hover:bg-[#1d4ed8] text-xs font-semibold shrink-0"
            >
              {copiedKey ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>

        {/* Quick cURL snippet */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
            Test Instant Verification via cURL
          </span>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
            {curlCmd}
          </pre>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-[#004ac6] text-white hover:bg-[#1d4ed8] font-semibold text-sm shadow-md"
        >
          Launch in Local Workspace
        </button>
      </div>
    </div>
  );
};
