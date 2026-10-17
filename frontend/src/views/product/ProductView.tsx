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

interface ProductViewProps {
  session: UserSession | null;
  onGoToLanding: () => void;
  onLogout: () => void;
}

export const ProductView: React.FC<ProductViewProps> = ({
  session,
  onGoToLanding,
  onLogout,
}) => {
  const userKey = getUserStorageKey(session?.email);

  // Synchronize initial tab and chat from URL query parameters if available
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab) return urlTab;
    }
    return 'chat-and-research';
  });

  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>(() => {
    return getStoredChatSessions(userKey);
  });

  const [activeChatId, setActiveChatId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlChat = params.get('chat');
      if (urlChat) return urlChat;
    }
    const stored = getStoredActiveChatId(userKey);
    const sessions = getStoredChatSessions(userKey);
    if (stored && sessions.some((s) => s.id === stored)) {
      return stored;
    }
    return sessions[0]?.id || undefined;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Synchronize browser URL query parameters with active chat and active tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'product');
      if (currentTab === 'chat-and-research') {
        url.searchParams.delete('tab');
        if (activeChatId) {
          url.searchParams.set('chat', activeChatId);
        } else {
          url.searchParams.delete('chat');
        }
      } else {
        url.searchParams.delete('chat');
        url.searchParams.set('tab', currentTab);
      }
      window.history.replaceState({}, '', url.toString());
    } catch (_) {}
  }, [currentTab, activeChatId]);

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
          // If user clicks chat-and-research and there are no chats, auto-create a session
          if (tab === 'chat-and-research' && chatSessions.length === 0 && !activeChatId) {
            handleNewChat();
          }
        }}
        chatSessions={chatSessions}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          saveStoredActiveChatId(userKey, id);
          setCurrentTab('chat-and-research');
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
