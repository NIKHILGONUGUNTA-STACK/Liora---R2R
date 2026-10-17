import React, { useState, useEffect } from 'react';
import { Sidebar, ChatSessionItem } from '../../components/Sidebar';
import { UserSession } from '../../lib/session';
import { ChatInterface } from '../chat/ChatInterface';
import { EmptyPageView } from './EmptyPageView';
import {
  getUserStorageKey,
  getStoredChatSessions,
  saveStoredChatSessions,
  getStoredActiveChatId,
  saveStoredActiveChatId,
  deleteStoredChatMessages,
  generateUniqueChatId,
} from '../../lib/chatStorage';
import { parseCurrentRoute, navigateTo, getPathForTab } from '../../lib/routes';

interface ProductViewProps {
  session: UserSession | null;
  onGoToLanding: () => void;
  onLogout: () => void;
  initialTab?: string;
  initialChatId?: string;
}

export const ProductView: React.FC<ProductViewProps> = ({
  session,
  onGoToLanding,
  onLogout,
  initialTab,
  initialChatId,
}) => {
  const userKey = getUserStorageKey(session?.email);

  // Synchronize initial tab and chat from route or props
  const [currentTab, setCurrentTab] = useState(() => {
    if (initialTab) return initialTab;
    const parsed = parseCurrentRoute();
    return parsed.tab || 'chat-and-research';
  });

  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>(() => {
    return getStoredChatSessions(userKey);
  });

  const [activeChatId, setActiveChatId] = useState<string | undefined>(() => {
    if (initialChatId) return initialChatId;
    const parsed = parseCurrentRoute();
    if (parsed.chatId) return parsed.chatId;

    const stored = getStoredActiveChatId(userKey);
    const sessions = getStoredChatSessions(userKey);
    if (stored && sessions.some((s) => s.id === stored)) {
      return stored;
    }
    return sessions[0]?.id || undefined;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Synchronize browser URL to clean path-based URL (/chat/:chatId, /overview, /documents, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetPath = getPathForTab(currentTab, activeChatId);
    if (window.location.pathname !== targetPath || window.location.search.includes('view=')) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete('view');
      searchParams.delete('tab');
      searchParams.delete('chat');
      const queryStr = searchParams.toString();
      const finalUrl = queryStr ? `${targetPath}?${queryStr}` : targetPath;
      window.history.replaceState(null, '', finalUrl);
    }
  }, [currentTab, activeChatId]);

  // Handle browser Back / Forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentRoute();
      if (parsed.tab) {
        setCurrentTab(parsed.tab);
      }
      if (parsed.chatId) {
        setActiveChatId(parsed.chatId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state if userKey changes (e.g. login as different user)
  useEffect(() => {
    const loaded = getStoredChatSessions(userKey);
    setChatSessions(loaded);
    const storedActive = getStoredActiveChatId(userKey);
    if (storedActive && loaded.some((s) => s.id === storedActive)) {
      setActiveChatId(storedActive);
    } else {
      setActiveChatId(loaded[0]?.id || undefined);
    }
  }, [userKey]);

  // Auto-initialize first chat if list is empty
  useEffect(() => {
    if (chatSessions.length === 0 && !activeChatId) {
      const initialChat: ChatSessionItem = {
        id: generateUniqueChatId(),
        title: 'New chat',
        timestamp: 'Just now',
      };
      setChatSessions([initialChat]);
      setActiveChatId(initialChat.id);
      saveStoredChatSessions(userKey, [initialChat]);
      saveStoredActiveChatId(userKey, initialChat.id);
    }
  }, []);

  // Persist chat sessions whenever modified
  useEffect(() => {
    saveStoredChatSessions(userKey, chatSessions);
  }, [userKey, chatSessions]);

  // Persist active chat ID whenever changed
  useEffect(() => {
    saveStoredActiveChatId(userKey, activeChatId || null);
  }, [userKey, activeChatId]);

  // Create a new dynamic chat session and persist it with unique UUID
  const handleNewChat = () => {
    const newChat: ChatSessionItem = {
      id: generateUniqueChatId(),
      title: 'New chat',
      timestamp: 'Just now',
    };
    setChatSessions((prev) => {
      const updated = [newChat, ...prev.filter((c) => c.id !== newChat.id)];
      saveStoredChatSessions(userKey, updated);
      return updated;
    });
    setActiveChatId(newChat.id);
    saveStoredActiveChatId(userKey, newChat.id);
    setCurrentTab('chat-and-research');
    navigateTo(`/chat/${newChat.id}`);
  };

  const handlePinChat = (id: string) => {
    setChatSessions((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, isPinned: !c.isPinned } : c
      );
      saveStoredChatSessions(userKey, updated);
      return updated;
    });
  };

  const handleDeleteChat = (id: string) => {
    setChatSessions((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (activeChatId === id) {
        const nextId = updated[0]?.id || undefined;
        setActiveChatId(nextId);
        saveStoredActiveChatId(userKey, nextId || null);
        if (nextId) {
          navigateTo(`/chat/${nextId}`);
        } else {
          navigateTo('/chat');
        }
      }
      saveStoredChatSessions(userKey, updated);
      deleteStoredChatMessages(id);
      return updated;
    });
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChatSessions((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title: newTitle } : c
      );
      saveStoredChatSessions(userKey, updated);
      return updated;
    });
  };

  // Find active chat title
  const activeChat = chatSessions.find((c) => c.id === activeChatId);
  const currentChatTitle = activeChat ? activeChat.title : 'New chat';

  return (
    <div className="min-h-screen bg-[#212121] text-neutral-100 flex font-['Plus_Jakarta_Sans',sans-serif] antialiased overflow-hidden select-none">
      {/* ChatGPT-style Dark Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab === 'chat-and-research') {
            if (chatSessions.length === 0 && !activeChatId) {
              handleNewChat();
            } else {
              navigateTo(activeChatId ? `/chat/${activeChatId}` : '/chat');
            }
          } else {
            navigateTo(getPathForTab(tab));
          }
        }}
        chatSessions={chatSessions}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          saveStoredActiveChatId(userKey, id);
          setCurrentTab('chat-and-research');
          navigateTo(`/chat/${id}`);
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
        onArchiveChat={handleDeleteChat}
        userEmail={session?.email || 'operator@liora.io'}
        userName={session?.firstName || 'Operator'}
        onGoToLanding={onGoToLanding}
        onLogout={onLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={setIsSidebarCollapsed}
      />

      {/* Main product area */}
      <main
        className={`flex-1 min-h-screen bg-[#212121] flex flex-col transition-all duration-200 ${
          isSidebarCollapsed ? 'ml-14' : 'ml-72'
        }`}
      >
        {currentTab === 'chat-and-research' ? (
          <ChatInterface
            key={activeChatId || 'default-chat'}
            chatId={activeChatId}
            chatTitle={currentChatTitle}
            onUpdateChatTitle={(newTitle) => {
              if (activeChatId) {
                handleRenameChat(activeChatId, newTitle);
              } else {
                // If chatting without an explicit session created yet, create one
                const newId = generateUniqueChatId();
                const newChat: ChatSessionItem = {
                  id: newId,
                  title: newTitle,
                  timestamp: 'Just now',
                };
                setChatSessions((prev) => {
                  const updated = [newChat, ...prev];
                  saveStoredChatSessions(userKey, updated);
                  return updated;
                });
                setActiveChatId(newId);
                saveStoredActiveChatId(userKey, newId);
              }
            }}
          />
        ) : (
          <EmptyPageView
            tab={currentTab}
            onNavigateToChat={() => {
              setCurrentTab('chat-and-research');
              if (chatSessions.length === 0) {
                handleNewChat();
              }
            }}
          />
        )}
      </main>
    </div>
  );
};
