import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Mic,
  Globe,
  X,
  Sparkles,
  Copy,
  Check,
  Loader2,
  File,
  AlertCircle,
  ShieldCheck,
  Quote,
  BookOpen,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { LioraLogo } from '../../components/LioraLogo';
import { getStoredMessages, saveStoredMessages } from '../../lib/chatStorage';
import { apiFetch } from '../../lib/api';

export interface ChatCitation {
  sourceId: string;
  source: string;
  page?: number;
  snippet?: string;
  similarityScore?: number;
  section?: string;
  chunkId?: string;
  chunkIndex?: number;
}

export interface RawSourceItem {
  sourceId: string;
  filename: string;
  page?: number;
  snippet: string;
  similarityScore: number;
  section?: string;
  chunkId?: string;
  chunkIndex?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  isGenerating?: boolean;
  generatingStatus?: string;
  citations?: ChatCitation[];
  rawSources?: RawSourceItem[];
  error?: boolean;
}

interface ChatInterfaceProps {
  chatId?: string;
  chatTitle?: string;
  onUpdateChatTitle?: (newTitle: string) => void;
}

/**
 * Resolve citation details from either citations or rawSources list
 */
const getSourceDetails = (
  idOrNum: string | number,
  citations?: ChatCitation[],
  rawSources?: RawSourceItem[]
) => {
  const strId = String(idOrNum).trim();
  const num = parseInt(strId, 10);

  // 1. Match from citations
  if (citations && citations.length > 0) {
    const foundCit = citations.find(
      (c) =>
        c.sourceId === `Source ${strId}` ||
        c.sourceId === strId ||
        c.sourceId === `Source ${num}`
    );
    if (foundCit) {
      return {
        sourceId: foundCit.sourceId,
        filename: foundCit.source,
        page: foundCit.page,
        snippet: foundCit.snippet,
        similarityScore: foundCit.similarityScore,
        section: foundCit.section,
        chunkId: foundCit.chunkId,
        chunkIndex: foundCit.chunkIndex,
      };
    }
    // 1-based index fallback for citations
    if (!isNaN(num) && num > 0 && num <= citations.length) {
      const idxItem = citations[num - 1];
      return {
        sourceId: idxItem.sourceId,
        filename: idxItem.source,
        page: idxItem.page,
        snippet: idxItem.snippet,
        similarityScore: idxItem.similarityScore,
        section: idxItem.section,
        chunkId: idxItem.chunkId,
        chunkIndex: idxItem.chunkIndex,
      };
    }
  }

  // 2. Match from rawSources
  if (rawSources && rawSources.length > 0) {
    const foundRaw = rawSources.find(
      (r) =>
        r.sourceId === `Source ${strId}` ||
        r.sourceId === strId ||
        r.sourceId === `Source ${num}`
    );
    if (foundRaw) {
      return {
        sourceId: foundRaw.sourceId,
        filename: foundRaw.filename,
        page: foundRaw.page,
        snippet: foundRaw.snippet,
        similarityScore: foundRaw.similarityScore,
        section: foundRaw.section,
        chunkId: foundRaw.chunkId,
        chunkIndex: foundRaw.chunkIndex,
      };
    }
    // 1-based index fallback
    if (!isNaN(num) && num > 0 && num <= rawSources.length) {
      const idxItem = rawSources[num - 1];
      return {
        sourceId: idxItem.sourceId,
        filename: idxItem.filename,
        page: idxItem.page,
        snippet: idxItem.snippet,
        similarityScore: idxItem.similarityScore,
        section: idxItem.section,
        chunkId: idxItem.chunkId,
        chunkIndex: idxItem.chunkIndex,
      };
    }
  }

  return undefined;
};

export interface DetailedSourceItem {
  sourceNumber: number;
  sourceId: string;
  filename: string;
  page?: number;
  snippet?: string;
  similarityScore?: number;
  section?: string;
  chunkId?: string;
  chunkIndex?: number;
}

export const getNormalizedSources = (
  citations?: ChatCitation[],
  rawSources?: RawSourceItem[]
): DetailedSourceItem[] => {
  if (citations && citations.length > 0) {
    return citations.map((c, idx) => ({
      sourceNumber: idx + 1,
      sourceId: c.sourceId,
      filename: c.source,
      page: c.page,
      snippet: c.snippet,
      similarityScore: c.similarityScore,
      section: c.section,
      chunkId: c.chunkId,
      chunkIndex: c.chunkIndex,
    }));
  }
  if (rawSources && rawSources.length > 0) {
    return rawSources.map((r, idx) => ({
      sourceNumber: idx + 1,
      sourceId: r.sourceId,
      filename: r.filename,
      page: r.page,
      snippet: r.snippet,
      similarityScore: r.similarityScore,
      section: r.section,
      chunkId: r.chunkId,
      chunkIndex: r.chunkIndex,
    }));
  }
  return [];
};

/**
 * Interactive Citation Badge with Hover Tooltip and Click-to-open Drawer
 */
const CitationBadge: React.FC<{
  sourceNumber: string;
  sourceInfo?: {
    sourceId: string;
    filename: string;
    page?: number;
    snippet?: string;
    similarityScore?: number;
    section?: string;
    chunkId?: string;
    chunkIndex?: number;
  };
  onSelect?: () => void;
}> = ({ sourceNumber, sourceInfo, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 220);
  };

  const filename = sourceInfo?.filename || `Source ${sourceNumber}`;
  const page = sourceInfo?.page;
  const section = sourceInfo?.section;
  const snippet = sourceInfo?.snippet;
  const matchPct =
    sourceInfo?.similarityScore !== undefined
      ? Math.round(
          sourceInfo.similarityScore <= 1
            ? sourceInfo.similarityScore * 100
            : sourceInfo.similarityScore
        )
      : undefined;

  return (
    <span
      className="relative inline-block align-baseline mx-0.5 select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/35 text-blue-300 hover:text-blue-100 text-[11px] font-semibold font-mono transition-all cursor-pointer shadow-xs active:scale-95"
        title={`Click to view Source ${sourceNumber}: ${filename}${page ? ` (p. ${page})` : ''} in panel`}
      >
        <span>[{sourceNumber}]</span>
      </button>

      {/* Floating Tooltip Clean Card with Click Action */}
      {isHovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-[#1a1a1a]/98 backdrop-blur-xl border border-[#3a3a3a] shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 text-left pointer-events-auto animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#2d2d2d]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                Source {sourceNumber}
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-200 truncate">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[170px]" title={filename}>
                  {filename}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {page !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#262626] text-neutral-300 border border-[#383838]">
                  Page {page}
                </span>
              )}
              {matchPct !== undefined && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {matchPct}% match
                </span>
              )}
            </div>
          </div>

          {/* Section info if present */}
          {section && (
            <div className="text-[11px] text-neutral-400 font-medium mb-2 truncate">
              <span className="text-neutral-500">Section:</span> {section}
            </div>
          )}

          {/* Grounding excerpt label */}
          <div className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Quote className="w-3 h-3 text-blue-400" />
              Grounding Excerpt
            </span>
            <span className="text-[10px] text-blue-400 flex items-center gap-1 hover:underline">
              Inspect in panel <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>

          {/* Verbatim text snippet */}
          <div className="p-2.5 rounded-xl bg-[#111111] border border-[#282828] text-neutral-300 text-xs font-mono leading-relaxed max-h-32 overflow-y-auto selection:bg-blue-600/30 whitespace-pre-wrap">
            {snippet || 'Verbatim retrieved chunk stored in deterministic pgvector index.'}
          </div>

          {/* Footer note */}
          <div className="mt-2 text-[10px] text-neutral-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              pgvector deterministic proof
            </span>
            <span className="text-blue-400 font-medium flex items-center gap-0.5">
              Click to inspect →
            </span>
          </div>
        </div>
      )}
    </span>
  );
};

/**
 * Grounding Sources Drawer with Expandable Full-Drawer & Clean Focus
 */
const SourceDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sources: DetailedSourceItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}> = ({ isOpen, onClose, sources, activeIndex, onSelectIndex }) => {
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && activeIndex > 0) {
        onSelectIndex(activeIndex - 1);
      } else if (e.key === 'ArrowRight' && activeIndex < sources.length - 1) {
        onSelectIndex(activeIndex + 1);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeIndex, sources.length, onSelectIndex]);

  if (!isOpen || sources.length === 0) return null;

  const currentSource = sources[activeIndex] || sources[0];
  const matchPct =
    currentSource.similarityScore !== undefined
      ? Math.round(
          currentSource.similarityScore <= 1
            ? currentSource.similarityScore * 100
            : currentSource.similarityScore
        )
      : undefined;

  const handleCopy = () => {
    if (currentSource.snippet) {
      navigator.clipboard.writeText(currentSource.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[100] transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Sheet / Full Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 ${
          isFullScreen ? 'w-full' : 'w-full sm:w-[560px] md:w-[680px]'
        } bg-[#161616] border-l border-[#2e2e2e] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[101] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-all duration-200 animate-slide-left`}
      >
        {/* Header with Mac Camera lens notch aesthetic */}
        <div className="p-4 border-b border-[#262626] flex items-center justify-between shrink-0 bg-[#191919]">
          <div className="flex items-center gap-2.5">
            {/* Mac M4 Camera Lens Glowing Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-[#333333] shadow-inner">
              <div className="relative flex items-center justify-center w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-neutral-200 tracking-tight">
                Verified Sources
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#242424] text-[10px] font-mono text-neutral-400">
                {sources.length}
              </span>
            </div>
          </div>

          {/* Right Header Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Full Drawer / Side Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="w-8 h-8 rounded-lg hover:bg-[#262626] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isFullScreen ? 'Collapse to side drawer' : 'Expand to full screen drawer'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#262626] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Source Switcher Tab Pills */}
        {sources.length > 1 && (
          <div className="px-4 py-2.5 border-b border-[#242424] bg-[#141414] flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
            {sources.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  activeIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#202020] text-neutral-400 hover:text-neutral-200 hover:bg-[#282828] border border-[#2f2f2f]'
                }`}
              >
                <span className="font-mono text-[11px] opacity-80">[{idx + 1}]</span>
                <span className="max-w-[140px] sm:max-w-[180px] truncate">{s.filename}</span>
              </button>
            ))}
          </div>
        )}

        {/* Active Source Content (Scrollable, Clean, Focused on Understanding) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Document Overview Card */}
          <div className="p-4 rounded-2xl bg-[#1f1f1f] border border-[#2e2e2e] shadow-sm flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-100 truncate" title={currentSource.filename}>
                    {currentSource.filename}
                  </h4>
                  <div className="text-[11.5px] text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-neutral-300">Source [{currentSource.sourceNumber}]</span>
                    {currentSource.page !== undefined && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-neutral-300">Page {currentSource.page}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {matchPct !== undefined && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold shrink-0">
                  {matchPct}% match
                </span>
              )}
            </div>

            {currentSource.section && (
              <div className="text-xs text-neutral-300 bg-[#171717] px-3 py-1.5 rounded-lg border border-[#282828] flex items-center gap-1.5 mt-1">
                <span className="text-neutral-500 font-medium">Section:</span>
                <span className="font-medium text-neutral-200 truncate">{currentSource.section}</span>
              </div>
            )}
          </div>

          {/* Clean Verbatim Grounding Passage Box */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Quote className="w-3.5 h-3.5 text-blue-400" />
                Grounding Passage
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#222222] hover:bg-[#2b2b2b] border border-[#333333] transition-colors cursor-pointer"
                title="Copy passage text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#0f0f0f] border border-[#262626] text-neutral-200 text-sm leading-relaxed max-h-[58vh] overflow-y-auto whitespace-pre-wrap select-text selection:bg-blue-600/30 font-mono">
              {currentSource.snippet || 'Verbatim retrieved chunk from deterministic vector index.'}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#262626] bg-[#141414] flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={activeIndex <= 0}
            onClick={() => onSelectIndex(activeIndex - 1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeIndex > 0
                ? 'bg-[#222222] hover:bg-[#2a2a2a] text-neutral-200 border border-[#333333]'
                : 'text-neutral-600 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-neutral-400 font-mono">
            {activeIndex + 1} of {sources.length}
          </span>

          <button
            type="button"
            disabled={activeIndex >= sources.length - 1}
            onClick={() => onSelectIndex(activeIndex + 1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              activeIndex < sources.length - 1
                ? 'bg-[#222222] hover:bg-[#2a2a2a] text-neutral-200 border border-[#333333]'
                : 'text-neutral-600 cursor-not-allowed opacity-40'
            }`}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Strips all raw asterisks (* and **) and renders rich structured typography:
 * - Bold text without raw asterisks
 * - Structured section headers
 * - Custom bullet lists with colored bullet dots
 * - Inline interactive citation badges with hover tooltip and click-to-open drawer
 */
const renderInlineContent = (
  text: string,
  citations?: ChatCitation[],
  rawSources?: RawSourceItem[],
  onSelectCitation?: (sourceNumber: string) => void
): React.ReactNode => {
  // Regex pattern matching **bold** and [Source X] or [X]
  const pattern = /(\*\*(?:.*?)\*\*|\[(?:Source\s*)?(\d+)\])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = pattern.lastIndex;

    // Plain text before match - strip any stray asterisks
    if (matchStart > lastIndex) {
      const plainText = text.substring(lastIndex, matchStart).replace(/\*/g, '');
      if (plainText) {
        parts.push(plainText);
      }
    }

    const matchedStr = match[0];

    // Case 1: Bold text **bold**
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const boldText = matchedStr.slice(2, -2).replace(/\*/g, '');
      parts.push(
        <strong key={`b-${matchStart}`} className="font-semibold text-neutral-100">
          {boldText}
        </strong>
      );
    }
    // Case 2: Citation [Source X] or [X]
    else if (match[2]) {
      const sourceNum = match[2];
      const sourceInfo = getSourceDetails(sourceNum, citations, rawSources);
      parts.push(
        <CitationBadge
          key={`cit-${matchStart}-${sourceNum}`}
          sourceNumber={sourceNum}
          sourceInfo={sourceInfo}
          onSelect={() => onSelectCitation?.(sourceNum)}
        />
      );
    }

    lastIndex = matchEnd;
  }

  // Trailing text - strip any stray asterisks
  if (lastIndex < text.length) {
    const trailing = text.substring(lastIndex).replace(/\*/g, '');
    if (trailing) {
      parts.push(trailing);
    }
  }

  return <>{parts}</>;
};

/**
 * Structured Answer Formatter (Completely free of raw asterisks)
 */
const StructuredAnswer: React.FC<{
  content: string;
  citations?: ChatCitation[];
  rawSources?: RawSourceItem[];
  onSelectCitation?: (sourceNumber: string) => void;
}> = ({ content, citations, rawSources, onSelectCitation }) => {
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-3.5 text-[14.5px] leading-relaxed text-neutral-200">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split(/\n/);
        const hasBullets = lines.some((l) => /^\s*(\*|-|•|\d+\.)\s+/.test(l));

        if (hasBullets) {
          return (
            <div key={pIdx} className="space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const bulletMatch = line.match(/^\s*(\*|-|•|\d+\.)\s+(.*)$/);
                if (bulletMatch) {
                  const bulletType = bulletMatch[1];
                  const itemContent = bulletMatch[2];
                  const isNumbered = /^\d+\./.test(bulletType);

                  return (
                    <div key={lIdx} className="flex items-start gap-2.5 my-1">
                      {isNumbered ? (
                        <span className="font-mono text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded mt-0.5 shrink-0">
                          {bulletType}
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0 shadow-xs" />
                      )}
                      <div className="flex-1 text-neutral-200 leading-relaxed">
                        {renderInlineContent(itemContent, citations, rawSources, onSelectCitation)}
                      </div>
                    </div>
                  );
                }

                // Header line inside block
                if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
                  const headerText = line.replace(/^#+\s*/, '').replace(/\*/g, '');
                  return (
                    <h3 key={lIdx} className="text-[15px] font-semibold text-neutral-100 tracking-tight mt-3 mb-1">
                      {headerText}
                    </h3>
                  );
                }

                return (
                  <p key={lIdx} className="leading-relaxed">
                    {renderInlineContent(line, citations, rawSources, onSelectCitation)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Single paragraph header check
        const trimmed = p.trim();
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*/g, '');
          return (
            <h3 key={pIdx} className="text-[15px] font-semibold text-neutral-100 tracking-tight mt-3 mb-1">
              {headerText}
            </h3>
          );
        }

        // Standalone bold header
        const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*[:\s]*(.*)$/);
        if (boldHeaderMatch && !boldHeaderMatch[2]) {
          return (
            <h4 key={pIdx} className="text-sm font-semibold text-neutral-100 tracking-tight mt-2 mb-0.5">
              {boldHeaderMatch[1]}
            </h4>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {renderInlineContent(trimmed, citations, rawSources, onSelectCitation)}
          </p>
        );
      })}
    </div>
  );
};


export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatId,
  chatTitle = 'New chat',
  onUpdateChatTitle,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return chatId ? getStoredMessages(chatId) : [];
  });
  const [query, setQuery] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    activeIndex: number;
    sources: DetailedSourceItem[];
  }>({
    isOpen: false,
    activeIndex: 0,
    sources: [],
  });

  const openDrawerForMessage = (msg: ChatMessage, initialIndex: number = 0) => {
    const sources = getNormalizedSources(msg.citations, msg.rawSources);
    if (sources.length > 0) {
      setDrawerState({
        isOpen: true,
        activeIndex: Math.max(0, Math.min(initialIndex, sources.length - 1)),
        sources,
      });
    }
  };

  const openDrawerBySourceNum = (msg: ChatMessage, sourceNumStr: string) => {
    const sources = getNormalizedSources(msg.citations, msg.rawSources);
    const num = parseInt(sourceNumStr, 10);
    let targetIdx = 0;
    if (!isNaN(num) && num > 0) {
      targetIdx = num - 1;
    } else {
      const foundIdx = sources.findIndex((s) => s.sourceId.includes(sourceNumStr));
      if (foundIdx !== -1) targetIdx = foundIdx;
    }
    setDrawerState({
      isOpen: true,
      activeIndex: Math.max(0, Math.min(targetIdx, sources.length - 1)),
      sources,
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Sync messages when chatId changes
  useEffect(() => {
    if (chatId) {
      setMessages(getStoredMessages(chatId));
    } else {
      setMessages([]);
    }
  }, [chatId]);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close attachment dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target as Node)
      ) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachMenuOpen]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  };

  // Trigger native file picker
  const handleOpenDocPicker = () => {
    setIsAttachMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection from disk with strict format classification
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      const validFiles: File[] = [];
      const rejectedExecutables: string[] = [];
      const rejectedImages: string[] = [];
      const rejectedArchives: string[] = [];
      const rejectedOther: string[] = [];

      selected.forEach((file) => {
        const name = file.name.toLowerCase();

        // 1. Binary executables
        if (/\.(exe|bin|dll|so|dylib|dmg|iso|msi|bat|cmd|sh|apk|sys|com)$/i.test(name)) {
          rejectedExecutables.push(file.name);
        }
        // 2. Images without text
        else if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg|tiff?|ico|heic|raw)$/i.test(name)) {
          rejectedImages.push(file.name);
        }
        // 3. Encrypted/proprietary archives
        else if (/\.(zip|rar|7z|tar|gz|pkg|deb|rpm)$/i.test(name)) {
          rejectedArchives.push(file.name);
        }
        // 4. Allowed formats: Plain text (.txt, .md), Documents (.pdf, .docx), Spreadsheets (.csv, .xlsx), Web (.html, .xml), Exports (.json, .yaml)
        else if (/\.(txt|md|markdown|pdf|docx|doc|csv|xlsx|xls|tsv|html|htm|xml|json|yaml|yml|pptx|ppt|rtf|log)$/i.test(name)) {
          validFiles.push(file);
        } else {
          rejectedOther.push(file.name);
        }
      });

      if (rejectedExecutables.length > 0) {
        alert(`Binary executables (${rejectedExecutables.join(', ')}) are not supported.\nThey do not contain semantic text for retrieval.`);
      }
      if (rejectedImages.length > 0) {
        alert(`Images (${rejectedImages.join(', ')}) are avoided for text retrieval.\nOCR pipeline will be added in a future update.`);
      }
      if (rejectedArchives.length > 0) {
        alert(`Archive/compressed formats (${rejectedArchives.join(', ')}) are not directly parseable.\nPlease extract documents first.`);
      }

      if (validFiles.length > 0) {
        setAttachedFiles((prev) => [...prev, ...validFiles]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Copy assistant response
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  // Send query or process attachments
  const handleSend = async () => {
    const trimmed = query.trim();
    if ((!trimmed && attachedFiles.length === 0) || isSubmitting) return;

    setIsSubmitting(true);

    // Auto-update chat title on first message
    if (messages.length === 0 && onUpdateChatTitle && trimmed) {
      const previewTitle = trimmed.length > 28 ? `${trimmed.slice(0, 28)}...` : trimmed;
      onUpdateChatTitle(previewTitle);
    }

    const userMessageId = `usr-${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).substring(2, 7)}`;
    const assistantMessageId = `ast-${typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : (Date.now() + 1) + '-' + Math.random().toString(36).substring(2, 7)}`;
    const filesToUpload = [...attachedFiles];

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: filesToUpload.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    };

    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGenerating: true,
      generatingStatus: filesToUpload.length > 0
        ? `Uploading & indexing ${filesToUpload[0].name} into pgvector...`
        : 'Searching verified knowledge chunks in pgvector...',
    };

    setMessages((prev) => {
      const updated = [...prev, newUserMessage, initialAssistantMessage];
      if (chatId) {
        saveStoredMessages(chatId, updated);
      }
      return updated;
    });

    setQuery('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // 1. Upload files to FastAPI /api/v1/documents if any are attached
      if (filesToUpload.length > 0) {
        for (const file of filesToUpload) {
          const formData = new FormData();
          formData.append('file', file);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, generatingStatus: `Indexing ${file.name} into pgvector...` }
                : m
            )
          );

          await apiFetch('/documents?process_sync=true', {
            method: 'POST',
            body: formData,
            requireAuth: true,
          });
        }
      }

      // 2. Query FastAPI /api/v1/chat endpoint
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, generatingStatus: 'Synthesizing verified response with Gemini...' }
            : m
        )
      );

      const effectiveQuery = trimmed || `Please summarize the key contents of ${filesToUpload[0]?.name || 'the uploaded document'}.`;

      const response = await apiFetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: effectiveQuery,
          top_k: 5,
        }),
        requireAuth: true,
      });

      const data = await response.json();

      // Format citations from backend GenerationResult
      const citations: ChatCitation[] = (data.citations || []).map((cite: any) => ({
        sourceId: cite.source_id || 'Source',
        source: cite.filename || 'Document',
        page: cite.page_number || undefined,
        snippet: cite.snippet || undefined,
        similarityScore: cite.similarity_score || undefined,
        section: cite.section || undefined,
        chunkId: cite.chunk_id || undefined,
        chunkIndex: cite.chunk_index !== undefined ? cite.chunk_index : undefined,
      }));

      // Format raw sources from backend GenerationResult
      const rawSources: RawSourceItem[] = (data.raw_sources || []).map((src: any) => ({
        sourceId: src.source_id || 'Source',
        filename: src.filename || 'Document',
        page: src.page_number || undefined,
        snippet: src.content || '',
        similarityScore: src.similarity || 0,
        section: src.section || undefined,
        chunkId: src.chunk_id || undefined,
        chunkIndex: src.chunk_index !== undefined ? src.chunk_index : undefined,
      }));

      const finalAnswer = data.answer || 'No response returned from engine.';

      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: finalAnswer,
                isGenerating: false,
                generatingStatus: undefined,
                citations: citations,
                rawSources: rawSources,
              }
            : m
        );
        if (chatId) {
          saveStoredMessages(chatId, updated);
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Chat query failed:', err);
      const errorMessage =
        err.message?.includes('Authentication required')
          ? 'Please log in to query your knowledge engine.'
          : err.message || 'Unable to retrieve answer from knowledge engine. Please check backend connection.';

      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: errorMessage,
                isGenerating: false,
                generatingStatus: undefined,
                error: true,
              }
            : m
        );
        if (chatId) {
          saveStoredMessages(chatId, updated);
        }
        return updated;
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Reusable prompt input box (middle for empty chat, fixed bottom for active conversation)
  const renderInputBox = () => (
    <div className="w-full relative flex flex-col items-center">
      {/* ATTACHMENT POPUP CARD */}
      {isAttachMenuOpen && (
        <div
          ref={attachMenuRef}
          className="absolute left-0 bottom-full mb-3 w-72 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl p-2 z-50 flex flex-col gap-1 animate-fade-in text-left"
        >
          {/* Option 1: Files and documents */}
          <button
            type="button"
            onClick={handleOpenDocPicker}
            className="w-full p-2.5 rounded-xl hover:bg-[#2a2a2a] flex items-start gap-3 text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-500/25">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                Files and documents
              </div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                .txt, .md, .pdf, .docx, .csv, .xlsx, .html, .xml, .json, .yaml
              </div>
            </div>
          </button>

          <div className="h-px bg-[#2a2a2a] my-1" />

          {/* Option 2: Images (REJECTED) */}
          <div className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left opacity-40 cursor-not-allowed select-none">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  Images (Not supported)
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                Images without text are avoided for semantic retrieval.
              </div>
            </div>
          </div>

          {/* Option 3: Executables (REJECTED) */}
          <div className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left opacity-40 cursor-not-allowed select-none">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  Binaries & Archives
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 leading-tight mt-0.5">
                .exe, .bin, .zip avoided. Not useful for semantic search.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Prompt Bar Container */}
      <div className="w-full rounded-3xl bg-[#2f2f2f] border border-[#3e3e3e] shadow-[0_8px_30px_rgb(0,0,0,0.18)] hover:border-[#4d4d4d] focus-within:border-[#555555] transition-all p-2 flex flex-col gap-2">
        {/* Attached Files Chips Bar */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242424] border border-[#3a3a3a] text-xs text-neutral-200 group"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="max-w-[180px] truncate">{file.name}</span>
                <span className="text-[10px] text-neutral-400">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="p-0.5 rounded-full hover:bg-[#383838] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex items-end gap-2 px-2">
          {/* Left Plus Attachment Button */}
          <button
            type="button"
            onClick={() => setIsAttachMenuOpen((prev) => !prev)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isAttachMenuOpen
                ? 'bg-[#404040] text-white rotate-45'
                : 'text-neutral-400 hover:text-white hover:bg-[#383838]'
            }`}
            title="Attach knowledge document"
          >
            <Plus className="w-5 h-5 transition-transform" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Liora or summarize uploaded knowledge..."
            rows={1}
            className="flex-1 bg-transparent border-0 text-sm text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none max-h-44 py-1.5 px-1 leading-relaxed selection:bg-blue-600"
          />

          {/* Right Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={(!query.trim() && attachedFiles.length === 0) || isSubmitting}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
              (query.trim() || attachedFiles.length > 0) && !isSubmitting
                ? 'bg-white text-black hover:bg-neutral-200 cursor-pointer shadow-md'
                : 'bg-[#353535] text-neutral-500 cursor-not-allowed'
            }`}
            title="Send query"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Footer Engine Note */}
      <div className="mt-2 text-center text-[11px] text-neutral-400 select-none">
        Liora verifies every answer against deterministic vector chunks and citation proofs.
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#212121] text-neutral-100 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Hidden native file input accepting allowed document formats */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".txt,.md,.pdf,.docx,.doc,.csv,.xlsx,.xls,.tsv,.html,.htm,.xml,.json,.yaml,.yml,.pptx,.ppt"
        className="hidden"
      />

      {/* Floating Top-Left Chat Title Overlay */}
      <div className="absolute top-3.5 left-5 z-30 pointer-events-auto flex items-center gap-2.5 select-none">
        <span className="text-sm font-medium text-neutral-200 truncate max-w-[200px] sm:max-w-xs md:max-w-md drop-shadow-sm">
          {chatTitle}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-[#2a2a2a]/80 backdrop-blur-md text-[10px] font-medium text-neutral-400 border border-[#383838]/80 shadow-sm">
          Gemini 3.8 Flash
        </span>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-400 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Deterministic RAG Active" />
        </div>
      </div>

      {/* CASE 1: EMPTY / NEW CHAT (ChatGPT-style Center Placement) */}
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8 animate-fade-in">
          <div className="w-full max-w-[820px] flex flex-col items-center my-auto">
            {/* Center Brand & Heading */}
            <div className="flex flex-col items-center mb-7 select-none text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#262626] border border-[#383838] flex items-center justify-center mb-4 shadow-sm">
                <LioraLogo size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
                Where knowledge meets deterministic proof.
              </h1>
            </div>

            {/* Centered Input Box */}
            <div className="w-full">
              {renderInputBox()}
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: ACTIVE CONVERSATION (Scrollable Messages with Fixed Bottom Input Bar) */
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto px-4 pt-14 pb-6 scroll-smooth">
            <div className="max-w-[820px] mx-auto flex flex-col gap-6 pb-6">
              {messages.map((msg) => {
                const messageSources = getNormalizedSources(msg.citations, msg.rawSources);

                return (
                  <div key={msg.id} className="flex flex-col gap-3 animate-fade-in">
                    {/* USER MESSAGE: Deep Dark Bubble with Copy Option */}
                    {msg.role === 'user' ? (
                      <div className="flex justify-end items-start gap-3">
                        <div className="max-w-[680px] flex flex-col items-end gap-1.5">
                          {/* Attached files pill above user message */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 justify-end mb-0.5">
                              {msg.attachments.map((file, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#222222] border border-[#333333] text-neutral-200 text-xs font-medium shadow-sm"
                                >
                                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                                  <span className="max-w-[200px] truncate">{file.name}</span>
                                  <span className="text-[10px] text-neutral-400">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Deep Charcoal / Dark Black User Bubble */}
                          {msg.content && (
                            <div className="px-4.5 py-3 rounded-3xl rounded-tr-md bg-[#181818] hover:bg-[#1d1d1d] border border-[#2b2b2b] text-neutral-100 text-[14.5px] leading-relaxed whitespace-pre-wrap shadow-sm selection:bg-neutral-700 transition-colors">
                              {msg.content}
                            </div>
                          )}

                          {/* User Message Footer: Copy Prompt button + Timestamp */}
                          <div className="flex items-center gap-1.5 mr-1 text-neutral-500">
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="p-1 rounded-md hover:bg-[#282828] hover:text-neutral-300 transition-colors cursor-pointer"
                              title="Copy prompt"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <span className="text-[10px] font-mono">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ASSISTANT MESSAGE: Clean Left-Aligned Flow with Mac M4 Notch Citation Pill */
                      <div className="flex justify-start items-start w-full">
                        <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                          {/* Minimal Transitioning Generating Status with Spinning Generating Symbol */}
                          {msg.isGenerating && (
                            <div className="flex items-center gap-2.5 py-2 animate-fade-in">
                              <div className="relative flex items-center justify-center w-4 h-4">
                                <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                              </div>
                              <span className="text-sm text-neutral-300 font-medium">
                                {msg.generatingStatus || 'Searching verified knowledge...'}
                              </span>
                            </div>
                          )}

                          {/* Header Row: Verified Answer Badge on Left + Mac M4 Camera Notch Pill on Right */}
                          {!msg.isGenerating && !msg.error && msg.content && (
                            <div className="flex items-center justify-between gap-2 pb-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-neutral-300 tracking-tight">
                                  Liora Verified Answer
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#292929] text-neutral-400 font-mono border border-[#353535]">
                                  Deterministic RAG
                                </span>
                              </div>

                              {/* Mac M4 Front Camera / Dynamic Island Notch Pill for Citations */}
                              {messageSources.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openDrawerForMessage(msg, 0)}
                                  className="group flex items-center gap-2 px-3 py-1 rounded-full bg-black/90 hover:bg-neutral-900 border border-[#333333] hover:border-neutral-500 shadow-md transition-all cursor-pointer active:scale-95 select-none"
                                  title="Click to view all sources in full drawer"
                                >
                                  {/* Mac Camera lens glowing dot */}
                                  <div className="relative flex items-center justify-center w-2 h-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                  </div>
                                  <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white">
                                    Sources
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded-full bg-[#222222] text-[10px] font-mono text-neutral-400 group-hover:text-blue-300 border border-[#333333]">
                                    {messageSources.length}
                                  </span>
                                  <ExternalLink className="w-2.5 h-2.5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Error State if API call failed */}
                          {msg.error && (
                            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-xl w-fit">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{msg.content}</span>
                            </div>
                          )}

                          {/* Structured Answer (100% Asterisk Free) with Interactive Citation Badges */}
                          {!msg.error && msg.content && (
                            <div className="flex flex-col gap-2">
                              <StructuredAnswer
                                content={msg.content}
                                citations={msg.citations}
                                rawSources={msg.rawSources}
                                onSelectCitation={(num) => openDrawerBySourceNum(msg, num)}
                              />
                            </div>
                          )}

                          {/* Bottom Action Row: Small subtle Liora logo + Sources button + Copy + Timestamp */}
                          {!msg.isGenerating && msg.content && (
                            <div className="flex items-center gap-2.5 mt-1 text-neutral-500">
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#242424] border border-[#333333] text-[11px] text-neutral-400">
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                <span className="font-medium text-neutral-300">Liora</span>
                              </div>

                              {messageSources.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openDrawerForMessage(msg, 0)}
                                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-[#282828] text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer border border-transparent hover:border-[#333]"
                                  title="View grounding sources"
                                >
                                  <BookOpen className="w-3 h-3 text-blue-400" />
                                  <span>{messageSources.length} sources</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="p-1 rounded-md hover:bg-[#2a2a2a] hover:text-neutral-300 transition-colors cursor-pointer"
                                title="Copy response"
                              >
                                {copiedId === msg.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span className="text-[11px] font-mono">
                                {msg.timestamp}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* FIXED BOTTOM PROMPT INPUT BAR (Never scrolls with the page) */}
          <div className="w-full px-4 pb-4 pt-2 shrink-0 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent z-20">
            <div className="max-w-[820px] mx-auto">
              {renderInputBox()}
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Grounding Sources Drawer Panel */}
      <SourceDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState((prev) => ({ ...prev, isOpen: false }))}
        sources={drawerState.sources}
        activeIndex={drawerState.activeIndex}
        onSelectIndex={(index) =>
          setDrawerState((prev) => ({ ...prev, activeIndex: index }))
        }
      />
    </div>
  );
};
