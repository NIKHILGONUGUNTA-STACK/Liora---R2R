import React, { useState } from 'react';
import {
  Plus,
  PanelLeft,
  Search,
  LayoutDashboard,
  Brain,
  Database,
  Cpu,
  BarChart3,
  Settings,
  MoreHorizontal,
  SlidersHorizontal,
  LogOut,
  Pencil,
  Pin,
  Share,
  Archive,
  Trash2,
  Folder,
  ChevronRight,
} from 'lucide-react';
import { LioraLogo } from './LioraLogo';

export interface ChatSessionItem {
  id: string;
  title: string;
  timestamp?: string;
  isPinned?: boolean;
}

interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  chatSessions?: ChatSessionItem[];
  activeChatId?: string;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  onPinChat?: (id: string) => void;
  onArchiveChat?: (id: string) => void;
  onShareChat?: (id: string) => void;
  onMoveToProject?: (id: string) => void;
  userEmail?: string;
  userName?: string;
  onGoToLanding?: () => void;
  onLogout?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab = 'chat-and-research',
  onTabChange = () => {},
  chatSessions = [],
  activeChatId,
  onSelectChat = () => {},
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onPinChat,
  onArchiveChat,
  onShareChat,
  onMoveToProject,
  userEmail = 'operator@liora.io',
  userName = 'Operator',
  onGoToLanding,
  onLogout,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = (collapsed: boolean) => {
    if (onToggleCollapse) onToggleCollapse(collapsed);
    setInternalIsCollapsed(collapsed);
  };
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Keep pinned chats sorted at the top
  const sortedChatSessions = [...chatSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const activeMenuChat = chatSessions.find((c) => c.id === menuChatId);

  // Top navigation items in requested order:
  // 1. Overview
  // 2. Documents
  // 3. Models & Providers
  // 4. Analytics & Audit
  // 5. Chat & Research (with "+ New chat" and indented chats scroll area)
  // (Settings is placed just above the profile tab at the bottom)
  const mainNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: Database },
    { id: 'models', label: 'Models & Providers', icon: Cpu },
    { id: 'analytics', label: 'Analytics & Audit', icon: BarChart3 },
  ];

  // ============================================================
  // COLLAPSED SIDEBAR (Icon Rail)
  // ============================================================
  if (isCollapsed) {
    return (
      <aside className="fixed left-0 top-0 h-full w-14 bg-[#171717] border-r border-[#262626] z-50 flex flex-col justify-between items-center py-3 select-none transition-all duration-200">
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Logo & Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="w-9 h-9 rounded-lg hover:bg-[#212121] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          <div
            onClick={onGoToLanding}
            className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
            title="Back to Home"
          >
            <LioraLogo size={28} />
          </div>

          <div className="w-8 h-px bg-[#262626] my-1" />

          {/* New Chat icon in collapsed rail */}
          <button
            type="button"
            onClick={() => {
              onTabChange('chat-and-research');
              if (onNewChat) onNewChat();
            }}
            className="w-10 h-10 mx-auto rounded-lg hover:bg-[#212121] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Navigation Icon Buttons */}
          <nav className="flex flex-col gap-1 w-full mt-1">
            {mainNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#212121] text-white border border-[#383838]'
                      : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}

            {/* Chat & Research Icon Button (only hover effect, no highlight) */}
            <button
              type="button"
              onClick={() => onTabChange('chat-and-research')}
              title="Chat & Research"
              className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors cursor-pointer text-neutral-400 hover:text-white hover:bg-[#212121]"
            >
              <Brain className="w-4 h-4" />
            </button>
          </nav>
        </div>

        {/* Collapsed Bottom Area: Settings + Profile */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {/* Settings Tab Button above profile */}
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            title="Settings"
            className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#212121] text-white border border-[#383838]'
                : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-8 h-px bg-[#262626] my-0.5" />

          {/* User Avatar */}
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-9 h-9 rounded-full bg-[#262626] border border-[#383838] flex items-center justify-center text-white relative hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer"
            title={userName}
          >
            <span className="text-xs font-bold uppercase">{userName.charAt(0) || 'O'}</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#171717]" />
          </button>
        </div>
      </aside>
    );
  }

  // ============================================================
  // FULL EXPANDED SIDEBAR (ChatGPT dark theme: #171717, w-72)
  // ============================================================
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#171717] border-r border-[#262626] z-50 flex flex-col justify-between select-none text-neutral-200 font-['Plus_Jakarta_Sans',sans-serif] transition-all duration-200">
      {/* Global transparent backdrop for closing open context menu */}
      {menuChatId && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => {
            setMenuChatId(null);
            setMenuPosition(null);
          }}
        />
      )}

      <div className="flex flex-col flex-1 min-h-0">
        {/* ======================================================= */}
        {/* HEADER: Clean Logo & Collapse Icon                      */}
        {/* ======================================================= */}
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-[#262626] shrink-0">
          <div
            onClick={onGoToLanding}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            title="Back to Home"
          >
            <LioraLogo size={28} />
            <span className="text-[15px] font-bold text-white tracking-tight leading-none">
              Liora
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-8 h-8 rounded-lg hover:bg-[#212121] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================= */}
        {/* QUICK SEARCH BAR                                        */}
        {/* ======================================================= */}
        <div className="px-3 py-2.5 shrink-0">
          <div className="w-full flex items-center gap-2.5 h-8.5 px-2.5 rounded-lg bg-[#212121] border border-[#2e2e2e] text-neutral-400 text-[13px] transition-colors group">
            <Search className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-neutral-200 placeholder:text-neutral-500 focus:outline-none text-[13px]"
            />
            <span className="px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[10.5px] font-mono text-neutral-400 border border-[#333333]">
              ⌘K
            </span>
          </div>
        </div>

        {/* ======================================================= */}
        {/* MAIN NAVIGATION ITEMS                                   */}
        {/* ======================================================= */}
        <div className="px-2.5 space-y-0.5 shrink-0">
          {/* Overview */}
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13.5px] font-medium text-left cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-[#212121] text-white border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <LayoutDashboard className="w-[18px] h-[18px] text-neutral-400" />
            <span>Overview</span>
          </button>

          {/* Documents */}
          <button
            type="button"
            onClick={() => onTabChange('documents')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13.5px] font-medium text-left cursor-pointer ${
              currentTab === 'documents'
                ? 'bg-[#212121] text-white border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <Database className="w-[18px] h-[18px] text-neutral-400" />
            <span>Documents</span>
          </button>

          {/* Models & Providers */}
          <button
            type="button"
            onClick={() => onTabChange('models')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13.5px] font-medium text-left cursor-pointer ${
              currentTab === 'models'
                ? 'bg-[#212121] text-white border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <Cpu className="w-[18px] h-[18px] text-neutral-400" />
            <span>Models & Providers</span>
          </button>

          {/* Analytics & Audit */}
          <button
            type="button"
            onClick={() => onTabChange('analytics')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13.5px] font-medium text-left cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-[#212121] text-white border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
            }`}
          >
            <BarChart3 className="w-[18px] h-[18px] text-neutral-400" />
            <span>Analytics & Audit</span>
          </button>

          {/* Chat & Research - USER REQUEST: NO HIGHLIGHT, ONLY HOVER EFFECT */}
          <button
            type="button"
            onClick={() => onTabChange('chat-and-research')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13.5px] font-medium text-left cursor-pointer text-neutral-400 hover:text-white hover:bg-[#212121]"
          >
            <Brain className="w-[18px] h-[18px] text-neutral-400" />
            <span>Chat & Research</span>
          </button>
        </div>

        {/* ======================================================= */}
        {/* CHAT & RESEARCH CONTENT                                 */}
        {/* User requested:                                         */}
        {/* - No highlight on New chat tab, only hover effect       */}
        {/* - Removed search bar inside chat                        */}
        {/* - Chats indented a little inside (to the right)         */}
        {/* - No blue edge on chats, simple hover/active            */}
        {/* - 3 dots menu on hover matching exact screenshot        */}
        {/* ======================================================= */}
        <div className="flex-1 min-h-0 flex flex-col px-2.5 pt-1 pb-2">
          {/* USER REQUEST: + New chat (indented slightly right, only hover effect, no highlight) */}
          <div className="pl-2.5">
            <button
              type="button"
              onClick={() => {
                onTabChange('chat-and-research');
                if (onNewChat) onNewChat();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#212121] transition-colors cursor-pointer text-[13.5px] font-medium group/newchat mb-1 shrink-0"
            >
              <Plus className="w-4 h-4 text-neutral-400 group-hover/newchat:text-white transition-colors" />
              <span>New chat</span>
            </button>
          </div>

          {/* Scrollable list of chat sessions - indented slightly to the right */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-0.5 pl-2.5">
            {sortedChatSessions.map((chat) => {
              const isActive = activeChatId === chat.id && currentTab === 'chat-and-research';
              const isMenuOpen = menuChatId === chat.id;
              const isEditing = editingChatId === chat.id;

              return (
                <div key={chat.id} className="relative group/chat">
                  {/* Chat Item Row: simple hover effect, NO blue edge */}
                  <div
                    onClick={() => {
                      if (!isEditing) {
                        onTabChange('chat-and-research');
                        onSelectChat(chat.id);
                      }
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors flex items-center justify-between cursor-pointer ${
                      isActive || isMenuOpen || isEditing
                        ? 'bg-[#212121] text-white font-medium'
                        : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
                    }`}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (editingTitle.trim() && onRenameChat) {
                            onRenameChat(chat.id, editingTitle.trim());
                          }
                          setEditingChatId(null);
                        }}
                        className="flex-1 mr-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => {
                            if (editingTitle.trim() && onRenameChat) {
                              onRenameChat(chat.id, editingTitle.trim());
                            }
                            setEditingChatId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              setEditingChatId(null);
                            }
                          }}
                          className="w-full bg-transparent text-white text-[13px] px-1.5 py-0.5 rounded border border-[#383838] focus:border-neutral-500 focus:outline-none focus:ring-0"
                        />
                      </form>
                    ) : (
                      <span className="truncate flex-1 pr-1">{chat.title}</span>
                    )}

                    {/* Right side: Pin icon (if pinned) and 3-dots on hover */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-neutral-400 rotate-45 shrink-0" />
                        )}

                        {/* 3-dots button matching screenshot (MoreHorizontal) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMenuOpen) {
                              setMenuChatId(null);
                              setMenuPosition(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              // Position outside sidebar, directly overlaying the main canvas area
                              const left = rect.right + 8;
                              const menuHeight = 265;
                              const top = Math.max(12, Math.min(rect.top - 6, window.innerHeight - menuHeight - 12));
                              setMenuPosition({ top, left });
                              setMenuChatId(chat.id);
                            }
                          }}
                          className={`${
                            isMenuOpen
                              ? 'opacity-100 bg-[#333333] text-white'
                              : 'opacity-0 group-hover/chat:opacity-100 text-neutral-400 hover:text-white hover:bg-[#333333]'
                          } w-5 h-5 rounded flex items-center justify-center transition-opacity cursor-pointer`}
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================================= */}
          {/* 3-DOTS CONTEXT MENU: EXACT MATCH TO USER SCREENSHOT     */}
          {/* Options:                                                */}
          {/* 1. Rename                                               */}
          {/* 2. Pin / Unpin                                          */}
          {/* --- divider ---                                         */}
          {/* 3. Share                                                */}
          {/* --- divider ---                                         */}
          {/* 4. Archive                                              */}
          {/* 5. Delete (in red)                                      */}
          {/* --- divider ---                                         */}
          {/* 6. Move to project >                                    */}
          {/* ======================================================= */}
          {activeMenuChat && menuPosition && (
            <div
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
              className="fixed w-52 bg-[#1e1e1e] border border-[#333333] rounded-2xl shadow-2xl z-[9999] p-1.5 text-[13.5px] select-none animate-in fade-in zoom-in-95 duration-100"
            >
              {/* 1. Rename (INLINE, no modal/prompt) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChatId(activeMenuChat.id);
                  setEditingTitle(activeMenuChat.title);
                  setMenuChatId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2a2a2a] text-neutral-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>Rename</span>
              </button>

              {/* 2. Pin / Unpin */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPinChat) {
                    onPinChat(activeMenuChat.id);
                  }
                  setMenuChatId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2a2a2a] text-neutral-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Pin className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>{activeMenuChat.isPinned ? 'Unpin' : 'Pin'}</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-[#2e2e2e] my-1 mx-1" />

              {/* 3. Share */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onShareChat) {
                    onShareChat(activeMenuChat.id);
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Chat share link copied to clipboard!');
                  }
                  setMenuChatId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2a2a2a] text-neutral-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Share className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>Share</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-[#2e2e2e] my-1 mx-1" />

              {/* 4. Archive */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onArchiveChat) {
                    onArchiveChat(activeMenuChat.id);
                  } else {
                    if (onDeleteChat) onDeleteChat(activeMenuChat.id);
                  }
                  setMenuChatId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2a2a2a] text-neutral-200 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>Archive</span>
              </button>

              {/* 5. Delete (in Red) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteChat) {
                    onDeleteChat(activeMenuChat.id);
                  }
                  setMenuChatId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-[#f87171] hover:text-red-300 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-[#f87171] shrink-0" />
                <span>Delete</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-[#2e2e2e] my-1 mx-1" />

              {/* 6. Move to project */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveToProject) {
                    onMoveToProject(activeMenuChat.id);
                  } else {
                    alert('Selected: Move to project');
                  }
                  setMenuChatId(null);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#2a2a2a] text-neutral-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 text-neutral-300 shrink-0" />
                  <span>Move to project</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* BOTTOM SECTION: Settings Tab (Just Above Profile Tab)   */}
      {/* ======================================================= */}
      <div className="px-2.5 pt-2 pb-1.5 border-t border-[#262626] shrink-0">
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[13.5px] font-medium text-left cursor-pointer ${
            currentTab === 'settings'
              ? 'bg-[#212121] text-white border border-[#333333]'
              : 'text-neutral-400 hover:text-white hover:bg-[#212121]'
          }`}
        >
          <Settings className="w-[18px] h-[18px] text-neutral-400" />
          <span>Settings</span>
        </button>
      </div>

      {/* ======================================================= */}
      {/* OPERATOR PROFILE FOOTER                                 */}
      {/* ======================================================= */}
      <div className="p-3 bg-[#171717] border-t border-[#262626] relative shrink-0">
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-[#212121] hover:bg-[#262626] border border-[#2e2e2e] transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-[#2a2a2a] border border-[#383838] flex items-center justify-center shrink-0 text-white font-bold text-xs">
              {userName.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
                {userName}
              </p>
              <p className="text-[11px] text-neutral-400 truncate">
                {userEmail || 'operator@liora.io'}
              </p>
            </div>
          </div>
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors shrink-0" />
        </button>

        {/* Profile Options Dropdown */}
        {isProfileMenuOpen && (
          <div className="absolute left-3 right-3 bottom-16 bg-[#212121] border border-[#333333] rounded-xl shadow-2xl z-50 p-1.5 text-xs space-y-1">
            <div className="px-2 py-1.5 border-b border-[#2e2e2e]">
              <p className="text-[12px] font-semibold text-white truncate">{userName}</p>
              <p className="text-[11px] text-neutral-400 truncate">{userEmail}</p>
            </div>

            {onGoToLanding && (
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onGoToLanding();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#2a2a2a] text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-[12px]"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-neutral-400" />
                <span>Return to Landing</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer flex items-center gap-2 text-[12px]"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};



