const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Get token from localStorage if available
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('myblogspot_admin_token')
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'API request failed')
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const api = {
  get: async <T = any>(endpoint: string, config?: { params?: Record<string, string> }) => {
    const queryString = config?.params ? '?' + new URLSearchParams(config.params).toString() : '';
    const response = await apiClient<T>(endpoint + queryString, { method: 'GET' });
    return { data: response };
  },

  post: async <T = any>(endpoint: string, data?: any, config?: { headers?: Record<string, string> }) => {
    const isFormData = data instanceof FormData;
    const headers: Record<string, string> = {};

    const token = typeof window !== 'undefined' ? localStorage.getItem('myblogspot_admin_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (config?.headers) {
      Object.assign(headers, config.headers);
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${endpoint}`, {
      method: 'POST',
      headers: isFormData ? (headers['Authorization'] ? { 'Authorization': headers['Authorization'] } : {}) : headers,
      body: isFormData ? data : JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const result = await response.json();
    return { data: result };
  },

  put: async <T = any>(endpoint: string, data?: any) => {
    const response = await apiClient<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { data: response };
  },

  delete: async <T = any>(endpoint: string) => {
    const response = await apiClient<T>(endpoint, { method: 'DELETE' });
    return { data: response };
  },
};
