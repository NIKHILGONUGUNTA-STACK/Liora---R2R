import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { UploadedDoc } from '../types';

interface PromptComposerProps {
  onSubmit: (prompt: string, attachedDoc?: UploadedDoc) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  selectedCorpus: string;
  onCorpusClick: () => void;
  onTuneClick: () => void;
  tokenCount?: number;
  maxTokens?: number;
  isSidebarCollapsed: boolean;
  onUnsupportedFile: (fileName: string) => void;
}

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSubmit,
  selectedModel,
  onModelChange,
  selectedCorpus,
  onCorpusClick,
  onTuneClick,
  tokenCount = 418,
  maxTokens = 16000,
  isSidebarCollapsed,
  onUnsupportedFile,
}) => {
  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState<UploadedDoc | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const availableModels = [
    { id: 'Liora Precision 4.5', desc: 'Highest reasoning depth, strict mTLS' },
    { id: 'Liora Ultra 4.2', desc: 'Extended context 128k, cross-cloud' },
    { id: 'Liora Fast-Inference 3.0', desc: 'Low-latency synthesis under 120ms' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() || attachedDoc) {
        onSubmit(input.trim() || 'Analyze attached document invariants and operational parameters', attachedDoc || undefined);
        setInput('');
        setAttachedDoc(null);
      }
    }
  };

  const handleSend = () => {
    if (input.trim() || attachedDoc) {
      onSubmit(input.trim() || 'Analyze attached document invariants and operational parameters', attachedDoc || undefined);
      setInput('');
      setAttachedDoc(null);
    }
  };

  // Trigger OS native file dialog
  const handleTriggerNativeFile = () => {
    fileInputRef.current?.click();
  };

  // Handle selected file from OS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md', '.ppt', '.pptx'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      onUnsupportedFile(file.name);
      return;
    }

    // Format human size
    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    // Start upload simulation with progress
    setAttachedDoc({
      name: file.name,
      type: file.type || 'Document',
      size: sizeStr,
      status: 'uploading',
      progress: 25,
    });

    setTimeout(() => {
      setAttachedDoc((prev) => (prev ? { ...prev, progress: 65 } : null));
    }, 350);

    setTimeout(() => {
      setAttachedDoc((prev) =>
        prev
          ? {
              ...prev,
              progress: 100,
              status: 'ready',
              pages: Math.max(1, Math.floor(file.size / 45000)),
            }
          : null
      );
    }, 750);
  };

  const leftOffset = isSidebarCollapsed ? 'left-14' : 'left-56';

  return (
    <div className={`fixed bottom-0 ${leftOffset} right-0 px-4 py-2 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-30 transition-all duration-200`}>
      {/* Hidden OS Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx"
        className="hidden"
      />

      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-xl border border-[#e2e8f0] shadow-md pointer-events-auto p-1.5 transition-all">
        {/* Attached Document in Box while uploading/ready */}
        {attachedDoc && (
          <div className="mb-1.5 mx-1 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-[12px] animate-in fade-in">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                {attachedDoc.status === 'uploading' ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                ) : (
                  <Icon name="file_text" size={13} className="text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-on-surface truncate">{attachedDoc.name}</span>
                  <span className="text-[10.5px] text-secondary font-mono">({attachedDoc.size})</span>
                </div>
                <div className="text-[10px] text-secondary flex items-center gap-1.5 font-code-sm">
                  {attachedDoc.status === 'uploading' ? (
                    <span className="text-primary font-medium flex items-center gap-1">
                      <span>Vectorizing document chunk indices...</span>
                      <span>{attachedDoc.progress}%</span>
                    </span>
                  ) : (
                    <span className="text-[#10b981] font-medium flex items-center gap-0.5">
                      <Icon name="check" size={10} className="text-[#10b981]" />
                      <span>Vectorized & Ready for grounding</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setAttachedDoc(null)}
              className="w-5 h-5 rounded hover:bg-slate-200 text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Remove document"
            >
              <Icon name="close" size={13} />
            </button>
          </div>
        )}

        {/* Compact Input Row */}
        <div className="flex items-center gap-2 px-2 py-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-on-surface font-body-md text-[13px] placeholder:text-outline focus:outline-none min-h-[32px]"
            placeholder={
              attachedDoc
                ? `Ask a question grounded in ${attachedDoc.name}...`
                : 'Ask a grounded follow-up question or instruct schema adaptation...'
            }
          />

          {/* Quick Model Selector Pill */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 h-7 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#e2e8f0] text-on-surface font-label-md text-[11px] cursor-pointer transition-colors"
              type="button"
            >
              <Icon name="psychology" size={13} className="text-primary" />
              <span className="font-semibold">{selectedModel.replace('Liora ', '')}</span>
              <Icon name="expand_more" size={12} className="text-secondary" />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 bottom-full mb-1 w-64 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 p-1">
                <div className="font-label-sm text-[10px] text-secondary uppercase tracking-wider px-2 py-0.5">
                  Neural Model
                </div>
                {availableModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onModelChange(m.id);
                      setShowModelPicker(false);
                    }}
                    className={`w-full text-left p-1.5 rounded-lg transition-colors flex flex-col cursor-pointer ${
                      m.id === selectedModel
                        ? 'bg-primary-fixed text-on-primary-fixed-variant'
                        : 'hover:bg-slate-50 text-on-surface'
                    }`}
                  >
                    <span className="font-label-md text-[12px] font-semibold">{m.id}</span>
                    <span className="font-body-sm text-[10.5px] text-secondary">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attach Button (Triggers OS File dialog for PDF, DOC, PPT, TXT) */}
          <button
            onClick={handleTriggerNativeFile}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-secondary hover:text-on-surface transition-colors cursor-pointer shrink-0 relative"
            title="Upload Document (.pdf, .doc, .docx, .ppt, .pptx, .txt)"
            type="button"
          >
            <Icon name="attachment" size={15} className="text-secondary" />
          </button>

          {/* Corpus Pill */}
          <button
            onClick={onCorpusClick}
            className="hidden sm:flex items-center gap-1 h-7 px-2 rounded-lg hover:bg-slate-100 text-secondary hover:text-on-surface transition-colors font-label-md text-[11px] cursor-pointer shrink-0"
            title="Corpus"
            type="button"
          >
            <Icon name="database" size={13} className="text-secondary" />
            <span className="max-w-[100px] truncate">{selectedCorpus.replace(' Core Vault', '')}</span>
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() && !attachedDoc}
            className={`inline-flex items-center justify-center h-7 px-3 rounded-lg font-label-md text-[12px] font-semibold transition-all shrink-0 cursor-pointer ${
              input.trim() || attachedDoc
                ? 'bg-primary-container text-on-primary hover:bg-primary shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            type="button"
          >
            <span className="hidden sm:inline mr-1">Send</span>
            <Icon
              name="arrow_upward"
              size={13}
              className={input.trim() || attachedDoc ? 'text-on-primary' : 'text-slate-400'}
            />
          </button>
        </div>

        {/* Ultra-slim metadata footnote */}
        <div className="flex items-center justify-between px-2 pt-0.5 text-[10px] text-secondary font-code-sm border-t border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            <span>Strict Grounding</span>
          </span>
          <span className="text-outline">
            Tokens: {tokenCount} / {Math.floor(maxTokens / 1000)}k • Press ↵ to send
          </span>
        </div>
      </div>
    </div>
  );
};
