export type AppView = 'landing' | 'auth' | 'product';

export interface ParsedRoute {
  view: AppView;
  tab?: string;
  chatId?: string;
  authMode?: 'signin' | 'signup';
}

/**
 * Parse the current browser URL (supports clean path URLs and legacy query params)
 */
export function parseCurrentRoute(): ParsedRoute {
  if (typeof window === 'undefined') {
    return { view: 'landing' };
  }

  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);

  // Legacy query params for backward compatibility
  const legacyView = searchParams.get('view');
  const legacyChat = searchParams.get('chat');
  const legacyTab = searchParams.get('tab');

  // 1. Auth routes
  if (pathname === '/auth' || pathname === '/login' || pathname === '/signin' || legacyView === 'auth') {
    return { view: 'auth', authMode: 'signin' };
  }
  if (pathname === '/signup' || pathname === '/register') {
    return { view: 'auth', authMode: 'signup' };
  }

  // 2. Chat routes: /chat/:chatId or /chat
  const chatMatch = pathname.match(/^\/chat\/(.+)$/);
  if (chatMatch) {
    const rawId = decodeURIComponent(chatMatch[1].trim());
    return {
      view: 'product',
      tab: 'chat-and-research',
      chatId: rawId,
    };
  }

  if (pathname === '/chat') {
    return {
      view: 'product',
      tab: 'chat-and-research',
      chatId: legacyChat || undefined,
    };
  }

  // 3. Product navigation tabs
  if (pathname === '/overview') {
    return { view: 'product', tab: 'overview' };
  }
  if (pathname === '/documents') {
    return { view: 'product', tab: 'documents' };
  }
  if (pathname === '/models' || pathname === '/models-and-providers') {
    return { view: 'product', tab: 'models-and-providers' };
  }
  if (pathname === '/analytics' || pathname === '/analytics-and-audit') {
    return { view: 'product', tab: 'analytics-and-audit' };
  }
  if (pathname === '/settings') {
    return { view: 'product', tab: 'settings' };
  }

  // 4. Legacy query fallback: ?view=product&chat=... or ?chat=...
  if (legacyChat) {
    return {
      view: 'product',
      tab: 'chat-and-research',
      chatId: legacyChat,
    };
  }

  if (legacyView === 'product') {
    return {
      view: 'product',
      tab: legacyTab || 'chat-and-research',
      chatId: undefined,
    };
  }

  // 5. Default to Landing Page
  return { view: 'landing' };
}

/**
 * Navigate to a specific path using HTML5 History API without full page reloads
 */
export function navigateTo(path: string, replace = false): void {
  if (typeof window === 'undefined') return;
  if (replace) {
    window.history.replaceState(null, '', path);
  } else {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Get route path for a given tab and optional chat ID
 */
export function getPathForTab(tab: string, chatId?: string): string {
  if (tab === 'chat-and-research') {
    return chatId ? `/chat/${encodeURIComponent(chatId)}` : '/chat';
  }
  if (tab === 'overview') return '/overview';
  if (tab === 'documents') return '/documents';
  if (tab === 'models-and-providers') return '/models';
  if (tab === 'analytics-and-audit') return '/analytics';
  if (tab === 'settings') return '/settings';
  return '/chat';
}
