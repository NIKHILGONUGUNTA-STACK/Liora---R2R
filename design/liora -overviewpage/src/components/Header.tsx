import React from 'react';
import { Search, Bell, Plus, User, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onOpenNewQuery: () => void;
  onToggleNotifications: () => void;
  hasUnreadNotifications: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenNewQuery,
  onToggleNotifications,
  hasUnreadNotifications,
}) => {
  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-[52px] bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] z-30 flex items-center justify-between px-4 sm:px-6 gap-3">
      {/* Left: Mobile hamburger + Search bar */}
      <div className="flex items-center gap-2.5 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between h-8.5 px-3 rounded-lg bg-slate-50 border border-[#e2e8f0] text-slate-700 hover:bg-slate-100/70 hover:border-slate-300 transition-colors text-left group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            <span className="font-sans text-[12.5px] text-slate-400 group-hover:text-slate-600 truncate">
              Search knowledge nodes, corpora, traces...
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600 font-mono-code text-[10px] font-medium shrink-0 ml-2">
            ⌘K
          </span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Region node pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-[#e2e8f0] font-mono-code text-[11px] text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          <span>US-EAST-01 (SYNTH-CORE)</span>
        </div>

        {/* Notifications */}
        <button
          onClick={onToggleNotifications}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          title="Audit & sync notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasUnreadNotifications && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#1d4ed8] rounded-full" />
          )}
        </button>

        {/* New Query Session */}
        <button
          onClick={onOpenNewQuery}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-geist font-medium text-[12.5px] rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New Query Session</span>
          <span className="xs:hidden">Query</span>
        </button>

        {/* User avatar circle */}
        <div
          className="w-7.5 h-7.5 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white shrink-0 cursor-pointer shadow-2xs hover:ring-2 hover:ring-blue-300 transition-all"
          title="Dr. Evelyn Voss"
        >
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    </header>
  );
};
