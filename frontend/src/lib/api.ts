export const API_BASE_URL = '/api/v1';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { requireAuth = true, headers, ...customConfig } = options;
  const token = getAuthToken();

  if (requireAuth && !token) {
    throw new Error('Authentication required');
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
      ...(requireAuth && token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      // Handle unauthorized
      window.dispatchEvent(new Event('unauthorized'));
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'API request failed');
  }

  return response;
};
