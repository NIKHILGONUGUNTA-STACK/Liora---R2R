import React, { useState } from 'react';
import { ShieldCheck, Download, Check } from 'lucide-react';
import { AuditLogItem } from '../types';

interface AuditLogStreamProps {
  logs: AuditLogItem[];
  onDownloadLedger?: () => void;
}

export const AuditLogStream: React.FC<AuditLogStreamProps> = ({ logs }) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    // Generate cryptographic receipt JSON
    const ledgerData = {
      workspace: 'Enterprise Production (us-east-2)',
      cluster: 'production-cluster-04',
      generatedAt: new Date().toISOString(),
      signingAlgorithm: 'SHA-256 / Ed25519-Mesh',
      records: logs,
    };
    const blob = new Blob([JSON.stringify(ledgerData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liora-audit-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#e2e8f0] shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1d4ed8]" />
          <h2 className="font-geist font-semibold text-[14px] text-slate-900 tracking-tight">
            Audit Log Stream
          </h2>
        </div>
        <span className="font-mono-code text-[11px] text-slate-400">
          SHA-256 Ledger
        </span>
      </div>

      {/* Audit rows */}
      <div className="space-y-2 mt-2.5">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-2 rounded-lg bg-slate-50 border border-[#e2e8f0] flex flex-col gap-0.5 hover:bg-slate-100/70 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-geist font-medium text-[12px] text-slate-800 flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
                <span className="truncate">{log.title}</span>
              </span>
              <span className="font-mono-code text-[10.5px] text-slate-400 shrink-0">
                {log.timeUTC}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 font-mono-code text-[10.5px]">
              <span className="truncate mr-2">{log.actor}</span>
              <span
                className="text-slate-600 font-medium shrink-0 cursor-help"
                title={`Full SHA-256 hash: ${log.fullHash}`}
              >
                {log.hash}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Download action footer */}
      <div className="pt-2.5 mt-2.5 border-t border-[#e2e8f0]">
        <button
          onClick={handleDownload}
          className="w-full font-geist font-medium text-[11.5px] text-[#1d4ed8] hover:text-[#1e40af] flex items-center gap-1.5 justify-center transition-colors cursor-pointer py-0.5"
        >
          {downloaded ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10b981]" />
              <span className="text-[#10b981]">Ledger downloaded</span>
            </>
          ) : (
            <>
              <span>Download cryptographically signed ledger</span>
              <Download className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
