import React, { useState, useRef } from 'react';
import { Upload, X, CloudUpload, CheckCircle, FileText, Loader2 } from 'lucide-react';

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestSuccess: (filename: string) => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({
  isOpen,
  onClose,
  onIngestSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [strictCitations, setStrictCitations] = useState(true);
  const [shaReceipt, setShaReceipt] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartIngestion = () => {
    setIsProcessing(true);
    const filename = selectedFile ? selectedFile.name : 'SecOps-ZeroTrust-Architecture.pdf';

    setTimeout(() => {
      setIsProcessing(false);
      onIngestSuccess(filename);
      onClose();
      setSelectedFile(null);
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl max-w-md w-full p-5 border border-[#e2e8f0] shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-[#1d4ed8]">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="font-geist font-semibold text-[15px] text-slate-900">
              Ingest Document to Corpus
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="font-sans text-[12px] text-slate-500 mt-2">
          Files will be sanitized, chunked, and parsed through 3072-dimensional vector embedding.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-3.5 p-5 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer text-center ${
            isDragging
              ? 'border-[#1d4ed8] bg-blue-50/50'
              : 'border-[#e2e8f0] bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.md,.json,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />

          <CloudUpload className="w-8 h-8 text-[#1d4ed8] mb-1.5" />
          {selectedFile ? (
            <div className="flex items-center gap-1.5 text-[#1d4ed8] font-geist font-medium text-[12.5px]">
              <FileText className="w-3.5 h-3.5" />
              <span>{selectedFile.name}</span>
            </div>
          ) : (
            <>
              <p className="font-geist font-medium text-[12.5px] text-slate-800">
                Click to select files or drag &amp; drop
              </p>
              <p className="font-mono-code text-[10.5px] text-slate-400 mt-0.5">
                PDF, DOCX, Markdown, or JSON up to 120MB
              </p>
            </>
          )}
        </div>

        {/* Config Checkboxes */}
        <div className="mt-3.5 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={strictCitations}
              onChange={(e) => setStrictCitations(e.target.checked)}
              className="w-3.5 h-3.5 mt-0.5 accent-[#1d4ed8] rounded cursor-pointer"
            />
            <span className="font-sans text-[12px] text-slate-700 select-none">
              Force strict deterministic citations &amp; page anchor mapping
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={shaReceipt}
              onChange={(e) => setShaReceipt(e.target.checked)}
              className="w-3.5 h-3.5 mt-0.5 accent-[#1d4ed8] rounded cursor-pointer"
            />
            <span className="font-sans text-[12px] text-slate-700 select-none">
              Store cryptographic SHA-256 verification receipt
            </span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="h-8 px-3.5 rounded-lg bg-white border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 font-geist text-[12.5px] font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleStartIngestion}
            disabled={isProcessing}
            className="h-8 px-4 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-geist text-[12.5px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Start Ingestion</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
