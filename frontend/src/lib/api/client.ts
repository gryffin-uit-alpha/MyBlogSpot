function getBaseUrl(): string {
  let base = '';
  if (typeof window === 'undefined') {
    base = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://myblogspot-staging-backend:8080';
  } else {
    base = process.env.NEXT_PUBLIC_API_URL || '';
  }
  return base.replace(/\/+$/, '').replace(/\/api(\/v1)?$/, '');
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Ensure endpoint routes under /api/v1 for reverse proxy/ALB compatibility
  const normalizedEndpoint = cleanEndpoint.startsWith('/api/v1') 
    ? cleanEndpoint 
    : `/api/v1${cleanEndpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  // Get token from localStorage if available
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('myblogspot_admin_token')
    : null;

  const headers: Record<string, string> = {
    ...options?.headers as Record<string, string>,
  };

  // Only set Content-Type to application/json if not already set and body is not FormData
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token exists
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: async <T = any>(endpoint: string, config?: { params?: Record<string, string> }) => {
    const queryString = config?.params ? '?' + new URLSearchParams(config.params).toString() : '';
    const response = await apiClient<T>(endpoint + queryString, { method: 'GET' });
    return { data: response };
  },

  post: async <T = any>(endpoint: string, data?: any, config?: { headers?: Record<string, string> }) => {
    const isFormData = data instanceof FormData;
    const response = await apiClient<T>(endpoint, {
      method: 'POST',
      headers: isFormData ? config?.headers : { 'Content-Type': 'application/json', ...config?.headers },
      body: isFormData ? data : JSON.stringify(data),
    });
    return { data: response };
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
