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
} from 'lucide-react';
import { LioraLogo } from '../../components/LioraLogo';
import { getStoredMessages, saveStoredMessages } from '../../lib/chatStorage';
import { apiFetch } from '../../lib/api';

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
  citations?: {
    source: string;
    page?: number;
    snippet?: string;
    similarityScore?: number;
  }[];
  error?: boolean;
}

interface ChatInterfaceProps {
  chatId?: string;
  chatTitle?: string;
  onUpdateChatTitle?: (newTitle: string) => void;
}



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

  // Handle file selection from disk (.txt, .pdf, .docx, .ppt)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...selected]);
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

  // Send query & connect live to backend RAG pipeline
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
      const citations = (data.citations || []).map((cite: any) => ({
        source: cite.filename || 'Document',
        page: cite.page_number || undefined,
        snippet: cite.snippet || undefined,
        similarityScore: cite.similarity_score || undefined,
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
      {/* ATTACHMENT POPUP CARD (ChatGPT-style) */}
      {isAttachMenuOpen && (
        <div
          ref={attachMenuRef}
          className="absolute left-0 bottom-full mb-3 w-72 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl p-2 z-50 flex flex-col gap-1 animate-fade-in text-left"
        >
          {/* Option 1: Files and documents (ACTIVE) */}
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
                Upload from device (.txt, .pdf, .docx, .ppt)
              </div>
            </div>
          </button>

          <div className="h-px bg-[#2a2a2a] my-1" />

          {/* Option 2: Images (DISABLED) */}
          <div className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left opacity-45 cursor-not-allowed select-none">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Images & Visuals
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-neutral-400 border border-[#383838]">
                  Coming soon
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Multimodal visual grounding
              </div>
            </div>
          </div>

          {/* Option 3: Audio (DISABLED) */}
          <div className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left opacity-45 cursor-not-allowed select-none">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
              <Mic className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Audio & Voice
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-neutral-400 border border-[#383838]">
                  Coming soon
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Speech-to-text transcript index
              </div>
            </div>
          </div>

          {/* Option 4: Web link (DISABLED) */}
          <div className="w-full p-2.5 rounded-xl flex items-start gap-3 text-left opacity-45 cursor-not-allowed select-none">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Web Links & URLs
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-neutral-400 border border-[#383838]">
                  Coming soon
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Real-time web crawl & scrape
              </div>
            </div>
          </div>

          {/* Subtitle / Footer Notice */}
          <div className="mt-1 pt-2 border-t border-[#2a2a2a] px-2 pb-1 text-[10px] text-neutral-400 leading-tight text-center">
            Supported: .txt, .pdf, .docx, .ppt • OCR rolling later
          </div>
        </div>
      )}

      {/* MAIN INPUT CONTAINER */}
      <div className="w-full rounded-[26px] bg-[#282828] border border-[#383838] focus-within:border-neutral-500 shadow-xl p-2.5 transition-all flex flex-col gap-2">
        {/* Selected File Chips preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-1 pb-1">
            {attachedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1e293b] border border-blue-500/30 text-blue-200 text-xs font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="max-w-[180px] truncate">{file.name}</span>
                <span className="text-[10px] opacity-75">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(i)}
                  className="hover:opacity-100 opacity-60 p-0.5 rounded-md hover:bg-neutral-800 transition-opacity cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar Row */}
        <div className="flex items-center gap-2 w-full">
          {/* Left Attachment '+' Button */}
          <button
            type="button"
            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isAttachMenuOpen
                ? 'bg-neutral-200 text-black'
                : 'bg-[#383838] hover:bg-[#454545] text-neutral-200'
            }`}
            title="Add attachment"
          >
            <Plus className="w-4 h-4" />
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
      {/* Hidden native file input accepting .txt, .pdf, .docx, .ppt */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".txt,.pdf,.docx,.doc,.ppt,.pptx"
        className="hidden"
      />

      {/* Floating Top-Left Chat Title Overlay (Header bar removed for maximum view) */}
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

      {/* CASE 1: EMPTY / NEW CHAT (Clean, Minimal ChatGPT-style Center Placement) */}
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8 animate-fade-in">
          <div className="w-full max-w-3xl flex flex-col items-center my-auto">
            {/* Clean Center Brand & Heading */}
            <div className="flex flex-col items-center mb-7 select-none text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#262626] border border-[#383838] flex items-center justify-center mb-4 shadow-sm">
                <LioraLogo size={24} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
                Where knowledge meets deterministic proof.
              </h1>
            </div>

            {/* Centered Input Box (ChatGPT-style middle placement) */}
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
                  {/* USER MESSAGE: ChatGPT-style Blue Bubble */}
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
                    /* ASSISTANT MESSAGE: Pure ChatGPT Clean Flow */
                    <div className="flex justify-start items-start gap-3.5 w-full">
                      <div className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <LioraLogo size={18} />
                      </div>

                      <div className="flex-1 flex flex-col gap-2 min-w-0 pt-0.5">
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

                        {/* FINAL ASSISTANT CONTENT */}
                        {!msg.error && msg.content && (
                          <div className="text-[15px] text-neutral-200 leading-7 font-normal space-y-3 selection:bg-blue-600/30">
                            {msg.content.split('\n\n').map((paragraph, i) => {
                              if (paragraph.includes('\n•') || paragraph.startsWith('•') || paragraph.includes('\n-') || paragraph.startsWith('-')) {
                                const lines = paragraph.split('\n');
                                return (
                                  <div key={i} className="space-y-1.5 my-2">
                                    {lines.map((line, lIdx) => (
                                      <div key={lIdx} className="leading-relaxed">
                                        {line}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return (
                                <p key={i} className="leading-relaxed">
                                  {paragraph}
                                </p>
                              );
                            })}

                            {/* Verified Citation Proof Pills */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="pt-2 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] text-neutral-500 font-medium mr-1">
                                  Sources:
                                </span>
                                {msg.citations.map((cite, i) => (
                                  <div
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#262626] border border-[#333333] text-xs text-neutral-300 hover:border-neutral-500 transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="max-w-[220px] truncate">{cite.source}</span>
                                    {cite.page && (
                                      <span className="text-[10px] text-neutral-400 font-mono">
                                        p. {cite.page}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
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
