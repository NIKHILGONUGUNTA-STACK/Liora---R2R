import { ChatSessionItem } from '../components/Sidebar';
import { ChatMessage } from '../views/chat/ChatInterface';

const SESSIONS_KEY_PREFIX = 'liora_chat_sessions_';
const ACTIVE_CHAT_KEY_PREFIX = 'liora_active_chat_';
const MESSAGES_KEY_PREFIX = 'liora_chat_messages_';

/**
 * Get sanitized user storage key based on user email or identifier
 */
export const getUserStorageKey = (userEmail?: string): string => {
  if (!userEmail) return 'guest';
  return userEmail.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
};

/**
 * Generate a UUID-formatted chat ID matching present length (18 chars: e.g. 692576fc-bba4-8323)
 */
export const generateUniqueChatId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    // Standard UUID is 8-4-4-4-12. Slice first 18 characters (8-4-4) for clean compact length
    return crypto.randomUUID().slice(0, 18);
  }
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}`;
};

/**
 * Load persisted chat sessions for the user from localStorage (guaranteed deduplication)
 */
export const getStoredChatSessions = (userKey: string): ChatSessionItem[] => {
  try {
    const raw = localStorage.getItem(`${SESSIONS_KEY_PREFIX}${userKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Deduplicate sessions by ID to prevent React duplicate key warnings
    const seen = new Set<string>();
    const uniqueSessions: ChatSessionItem[] = [];
    for (const item of parsed) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniqueSessions.push(item);
      }
    }
    return uniqueSessions;
  } catch (err) {
    console.error('Failed to load stored chat sessions:', err);
    return [];
  }
};

/**
 * Save chat sessions to localStorage (deduplicated)
 */
export const saveStoredChatSessions = (
  userKey: string,
  sessions: ChatSessionItem[]
): void => {
  try {
    const seen = new Set<string>();
    const uniqueSessions = sessions.filter((s) => {
      if (!s || !s.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    localStorage.setItem(
      `${SESSIONS_KEY_PREFIX}${userKey}`,
      JSON.stringify(uniqueSessions)
    );
  } catch (err) {
    console.error('Failed to save chat sessions:', err);
  }
};

/**
 * Get the last active chat ID for the user
 */
export const getStoredActiveChatId = (userKey: string): string | null => {
  try {
    return localStorage.getItem(`${ACTIVE_CHAT_KEY_PREFIX}${userKey}`) || null;
  } catch {
    return null;
  }
};

/**
 * Save active chat ID to localStorage
 */
export const saveStoredActiveChatId = (
  userKey: string,
  chatId: string | null
): void => {
  try {
    if (chatId) {
      localStorage.setItem(`${ACTIVE_CHAT_KEY_PREFIX}${userKey}`, chatId);
    } else {
      localStorage.removeItem(`${ACTIVE_CHAT_KEY_PREFIX}${userKey}`);
    }
  } catch (err) {
    console.error('Failed to save active chat ID:', err);
  }
};

/**
 * Load messages for a specific chat ID from localStorage
 */
export const getStoredMessages = (chatId: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Failed to load stored messages for chat ${chatId}:`, err);
    return [];
  }
};

/**
 * Save messages for a specific chat ID to localStorage
 */
export const saveStoredMessages = (
  chatId: string,
  messages: ChatMessage[]
): void => {
  try {
    localStorage.setItem(
      `${MESSAGES_KEY_PREFIX}${chatId}`,
      JSON.stringify(messages)
    );
  } catch (err) {
    console.error(`Failed to save messages for chat ${chatId}:`, err);
  }
};

/**
 * Delete persisted messages when a chat is deleted
 */
export const deleteStoredChatMessages = (chatId: string): void => {
  try {
    localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${chatId}`);
  } catch (err) {
    console.error(`Failed to delete messages for chat ${chatId}:`, err);
  }
};
