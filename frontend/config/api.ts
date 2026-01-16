// API Configuration for different environments
const getApiUrl = (): string => {
    // In production, use relative URL or environment variable
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_URL || '/api';
    }
    // In development, use localhost
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/login`,
    REGISTER: `${API_BASE_URL}/api/register`,
    VERIFY_USER: `${API_BASE_URL}/api/verify-user`,
    RESET_PASSWORD: `${API_BASE_URL}/api/reset-password`,

    // Data endpoints
    SUBMISSIONS: `${API_BASE_URL}/api/submissions`,
    ENTRIES: `${API_BASE_URL}/api/entries`,
    METADATA: `${API_BASE_URL}/api/metadata`,
    CLEAR_DATA: `${API_BASE_URL}/api/clear-data`,

    // Analytics
    ANALYTICS: `${API_BASE_URL}/api/analytics`,
    SUBMISSIONS_BY_QUARTER: `${API_BASE_URL}/api/submissions/by-quarter`,
};

// Helper function to build URLs with IDs
export const getSubmissionUrl = (id: string) => `${API_ENDPOINTS.SUBMISSIONS}/${id}`;
export const getEntryUrl = (id: string) => `${API_ENDPOINTS.ENTRIES}/${id}`;
