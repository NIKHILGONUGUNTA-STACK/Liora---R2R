import React from 'react';
import { Icon } from './Icon';

interface TopHeaderProps {
  clusterStatus?: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isEvidenceOpen: boolean;
  onToggleEvidence: () => void;
  evidenceCount: number;
  onNewChat: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  clusterStatus = 'US-EAST-01 (SYNTH-CORE)',
  isSidebarCollapsed,
  onToggleSidebar,
  isEvidenceOpen,
  onToggleEvidence,
  evidenceCount,
  onNewChat,
}) => {
  const leftClass = isSidebarCollapsed ? 'left-14' : 'left-56';

  return (
    <header
      className={`fixed top-0 ${leftClass} right-0 h-11 bg-white/80 backdrop-blur-md z-40 flex items-center justify-between px-4 gap-3 transition-all duration-200 border-b border-slate-100/80`}
    >
      {/* Left: Sidebar toggle if collapsed */}
      <div className="flex items-center gap-2">
        {isSidebarCollapsed && (
          <button
            onClick={onToggleSidebar}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-secondary flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Expand Sidebar"
          >
            <Icon name="panel_left" size={16} className="text-secondary" />
          </button>
        )}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 font-code-sm text-[10.5px] text-on-surface">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shrink-0"></span>
          <span>{clusterStatus}</span>
        </div>
      </div>

      {/* Right: Clean controls without duplicate profile or heavy search */}
      <div className="flex items-center gap-2">
        {/* Quick New Chat Button */}
        <button
          onClick={onNewChat}
          className="inline-flex items-center gap-1 h-7 px-2.5 bg-primary text-white font-label-md text-[11.5px] font-medium rounded-lg hover:bg-primary-container transition-colors cursor-pointer shrink-0 shadow-2xs"
          type="button"
        >
          <Icon name="add" size={13} className="text-white" />
          <span>New Chat</span>
        </button>

        {/* Evidence Inspector Toggle Button */}
        <button
          onClick={onToggleEvidence}
          className={`h-7 px-2.5 rounded-lg border text-[11.5px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            isEvidenceOpen
              ? 'bg-primary-container text-on-primary border-primary-container shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-secondary border-slate-200 hover:text-on-surface'
          }`}
          title={isEvidenceOpen ? 'Close Evidence' : 'Open Evidence Inspector'}
        >
          <Icon name="fact_check" size={14} className={isEvidenceOpen ? 'text-on-primary' : 'text-primary'} />
          <span>Evidence</span>
          <span
            className={`px-1 py-0.2 rounded text-[9.5px] font-semibold ${
              isEvidenceOpen ? 'bg-white/20 text-white' : 'bg-slate-100 text-secondary'
            }`}
          >
            {evidenceCount}
          </span>
        </button>
      </div>
    </header>
  );
};
