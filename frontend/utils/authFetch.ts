// Utility function for authenticated API calls
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get the authentication token from localStorage
  const token = localStorage.getItem('authToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('imihigo_user');
    window.location.reload(); // Force reload to redirect to login
    throw new Error('Authentication failed - token expired or invalid');
  }

  return response;
};

// Helper for GET requests
export const authGet = (url: string) => authFetch(url, { method: 'GET' });

// Helper for POST requests
export const authPost = (url: string, body: any) => authFetch(url, {
  method: 'POST',
  body: JSON.stringify(body)
});

// Helper for PUT requests
export const authPut = (url: string, body: any) => authFetch(url, {
  method: 'PUT',
  body: JSON.stringify(body)
});

// Helper for PATCH requests
export const authPatch = (url: string, body: any) => authFetch(url, {
  method: 'PATCH',
  body: JSON.stringify(body)
});

// Helper for DELETE requests
export const authDelete = (url: string) => authFetch(url, { method: 'DELETE' });
