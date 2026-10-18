import React from 'react';
import {
  LayoutDashboard,
  Database,
  Cpu,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface EmptyPageViewProps {
  tab: string;
  onNavigateToChat?: () => void;
}

export const EmptyPageView: React.FC<EmptyPageViewProps> = ({
  tab,
  onNavigateToChat,
}) => {
  switch (tab) {
    case 'overview':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          {/* Custom Dark SVG Illustration for System Overview */}
          <div className="relative w-72 h-72 mb-6 flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <svg
              className="w-full h-full"
              viewBox="0 0 280 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Concentric telemetry rings */}
              <circle
                cx="140"
                cy="140"
                r="110"
                stroke="#2a2a2a"
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />
              <circle
                cx="140"
                cy="140"
                r="80"
                stroke="#333333"
                strokeWidth="1.5"
              />
              <circle
                cx="140"
                cy="140"
                r="50"
                stroke="#383838"
                strokeWidth="1.5"
                strokeDasharray="2 4"
              />

              {/* Connecting Bus Lines */}
              <path
                d="M140 60 L140 100 M140 180 L140 220 M60 140 L100 140 M180 140 L220 140"
                stroke="#404040"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M84 84 L112 112 M196 196 L168 168 M196 84 L168 112 M84 196 L112 168"
                stroke="#333333"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Satellite Node 1 (pgvector HNSW) */}
              <circle cx="140" cy="50" r="14" fill="#1f1f1f" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="140" cy="50" r="4" fill="#3b82f6" />

              {/* Satellite Node 2 (Gemini LLM) */}
              <circle cx="230" cy="140" r="14" fill="#1f1f1f" stroke="#8b5cf6" strokeWidth="1.5" />
              <circle cx="230" cy="140" r="4" fill="#8b5cf6" />

              {/* Satellite Node 3 (Document Vault) */}
              <circle cx="140" cy="230" r="14" fill="#1f1f1f" stroke="#10b981" strokeWidth="1.5" />
              <circle cx="140" cy="230" r="4" fill="#10b981" />

              {/* Satellite Node 4 (Reranker Matrix) */}
              <circle cx="50" cy="140" r="14" fill="#1f1f1f" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="50" cy="140" r="4" fill="#f59e0b" />

              {/* Central Nucleus Node */}
              <circle cx="140" cy="140" r="28" fill="#171717" stroke="#4a4a4a" strokeWidth="2" />
              <circle cx="140" cy="140" r="22" fill="#212121" />
              <path
                d="M132 135 L140 127 L148 135 M140 127 L140 153"
                stroke="#e5e5e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#383838] text-xs text-neutral-300 font-medium mb-4">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Deterministic Engine Ready
            </div>
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              System Overview & Telemetry
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Connect your document stores and launch active research sessions to view live query throughput, token budgets, and reciprocal rank fusion charts.
            </p>
            {onNavigateToChat && (
              <button
                type="button"
                onClick={onNavigateToChat}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-medium text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <span>Start Research Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );

    case 'documents':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          {/* Custom Dark SVG Illustration for Document Vault */}
          <div className="relative w-72 h-72 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <svg
              className="w-full h-full"
              viewBox="0 0 280 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Geometric Grid Plate */}
              <rect
                x="40"
                y="180"
                width="200"
                height="50"
                rx="10"
                fill="#1a1a1a"
                stroke="#2e2e2e"
                strokeWidth="1.5"
              />
              <line x1="60" y1="205" x2="220" y2="205" stroke="#2a2a2a" strokeWidth="1" />
              <circle cx="70" cy="195" r="3" fill="#10b981" />
              <circle cx="85" cy="195" r="3" fill="#404040" />

              {/* Back Card (Layer 3) */}
              <rect
                x="80"
                y="65"
                width="120"
                height="130"
                rx="12"
                fill="#1c1c1c"
                stroke="#2e2e2e"
                strokeWidth="1.5"
                transform="rotate(-8 140 130)"
              />

              {/* Middle Card (Layer 2) */}
              <rect
                x="80"
                y="65"
                width="120"
                height="130"
                rx="12"
                fill="#222222"
                stroke="#383838"
                strokeWidth="1.5"
                transform="rotate(6 140 130)"
              />

              {/* Front Main Document (Layer 1) */}
              <rect
                x="80"
                y="60"
                width="120"
                height="135"
                rx="12"
                fill="#171717"
                stroke="#454545"
                strokeWidth="1.8"
              />
              {/* Document Text Line Skeletons */}
              <rect x="98" y="80" width="45" height="6" rx="3" fill="#3b82f6" />
              <rect x="98" y="96" width="84" height="4" rx="2" fill="#333333" />
              <rect x="98" y="106" width="70" height="4" rx="2" fill="#333333" />
              <rect x="98" y="116" width="78" height="4" rx="2" fill="#333333" />
              <rect x="98" y="126" width="55" height="4" rx="2" fill="#2b2b2b" />

              {/* Verified Proof Badge */}
              <circle cx="165" cy="155" r="16" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
              <path
                d="M159 155 L163 159 L171 151"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#383838] text-xs text-neutral-300 font-medium mb-4">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Knowledge Vault
            </div>
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              Document Knowledge Vault
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              No standalone documents uploaded yet. You can attach PDFs, Word docs, TXT, or presentations directly in the chat to start deterministic RAG grounding.
            </p>
            {onNavigateToChat && (
              <button
                type="button"
                onClick={onNavigateToChat}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-medium text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <span>Upload via Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );

    case 'models':
    case 'models-and-providers':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          {/* Custom Dark SVG Illustration for AI Models */}
          <div className="relative w-72 h-72 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            <svg
              className="w-full h-full"
              viewBox="0 0 280 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Silicon Base */}
              <rect
                x="60"
                y="60"
                width="160"
                height="160"
                rx="24"
                fill="#181818"
                stroke="#333333"
                strokeWidth="2"
              />

              {/* Chip Pins Top/Bottom/Left/Right */}
              <path
                d="M90 50 L90 60 M120 50 L120 60 M140 50 L140 60 M160 50 L160 60 M190 50 L190 60"
                stroke="#444444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M90 220 L90 230 M120 220 L120 230 M140 220 L140 230 M160 220 L160 230 M190 220 L190 230"
                stroke="#444444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M50 90 L60 90 M50 120 L60 120 M50 140 L60 140 M50 160 L60 160 M50 190 L60 190"
                stroke="#444444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M220 90 L230 90 M220 120 L230 120 M220 140 L230 140 M220 160 L230 160 M220 190 L230 190"
                stroke="#444444"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Core Die */}
              <rect
                x="90"
                y="90"
                width="100"
                height="100"
                rx="14"
                fill="#202020"
                stroke="#4f46e5"
                strokeWidth="1.5"
              />

              {/* Circuit Bus Lattice */}
              <path
                d="M105 105 H175 V175 H105 Z"
                stroke="#333333"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx="140" cy="140" r="18" fill="#171717" stroke="#8b5cf6" strokeWidth="2" />
              <path
                d="M135 140 L140 135 L145 140 L140 145 Z"
                fill="#a78bfa"
              />
            </svg>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#383838] text-xs text-neutral-300 font-medium mb-4">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Model Orchestration
            </div>
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              Models & Providers
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Gemini 2.5 Flash is configured as your active generation model alongside local FastEmbed 768-dim embeddings and cross-encoder rerankers.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">Gemini 2.5 Flash</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">FastEmbed 768d</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">HNSW pgvector</span>
            </div>
          </div>
        </div>
      );

    case 'analytics':
    case 'analytics-and-audit':
    case 'analytics&audit':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          {/* Custom Dark SVG Illustration for Analytics & Audit */}
          <div className="relative w-72 h-72 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <svg
              className="w-full h-full"
              viewBox="0 0 280 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back Card Plate */}
              <rect
                x="50"
                y="55"
                width="180"
                height="170"
                rx="20"
                fill="#181818"
                stroke="#333333"
                strokeWidth="1.5"
              />

              {/* Grid Lines */}
              <line x1="75" y1="100" x2="205" y2="100" stroke="#252525" strokeWidth="1" />
              <line x1="75" y1="135" x2="205" y2="135" stroke="#252525" strokeWidth="1" />
              <line x1="75" y1="170" x2="205" y2="170" stroke="#252525" strokeWidth="1" />

              {/* Bar 1 */}
              <rect x="85" y="140" width="16" height="45" rx="4" fill="#2d2d2d" />
              {/* Bar 2 */}
              <rect x="110" y="115" width="16" height="70" rx="4" fill="#3b82f6" />
              {/* Bar 3 */}
              <rect x="135" y="130" width="16" height="55" rx="4" fill="#2d2d2d" />
              {/* Bar 4 */}
              <rect x="160" y="90" width="16" height="95" rx="4" fill="#10b981" />
              {/* Bar 5 */}
              <rect x="185" y="125" width="16" height="60" rx="4" fill="#2d2d2d" />

              {/* Fidelity Radar Curve Line */}
              <path
                d="M85 130 Q120 70 160 85 T205 110"
                stroke="#f59e0b"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="160" cy="85" r="4" fill="#f59e0b" />
            </svg>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#383838] text-xs text-neutral-300 font-medium mb-4">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              Audit & Fidelity Logs
            </div>
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              Analytics & Audit Telemetry
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Track citation proof rates, deterministic faithfulness scores, token allocation budgets, and latency across hybrid retrieval stages.
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-neutral-400">
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">Faithfulness: 99.4%</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">Mean Latency: 380ms</span>
            </div>
          </div>
        </div>
      );

    case 'settings':
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          {/* Custom Dark SVG Illustration for Settings */}
          <div className="relative w-72 h-72 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <svg
              className="w-full h-full"
              viewBox="0 0 280 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Boundary Plate */}
              <circle cx="140" cy="140" r="85" fill="#181818" stroke="#333333" strokeWidth="2" />

              {/* Gear Teeth & Cutouts */}
              <circle
                cx="140"
                cy="140"
                r="65"
                stroke="#3e3e3e"
                strokeWidth="12"
                strokeDasharray="14 10"
              />
              <circle cx="140" cy="140" r="40" fill="#202020" stroke="#484848" strokeWidth="2" />
              <circle cx="140" cy="140" r="16" fill="#141414" stroke="#3b82f6" strokeWidth="2" />

              {/* Slider Controls Surrounding */}
              <rect x="50" y="60" width="45" height="12" rx="6" fill="#252525" stroke="#383838" />
              <circle cx="80" cy="66" r="4" fill="#3b82f6" />

              <rect x="185" y="210" width="45" height="12" rx="6" fill="#252525" stroke="#383838" />
              <circle cx="200" cy="216" r="4" fill="#10b981" />
            </svg>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#383838] text-xs text-neutral-300 font-medium mb-4">
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              Engine Calibration
            </div>
            <h2 className="text-xl font-semibold text-neutral-100 mb-2">
              Engine Settings
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              Configure chunk sizes (512 tokens), overlap ratios, HNSW index parameters (M=16, ef_construction=64), and strict deterministic citation constraints.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">Chunk Size: 512t</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">Overlap: 10%</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333]">RRF k=60</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
