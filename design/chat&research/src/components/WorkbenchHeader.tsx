import React, { useState } from 'react';
import { Icon } from './Icon';

interface WorkbenchHeaderProps {
  title: string;
  threadId: string;
  corpusName: string;
  fragmentCount: string;
  syncStatus: string;
  onBranchThread: () => void;
  onExportSpec: () => void;
}

export const WorkbenchHeader: React.FC<WorkbenchHeaderProps> = ({
  title,
  threadId,
  corpusName,
  fragmentCount,
  syncStatus,
  onBranchThread,
  onExportSpec,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="w-full bg-white px-4 py-2 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-2 select-none">
      {/* Title & Corpus Metadata */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full bg-primary-container shrink-0"></div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline-sm text-[14px] font-semibold text-on-surface truncate">
              {title}
            </h1>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-50 border border-[#e2e8f0] text-on-surface-variant font-label-sm text-[10px] font-semibold">
              {threadId}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 font-code-sm text-[11px] text-secondary flex-wrap">
            <span className="flex items-center gap-1">
              <Icon name="menu_book" size={13} className="text-primary" />
              <span>Corpus:</span>
              <span className="font-semibold text-on-surface">{corpusName}</span>
            </span>
            <span>•</span>
            <span>Indexed: {fragmentCount} fragments</span>
            <span>•</span>
            <span className="text-[#10b981] flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
              {syncStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 relative">
        <button
          onClick={onBranchThread}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 text-secondary hover:text-on-surface font-label-md text-[11.5px] transition-colors cursor-pointer"
          type="button"
        >
          <Icon name="fork_right" size={14} className="text-secondary" />
          <span>Branch</span>
        </button>

        <button
          onClick={onExportSpec}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 text-secondary hover:text-on-surface font-label-md text-[11.5px] transition-colors cursor-pointer"
          type="button"
        >
          <Icon name="file_download" size={14} className="text-secondary" />
          <span>Export</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 text-secondary hover:text-on-surface transition-colors cursor-pointer"
            type="button"
            title="More actions"
          >
            <Icon name="more_vert" size={15} className="text-secondary" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-44 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 p-1 font-label-md text-[12px]">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-on-surface flex items-center gap-2"
              >
                <Icon name="link" size={14} className="text-secondary" />
                Copy Link
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-on-surface flex items-center gap-2"
              >
                <Icon name="print" size={14} className="text-secondary" />
                Print PDF
              </button>
              <div className="h-px bg-[#e2e8f0] my-1"></div>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded-lg flex items-center gap-2"
              >
                <Icon name="archive" size={14} className="text-red-500" />
                Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
