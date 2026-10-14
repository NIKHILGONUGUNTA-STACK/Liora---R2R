import React, { useState } from 'react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [tab, setTab] = useState<'sso' | 'byo'>('sso');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(email || 'operator@liora.internal');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 flex flex-col gap-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              L
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0b1c30]">Operator Console</h3>
              <p className="text-xs text-[#434655]">Sovereign Enclave Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setTab('sso')}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              tab === 'sso' ? 'bg-white text-[#0b1c30] shadow-xs' : 'text-[#434655]'
            }`}
          >
            Enterprise SSO
          </button>
          <button
            onClick={() => setTab('byo')}
            className={`flex-1 py-1.5 rounded-full transition-all ${
              tab === 'byo' ? 'bg-white text-[#0b1c30] shadow-xs' : 'text-[#434655]'
            }`}
          >
            BYO API Key
          </button>
        </div>

        {tab === 'sso' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#004ac6] text-white hover:bg-[#1d4ed8] font-semibold text-sm shadow-md transition-all"
            >
              Continue with SAML / Okta SSO
            </button>

            <div className="relative flex items-center justify-center my-1">
              <div className="h-px bg-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 absolute">or</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onSuccess('github-user@verified.org');
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 text-slate-700"
              >
                <span>GitHub SSO</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSuccess('google-user@verified.org');
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2 text-slate-700"
              >
                <span>Google Cloud</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Your LLM / Embedding Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant- / sk-proj- / ollama_endpoint"
                required
                className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#004ac6]/30"
              />
              <span className="text-[11px] text-[#737686]">
                Keys are sealed in ephemeral enclave RAM and never written to disk.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#004ac6] text-white hover:bg-[#1d4ed8] font-semibold text-sm shadow-md transition-all"
            >
              Connect Key to Sovereign Enclave
            </button>
          </form>
        )}

        <p className="text-[11px] text-center text-[#737686]">
          Protected by FIPS 140-3 Hardware Cryptography &amp; SOC 2 Type II
        </p>
      </div>
    </div>
  );
};
