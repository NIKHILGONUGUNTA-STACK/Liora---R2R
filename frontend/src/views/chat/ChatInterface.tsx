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
  Layers,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Quote,
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
  viewMode?: 'summary' | 'sources';
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

/**
 * Interactive Citation Badge with Hover Tooltip Clean Card
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
  onOpenSources?: () => void;
}> = ({ sourceNumber, sourceInfo, onOpenSources }) => {
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
        onClick={onOpenSources}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/35 text-blue-300 hover:text-blue-100 text-[11px] font-semibold font-mono transition-all cursor-pointer shadow-xs active:scale-95"
        title="View citation evidence"
      >
        <span>[{sourceNumber}]</span>
      </button>

      {/* Floating Tooltip Clean Card */}
      {isHovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-[#1a1a1a]/98 backdrop-blur-xl border border-[#3a3a3a] shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 text-left pointer-events-auto animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
              Original Grounding Passage
            </span>
            {onOpenSources && (
              <span
                onClick={onOpenSources}
                className="text-blue-400 hover:text-blue-300 cursor-pointer normal-case text-[11px] hover:underline"
              >
                Inspect sources →
              </span>
            )}
          </div>

          {/* Verbatim text snippet */}
          <div className="p-2.5 rounded-xl bg-[#111111] border border-[#282828] text-neutral-200 text-xs font-mono leading-relaxed max-h-40 overflow-y-auto selection:bg-blue-600/30 whitespace-pre-wrap">
            {snippet || 'Verbatim retrieved chunk stored in deterministic pgvector index.'}
          </div>

          {/* Footer note */}
          <div className="mt-2 text-[10px] text-neutral-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              pgvector deterministic proof
            </span>
            {sourceInfo?.chunkId && (
              <span className="font-mono text-neutral-400">
                Chunk #{sourceInfo.chunkIndex !== undefined ? sourceInfo.chunkIndex : sourceInfo.chunkId.slice(0, 6)}
              </span>
            )}
          </div>
        </div>
      )}
    </span>
  );
};

/**
 * Interactive Citation Pill for the Bottom Sources Bar
 */
const CitationPill: React.FC<{
  citation: ChatCitation;
  sourceNumber: number;
  onOpenSources?: () => void;
}> = ({ citation, sourceNumber, onOpenSources }) => {
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

  const matchPct =
    citation.similarityScore !== undefined
      ? Math.round(
          citation.similarityScore <= 1
            ? citation.similarityScore * 100
            : citation.similarityScore
        )
      : undefined;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={onOpenSources}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#242424] hover:bg-[#2c2c2c] border border-[#353535] hover:border-neutral-500 text-xs text-neutral-300 transition-colors cursor-pointer group shadow-xs"
      >
        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
          [{sourceNumber}]
        </span>
        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="max-w-[160px] truncate group-hover:text-white">
          {citation.source}
        </span>
        {citation.page !== undefined && (
          <span className="text-[10px] text-neutral-400 font-mono">
            p. {citation.page}
          </span>
        )}
      </button>

      {/* Floating Tooltip Clean Card */}
      {isHovered && (
        <div
          className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 p-3.5 rounded-2xl bg-[#1a1a1a]/98 backdrop-blur-xl border border-[#3a3a3a] shadow-[0_16px_40px_rgba(0,0,0,0.7)] z-50 text-left pointer-events-auto animate-fade-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#2d2d2d]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                Source {sourceNumber}
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-200 truncate">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate max-w-[150px]" title={citation.source}>
                  {citation.source}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {citation.page !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#262626] text-neutral-300 border border-[#383838]">
                  Page {citation.page}
                </span>
              )}
              {matchPct !== undefined && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {matchPct}% match
                </span>
              )}
            </div>
          </div>

          {citation.section && (
            <div className="text-[11px] text-neutral-400 font-medium mb-2 truncate">
              <span className="text-neutral-500">Section:</span> {citation.section}
            </div>
          )}

          {/* Grounding excerpt label */}
          <div className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Quote className="w-3 h-3 text-blue-400" />
              Original Grounding Passage
            </span>
            {onOpenSources && (
              <span
                onClick={onOpenSources}
                className="text-blue-400 hover:text-blue-300 cursor-pointer normal-case text-[11px] hover:underline"
              >
                Inspect sources →
              </span>
            )}
          </div>

          {/* Verbatim text snippet */}
          <div className="p-2.5 rounded-xl bg-[#111111] border border-[#282828] text-neutral-200 text-xs font-mono leading-relaxed max-h-40 overflow-y-auto selection:bg-blue-600/30 whitespace-pre-wrap">
            {citation.snippet || 'Verbatim retrieved chunk stored in deterministic pgvector index.'}
          </div>

          {/* Footer note */}
          <div className="mt-2 text-[10px] text-neutral-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              pgvector deterministic proof
            </span>
            {citation.chunkId && (
              <span className="font-mono text-neutral-400">
                Chunk #{citation.chunkIndex !== undefined ? citation.chunkIndex : citation.chunkId.slice(0, 6)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Strips all raw asterisks (* and **) and renders rich structured typography:
 * - Bold text without raw asterisks
 * - Structured section headers
 * - Custom bullet lists with colored bullet dots
 * - Inline interactive citation badges with hover tooltip clean cards
 */
const renderInlineContent = (
  text: string,
  citations?: ChatCitation[],
  rawSources?: RawSourceItem[],
  onOpenSources?: () => void
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
          onOpenSources={onOpenSources}
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
  onOpenSources?: () => void;
}> = ({ content, citations, rawSources, onOpenSources }) => {
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
                        {renderInlineContent(itemContent, citations, rawSources, onOpenSources)}
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
                    {renderInlineContent(line, citations, rawSources, onOpenSources)}
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
            {renderInlineContent(trimmed, citations, rawSources, onOpenSources)}
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
  const [copiedPassageId, setCopiedPassageId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Copy source passage
  const handleCopyPassage = (passageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassageId(passageId);
    setTimeout(() => setCopiedPassageId(null), 2000);
  };

  // Toggle view mode between 'summary' and 'sources'
  const handleToggleViewMode = (messageId: string, mode: 'summary' | 'sources') => {
    setMessages((prev) => {
      const updated = prev.map((m) =>
        m.id === messageId ? { ...m, viewMode: mode } : m
      );
      if (chatId) {
        saveStoredMessages(chatId, updated);
      }
      return updated;
    });
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
      viewMode: 'summary',
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
                viewMode: 'summary' as const,
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
          <div className="w-full max-w-3xl flex flex-col items-center my-auto">
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
            <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-6">
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-3 animate-fade-in">
                  {/* USER MESSAGE: Blue Bubble */}
                  {msg.role === 'user' ? (
                    <div className="flex justify-end items-start gap-3">
                      <div className="max-w-xl flex flex-col items-end gap-1.5">
                        {/* Attached files pill above user message */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 justify-end mb-0.5">
                            {msg.attachments.map((file, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#1e293b] border border-blue-500/30 text-blue-200 text-xs font-medium shadow-sm"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-400" />
                                <span className="max-w-[200px] truncate">{file.name}</span>
                                <span className="text-[10px] text-blue-300/80">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Blue User Bubble */}
                        {msg.content && (
                          <div className="px-4 py-2.5 rounded-3xl rounded-tr-sm bg-blue-600 text-white text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm selection:bg-blue-800">
                            {msg.content}
                          </div>
                        )}
                        <span className="text-[10px] text-neutral-500 mr-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* ASSISTANT MESSAGE: Pure Clean Flow with Dual-Mode Switcher */
                    <div className="flex justify-start items-start gap-3.5 w-full">
                      <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <LioraLogo size={18} />
                      </div>

                      <div className="flex-1 flex flex-col gap-2.5 min-w-0 pt-0.5">
                        {/* Top Dual Mode Switcher Bar */}
                        {!msg.isGenerating && !msg.error && msg.content && (
                          <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#282828]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-neutral-300 tracking-tight">
                                Liora Verified Answer
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#292929] text-neutral-400 font-mono">
                                R2R Deterministic
                              </span>
                            </div>

                            {/* Dual Mode Switcher Pill */}
                            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#191919] border border-[#303030] shadow-xs">
                              {/* Summary Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleViewMode(msg.id, 'summary')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                  (msg.viewMode || 'summary') === 'summary'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#252525]'
                                }`}
                                title="Show synthesized structured summary"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Summary</span>
                              </button>

                              {/* Original Sources Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleViewMode(msg.id, 'sources')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                  msg.viewMode === 'sources'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#252525]'
                                }`}
                                title="Show original verbatim retrieved evidence"
                              >
                                <Layers className="w-3 h-3" />
                                <span>Original Sources</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                    msg.viewMode === 'sources'
                                      ? 'bg-blue-700 text-white'
                                      : 'bg-[#2b2b2b] text-neutral-400'
                                  }`}
                                >
                                  {msg.rawSources?.length || msg.citations?.length || 0}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Minimal Transitioning Generating Status */}
                        {msg.isGenerating && (
                          <div className="flex items-center gap-2.5 text-xs text-neutral-400 py-1 animate-fade-in">
                            <div className="relative flex items-center justify-center w-3 h-3">
                              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                            </div>
                            <span className="text-neutral-300 font-medium">
                              {msg.generatingStatus || 'Searching verified knowledge...'}
                            </span>
                          </div>
                        )}

                        {/* Error State if API call failed */}
                        {msg.error && (
                          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-xl w-fit">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{msg.content}</span>
                          </div>
                        )}

                        {/* VIEW MODE 1: SUMMARY (Rewritten Structured Answer, 100% Asterisk Free) */}
                        {!msg.error && msg.content && (msg.viewMode || 'summary') === 'summary' && (
                          <div className="flex flex-col gap-3">
                            <StructuredAnswer
                              content={msg.content}
                              citations={msg.citations}
                              rawSources={msg.rawSources}
                              onOpenSources={() => handleToggleViewMode(msg.id, 'sources')}
                            />

                            {/* Verified Citation Proof Pills with Hover Cards */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="pt-2.5 mt-1 border-t border-[#292929] flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Verified Grounding Sources ({msg.citations.length})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleViewMode(msg.id, 'sources')}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>Inspect verbatim passages</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  {msg.citations.map((cite, i) => (
                                    <CitationPill
                                      key={i}
                                      citation={cite}
                                      sourceNumber={i + 1}
                                      onOpenSources={() => handleToggleViewMode(msg.id, 'sources')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* VIEW MODE 2: ORIGINAL SOURCES (Raw Verbatim Retrieval from pgvector) */}
                        {!msg.error && msg.content && msg.viewMode === 'sources' && (
                          <div className="flex flex-col gap-3.5 animate-fade-in">
                            {/* Evidence Info Card */}
                            <div className="p-3 rounded-2xl bg-[#171e2e]/60 border border-blue-500/20 flex items-start gap-3">
                              <BookOpen className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                              <div className="text-xs text-neutral-300 leading-relaxed">
                                <span className="font-semibold text-white">Dual-Mode Hybrid Evidence: </span>
                                Below are the verbatim, unmodified source text chunks retrieved by pgvector that grounded the AI answer.
                              </div>
                            </div>

                            {/* Render Each Retrieved Source Chunk */}
                            {((msg.rawSources && msg.rawSources.length > 0)
                              ? msg.rawSources
                              : (msg.citations || []).map((c, i) => ({
                                  sourceId: c.sourceId || `Source ${i + 1}`,
                                  filename: c.source,
                                  page: c.page,
                                  snippet: c.snippet || 'Verbatim text excerpt grounded in pgvector index.',
                                  similarityScore: c.similarityScore || 0,
                                  section: c.section,
                                  chunkId: c.chunkId,
                                  chunkIndex: c.chunkIndex,
                                }))
                            ).map((src, sIdx) => {
                              const matchPct = Math.round(
                                src.similarityScore <= 1
                                  ? src.similarityScore * 100
                                  : src.similarityScore
                              );
                              const passageKey = `${msg.id}-${sIdx}`;

                              return (
                                <div
                                  key={sIdx}
                                  className="rounded-2xl bg-[#1a1a1a] border border-[#303030] overflow-hidden p-4 flex flex-col gap-3 shadow-md hover:border-neutral-500 transition-colors"
                                >
                                  {/* Source Header */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs uppercase tracking-wider">
                                        {src.sourceId || `Source ${sIdx + 1}`}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-neutral-200 text-xs font-semibold">
                                        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                        <span className="max-w-[200px] sm:max-w-xs truncate" title={src.filename}>
                                          {src.filename}
                                        </span>
                                      </div>
                                      {src.page !== undefined && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252525] text-neutral-300 border border-[#383838]">
                                          Page {src.page}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {src.section && (
                                        <span className="text-[11px] text-neutral-400 font-medium truncate max-w-[150px]">
                                          Sec: {src.section}
                                        </span>
                                      )}
                                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                        {matchPct}% match
                                      </span>
                                    </div>
                                  </div>

                                  {/* Verbatim Source Chunk Text */}
                                  <div className="relative group">
                                    <div className="p-3.5 rounded-xl bg-[#111111] border border-[#262626] text-neutral-200 text-xs font-mono leading-relaxed select-text whitespace-pre-wrap selection:bg-blue-600/30">
                                      {src.snippet}
                                    </div>

                                    {/* Quick Copy Passage Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPassage(passageKey, src.snippet)}
                                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#222222]/90 hover:bg-[#333333] text-neutral-400 hover:text-white border border-[#3a3a3a] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                                      title="Copy verbatim passage"
                                    >
                                      {copiedPassageId === passageKey ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Source Footer Details */}
                                  <div className="flex items-center justify-between text-[11px] text-neutral-500 border-t border-[#262626] pt-2">
                                    <span className="font-mono text-neutral-400">
                                      Chunk Index: {src.chunkIndex !== undefined ? src.chunkIndex : sIdx}
                                    </span>
                                    {src.chunkId && (
                                      <span className="font-mono text-[10px] text-neutral-500 truncate max-w-[200px]" title={src.chunkId}>
                                        UUID: {src.chunkId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Back to Summary Link */}
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleViewMode(msg.id, 'summary')}
                                className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#303030] text-xs text-neutral-300 hover:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                <span>Switch back to Synthesized Summary</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Bottom Action Buttons (Copy, timestamp) */}
                        {!msg.isGenerating && msg.content && (
                          <div className="flex items-center gap-2 mt-1 text-neutral-500">
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
                            <span className="text-[10px]">
                              {msg.timestamp}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* FIXED BOTTOM PROMPT INPUT BAR (Never scrolls with the page) */}
          <div className="w-full px-4 pb-4 pt-2 shrink-0 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent z-20">
            <div className="max-w-3xl mx-auto">
              {renderInputBox()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
