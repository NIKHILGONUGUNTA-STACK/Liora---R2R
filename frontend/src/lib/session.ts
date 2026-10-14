export interface UserSession {
  token: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  subdomain?: string;
  role: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'liora_session';
const TOKEN_KEY = 'token';
// 2 days session limit in milliseconds (48 hours)
export const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export const saveSession = (
  sessionData: Omit<UserSession, 'expiresAt'> & { expiresAt?: number }
): UserSession => {
  const expiresAt = sessionData.expiresAt || Date.now() + TWO_DAYS_MS;
  const fullSession: UserSession = {
    ...sessionData,
    expiresAt,
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fullSession));
    localStorage.setItem(TOKEN_KEY, fullSession.token);
    
    // Also maintain a 2-day cookie for cross-tab / refresh persistence
    const maxAgeSeconds = Math.floor(TWO_DAYS_MS / 1000);
    document.cookie = `liora_token=${encodeURIComponent(fullSession.token)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to save session to localStorage/cookies:', err);
  }

  // Dispatch auth event so active components update reactively
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: fullSession }));
  return fullSession;
};

export const getSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const session: UserSession = JSON.parse(raw);
    
    // Check if session is expired (older than 2 days)
    if (!session.expiresAt || Date.now() > session.expiresAt) {
      console.warn('Session expired (exceeded 2-day limit). Clearing session.');
      clearSession();
      return null;
    }

    // Ensure raw token is synced
    localStorage.setItem(TOKEN_KEY, session.token);
    return session;
  } catch (err) {
    console.error('Failed to parse session:', err);
    clearSession();
    return null;
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = 'liora_token=; max-age=0; path=/; SameSite=Lax';
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
};

export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};
