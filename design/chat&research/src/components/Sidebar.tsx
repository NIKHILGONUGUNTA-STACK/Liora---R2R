import React, { useState } from 'react';
import { Icon } from './Icon';

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  corpus: string;
  docCount?: number;
}

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  workspace: string;
  onWorkspaceChange: (ws: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenGlobalSearch: () => void;
  onOpenProfile: () => void;
  activeChatId: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  chatSessions: ChatSession[];
  onRenameChat?: (chatId: string, newTitle: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onBranchChat?: (chatId: string) => void;
  onArchiveChat?: (chatId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  workspace,
  onWorkspaceChange,
  isCollapsed,
  onToggleCollapse,
  onOpenGlobalSearch,
  onOpenProfile,
  activeChatId,
  onSelectChat,
  onNewChat,
  chatSessions,
  onRenameChat = () => {},
  onDeleteChat = () => {},
  onBranchChat = () => {},
  onArchiveChat = () => {},
}) => {
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(true);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  const workspaces = [
    'Enterprise Production',
    'Staging Cluster West',
    'SecOps Sandboxes',
    'Disaster Recovery Tier-1',
  ];

  const filteredChats = chatSessions.filter((c) =>
    c.title.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside className="fixed left-0 top-0 h-full w-14 bg-white border-r border-[#e2e8f0] z-50 flex flex-col justify-between items-center py-2.5 select-none transition-all duration-200">
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Logo & Expand toggle */}
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-on-surface transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <Icon name="panel_left" size={16} className="text-secondary" />
          </button>

          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-on-primary">
            <Icon name="hub" size={15} className="text-on-primary" />
          </div>

          <div className="w-8 h-px bg-slate-200 my-0.5" />

          {/* Quick New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"
            title="New Research Chat"
          >
            <Icon name="add" size={16} className="text-white" />
          </button>

          {/* Compact Nav icons */}
          <nav className="flex flex-col gap-1 w-full px-2 mt-1">
            <button
              onClick={() => onTabChange('overview')}
              title="Overview"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <Icon name="dashboard" size={17} className={currentTab === 'overview' ? 'text-on-primary' : 'text-secondary'} />
            </button>
            <button
              onClick={() => onTabChange('chat-and-research')}
              title="Chat & Research"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'chat-and-research'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <Icon name="neurology" size={17} className={currentTab === 'chat-and-research' ? 'text-on-primary' : 'text-secondary'} />
            </button>
            <button
              onClick={() => onTabChange('documents')}
              title="Documents"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'documents'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <Icon name="dataset" size={17} className={currentTab === 'documents' ? 'text-on-primary' : 'text-secondary'} />
            </button>
            <button
              onClick={() => onTabChange('models')}
              title="Models"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'models'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <Icon name="memory" size={17} className={currentTab === 'models' ? 'text-on-primary' : 'text-secondary'} />
            </button>
            <button
              onClick={() => onTabChange('analytics')}
              title="Analytics"
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'analytics'
                  ? 'bg-primary-container text-on-primary shadow-xs'
                  : 'text-secondary hover:bg-slate-100 hover:text-on-surface'
              }`}
            >
              <Icon name="query_stats" size={17} className={currentTab === 'analytics' ? 'text-on-primary' : 'text-secondary'} />
            </button>
          </nav>
        </div>

        {/* Compact User avatar -> opens profile modal */}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary relative cursor-pointer hover:ring-2 hover:ring-primary-fixed transition-all"
          title="Account Profile & Settings (Dr. Evelyn Voss)"
        >
          <Icon name="person" size={16} className="text-on-primary" />
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#10b981] ring-1 ring-white"></span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-[#e2e8f0] z-50 flex flex-col justify-between select-none transition-all duration-200">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header with toggle button beside name */}
        <div className="h-12 px-3 flex items-center justify-between border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-on-primary shrink-0">
              <Icon name="hub" size={14} className="text-on-primary" />
            </div>
            <span className="font-headline-sm text-[13.5px] font-semibold text-on-surface tracking-tight truncate">
              Liora Intelligence
            </span>
          </div>

          {/* Menu button beside name to collapse sidebar */}
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Collapse Sidebar"
          >
            <Icon name="panel_left" size={15} className="text-secondary" />
          </button>
        </div>

        {/* Scaled-down Workspace Selector */}
        <div className="px-3 pt-2 pb-1 relative">
          <div
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-[#e2e8f0] text-on-surface hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
              <span className="font-label-md text-[11.5px] truncate font-medium">
                {workspace}
              </span>
            </div>
            <Icon name="unfold_more" size={13} className="text-secondary shrink-0" />
          </div>

          {isWorkspaceMenuOpen && (
            <div className="absolute left-3 right-3 top-11 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 p-1 space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws}
                  onClick={() => {
                    onWorkspaceChange(ws);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded-lg text-[11.5px] transition-colors flex items-center gap-2 cursor-pointer ${
                    ws === workspace
                      ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold'
                      : 'text-on-surface-variant hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ws === workspace ? 'bg-primary' : 'bg-transparent'
                    }`}
                  />
                  {ws}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Bar (Moved from Top Header to Sidebar above Navigation) */}
        <div className="px-3 py-1">
          <button
            onClick={onOpenGlobalSearch}
            className="w-full flex items-center gap-2 h-7.5 px-2 rounded-lg bg-slate-50 border border-[#e2e8f0] text-secondary hover:bg-slate-100 hover:text-on-surface text-[11.5px] transition-colors cursor-pointer group"
          >
            <Icon name="search" size={13} className="text-secondary group-hover:text-primary transition-colors shrink-0" />
            <span className="flex-1 text-left truncate text-outline">Search nodes, corpora...</span>
            <span className="px-1 py-0.2 rounded bg-slate-200/70 text-[9.5px] font-mono text-secondary">
              ⌘K
            </span>
          </button>
        </div>

        {/* Navigation Category Label */}
        <div className="px-3 pt-1.5 pb-0.5">
          <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary px-1 font-semibold">
            Navigation
          </span>
        </div>

        {/* Navigation Links with Chat & Research as DROPDOWN */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {/* Overview */}
          <button
            onClick={() => onTabChange('overview')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-[12px] font-medium text-left cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-primary-container text-on-primary font-semibold shadow-2xs'
                : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
            }`}
          >
            <Icon
              name="dashboard"
              size={15}
              className={currentTab === 'overview' ? 'text-on-primary' : 'text-secondary'}
            />
            <span>Overview</span>
          </button>

          {/* Chat & Research DROPDOWN Header */}
          <div className="rounded-lg overflow-hidden">
            <div
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-[12px] font-medium cursor-pointer ${
                currentTab === 'chat-and-research'
                  ? 'bg-primary-container text-on-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
              }`}
              onClick={() => {
                onTabChange('chat-and-research');
                setIsChatDropdownOpen(!isChatDropdownOpen);
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  name="neurology"
                  size={15}
                  className={currentTab === 'chat-and-research' ? 'text-on-primary' : 'text-secondary'}
                />
                <span className="truncate">Chat & Research</span>
              </div>
              <div className="flex items-center gap-1">
                <Icon
                  name={isChatDropdownOpen ? 'expand_more' : 'chevron_right'}
                  size={14}
                  className={currentTab === 'chat-and-research' ? 'text-on-primary' : 'text-secondary'}
                />
              </div>
            </div>

            {/* Dropdown Body: Search tab small + chats list */}
            {isChatDropdownOpen && (
              <div className="pl-2 pr-1 pt-1.5 pb-1 space-y-1">
                {/* Small Search Tab with icon for searching chats + Quick New Chat */}
                <div className="flex items-center gap-1 px-1">
                  <div className="flex-1 flex items-center gap-1.5 h-6 px-1.5 rounded-md bg-slate-50 border border-[#e2e8f0] text-[11px]">
                    <Icon name="search" size={11} className="text-secondary shrink-0" />
                    <input
                      type="text"
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="w-full bg-transparent text-on-surface placeholder:text-outline focus:outline-none text-[11px]"
                    />
                  </div>
                  <button
                    onClick={onNewChat}
                    className="w-6 h-6 rounded-md bg-primary hover:bg-primary-container text-white flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                    title="Start New Chat"
                  >
                    <Icon name="add" size={12} className="text-white" />
                  </button>
                </div>

                {/* Chat items list with 3-dots hover menu */}
                <div className="space-y-0.5 max-h-48 overflow-y-auto pt-0.5">
                  {filteredChats.map((chat) => {
                    const isActive = activeChatId === chat.id && currentTab === 'chat-and-research';
                    const isMenuOpen = menuChatId === chat.id;
                    const isRenaming = renamingChatId === chat.id;

                    return (
                      <div key={chat.id} className="relative group/chat">
                        {isRenaming ? (
                          <div className="flex items-center gap-1 p-1 bg-white border border-primary rounded-md">
                            <input
                              type="text"
                              value={renameTitle}
                              onChange={(e) => setRenameTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (renameTitle.trim()) {
                                    onRenameChat(chat.id, renameTitle.trim());
                                  }
                                  setRenamingChatId(null);
                                } else if (e.key === 'Escape') {
                                  setRenamingChatId(null);
                                }
                              }}
                              autoFocus
                              className="w-full text-[11px] text-on-surface bg-transparent focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                if (renameTitle.trim()) {
                                  onRenameChat(chat.id, renameTitle.trim());
                                }
                                setRenamingChatId(null);
                              }}
                              className="text-primary hover:text-primary-container p-0.5 cursor-pointer"
                              title="Save"
                            >
                              <Icon name="check" size={12} />
                            </button>
                            <button
                              onClick={() => setRenamingChatId(null)}
                              className="text-secondary hover:text-on-surface p-0.5 cursor-pointer"
                              title="Cancel"
                            >
                              <Icon name="close" size={12} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              onTabChange('chat-and-research');
                              onSelectChat(chat.id);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-all flex items-center justify-between group cursor-pointer ${
                              isActive
                                ? 'bg-[#dce1ff] text-[#0039b5] font-semibold border-l-2 border-primary'
                                : 'text-on-surface hover:bg-slate-100 hover:text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0 pr-1">
                              <Icon
                                name="neurology"
                                size={12}
                                className={isActive ? 'text-primary' : 'text-secondary group-hover:text-primary shrink-0'}
                              />
                              <span className="truncate">{chat.title}</span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9.5px] text-secondary font-mono group-hover/chat:hidden">
                                {chat.timestamp}
                              </span>
                              {/* 3 dots button on hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuChatId(menuChatId === chat.id ? null : chat.id);
                                }}
                                className="hidden group-hover/chat:flex w-5 h-5 rounded hover:bg-slate-200 text-secondary hover:text-on-surface items-center justify-center transition-colors cursor-pointer"
                                title="Chat options"
                              >
                                <Icon name="more_vert" size={13} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Options Menu Dropdown */}
                        {isMenuOpen && (
                          <div className="absolute right-1 top-full mt-0.5 w-36 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 p-1 font-label-md text-[11px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenameTitle(chat.title);
                                setRenamingChatId(chat.id);
                                setMenuChatId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 text-on-surface flex items-center gap-2 cursor-pointer"
                            >
                              <Icon name="edit" size={13} className="text-secondary" />
                              <span>Rename Chat</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onBranchChat(chat.id);
                                setMenuChatId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 text-on-surface flex items-center gap-2 cursor-pointer"
                            >
                              <Icon name="fork_right" size={13} className="text-secondary" />
                              <span>Branch Fork</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchiveChat(chat.id);
                                setMenuChatId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-slate-50 text-on-surface flex items-center gap-2 cursor-pointer"
                            >
                              <Icon name="archive" size={13} className="text-secondary" />
                              <span>Archive Chat</span>
                            </button>

                            <div className="h-px bg-slate-100 my-0.5"></div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                                setMenuChatId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                            >
                              <Icon name="trash" size={13} className="text-red-500" />
                              <span>Delete Chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredChats.length === 0 && (
                    <div className="text-[10.5px] text-secondary px-2 py-1 italic">
                      No matching chats found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          <button
            onClick={() => onTabChange('documents')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-[12px] font-medium text-left cursor-pointer ${
              currentTab === 'documents'
                ? 'bg-primary-container text-on-primary font-semibold shadow-2xs'
                : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
            }`}
          >
            <Icon
              name="dataset"
              size={15}
              className={currentTab === 'documents' ? 'text-on-primary' : 'text-secondary'}
            />
            <span>Documents</span>
          </button>

          {/* Models & Providers */}
          <button
            onClick={() => onTabChange('models')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-[12px] font-medium text-left cursor-pointer ${
              currentTab === 'models'
                ? 'bg-primary-container text-on-primary font-semibold shadow-2xs'
                : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
            }`}
          >
            <Icon
              name="memory"
              size={15}
              className={currentTab === 'models' ? 'text-on-primary' : 'text-secondary'}
            />
            <span>Models & Providers</span>
          </button>

          {/* Analytics & Audit */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-[12px] font-medium text-left cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-primary-container text-on-primary font-semibold shadow-2xs'
                : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
            }`}
          >
            <Icon
              name="query_stats"
              size={15}
              className={currentTab === 'analytics' ? 'text-on-primary' : 'text-secondary'}
            />
            <span>Analytics & Audit</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onTabChange('settings')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-[12px] font-medium text-left cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-primary-container text-on-primary font-semibold shadow-2xs'
                : 'text-on-surface-variant hover:bg-slate-100 hover:text-on-surface'
            }`}
          >
            <Icon
              name="settings"
              size={15}
              className={currentTab === 'settings' ? 'text-on-primary' : 'text-secondary'}
            />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Operator Profile Footer - Clicking opens ProfileModal! */}
      <div className="p-2.5 bg-white border-t border-[#e2e8f0]">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center justify-between p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-[#e2e8f0] transition-colors text-left cursor-pointer group"
          title="Open Production Profile & Settings"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary group-hover:ring-1 group-hover:ring-primary transition-all">
              <Icon name="person" size={15} className="text-on-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-[11.5px] font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                Dr. Evelyn Voss
              </p>
              <p className="font-label-sm text-[9.5px] text-secondary truncate">
                Lead Cognitive Eng
              </p>
            </div>
          </div>
          <Icon name="tune" size={13} className="text-secondary group-hover:text-primary transition-colors shrink-0" />
        </button>
      </div>
    </aside>
  );
};
