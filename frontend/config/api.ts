// API Configuration - using production backend
const getApiUrl = (): string => {
    // Use environment variable if set, otherwise use production backend URL
    return import.meta.env.VITE_API_URL || 'https://full-system-8.onrender.com';
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    VERIFY_USER: `${API_BASE_URL}/api/auth/verify-user`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,

    // User management endpoints (admin)
    PENDING_USERS: `${API_BASE_URL}/api/auth/pending-users`,
    APPROVED_USERS: `${API_BASE_URL}/api/auth/approved-users`,
    APPROVE_USER: `${API_BASE_URL}/api/auth/approve-user`,
    REJECT_USER: `${API_BASE_URL}/api/auth/reject-user`,
    UNITS: `${API_BASE_URL}/api/auth/units`,
    ALL_USERS: `${API_BASE_URL}/api/auth/all-users`,
    UPDATE_USER: `${API_BASE_URL}/api/auth/update-user`,
    DELETE_USER: `${API_BASE_URL}/api/auth/delete-user`,

    // Indicator assignment endpoints
    ASSIGN_INDICATOR: `${API_BASE_URL}/api/auth/assign-indicator`,
    ASSIGNED_INDICATORS: `${API_BASE_URL}/api/auth/assigned-indicators`,
    UNASSIGN_INDICATOR: `${API_BASE_URL}/api/auth/unassign-indicator`,
    UNIT_ASSIGNMENTS: `${API_BASE_URL}/api/auth/unit-assignments`,

    // Data change request endpoints
    DATA_CHANGE_REQUEST: `${API_BASE_URL}/api/auth/data-change-request`,
    DATA_CHANGE_REQUESTS: `${API_BASE_URL}/api/auth/data-change-requests`,
    APPROVE_CHANGE_REQUEST: `${API_BASE_URL}/api/auth/approve-change-request`,
    REJECT_CHANGE_REQUEST: `${API_BASE_URL}/api/auth/reject-change-request`,
    MY_CHANGE_REQUESTS: `${API_BASE_URL}/api/auth/my-change-requests`,

    // Submission period endpoints
    SUBMISSION_PERIOD_ACTIVE: `${API_BASE_URL}/api/auth/submission-period/active`,
    SUBMISSION_PERIOD_CURRENT: `${API_BASE_URL}/api/auth/submission-period/current`,
    SUBMISSION_PERIODS: `${API_BASE_URL}/api/auth/submission-periods`,
    SUBMISSION_PERIOD: `${API_BASE_URL}/api/auth/submission-period`,

    // Data endpoints
    SUBMISSIONS: `${API_BASE_URL}/api/submissions`,
    ENTRIES: `${API_BASE_URL}/api/entries`,
    METADATA: `${API_BASE_URL}/api/metadata`,
    CLEAR_DATA: `${API_BASE_URL}/api/clear-data`,

    // Analytics
    ANALYTICS: `${API_BASE_URL}/api/analytics`,
    SUBMISSIONS_BY_QUARTER: `${API_BASE_URL}/api/submissions/by-quarter`,

    // File upload endpoints
    UPLOAD: `${API_BASE_URL}/api/upload/upload`,
    UPLOAD_MULTIPLE: `${API_BASE_URL}/api/upload/upload-multiple`,
};

// Helper function to build URLs with IDs
export const getSubmissionUrl = (id: string) => `${API_ENDPOINTS.SUBMISSIONS}/${id}`;
export const getEntryUrl = (id: string) => `${API_ENDPOINTS.ENTRIES}/${id}`;
export const getRejectUserUrl = (userId: string) => `${API_ENDPOINTS.REJECT_USER}/${userId}`;
export const getAssignedIndicatorsUrl = (userEmail: string) => `${API_ENDPOINTS.ASSIGNED_INDICATORS}/${userEmail}`;
export const getUnassignIndicatorUrl = (assignmentId: string) => `${API_ENDPOINTS.UNASSIGN_INDICATOR}/${assignmentId}`;
export const getUnitAssignmentsUrl = (unit: string) => `${API_ENDPOINTS.UNIT_ASSIGNMENTS}/${encodeURIComponent(unit)}`;
export const getDataChangeRequestsUrl = (unit: string) => `${API_ENDPOINTS.DATA_CHANGE_REQUESTS}/${encodeURIComponent(unit)}`;
export const getApproveChangeRequestUrl = (requestId: string) => `${API_ENDPOINTS.APPROVE_CHANGE_REQUEST}/${requestId}`;
export const getRejectChangeRequestUrl = (requestId: string) => `${API_ENDPOINTS.REJECT_CHANGE_REQUEST}/${requestId}`;
export const getMyChangeRequestsUrl = (email: string) => `${API_ENDPOINTS.MY_CHANGE_REQUESTS}/${email}`;
export const getUpdateUserUrl = (userId: string) => `${API_ENDPOINTS.UPDATE_USER}/${userId}`;
export const getDeleteUserUrl = (userId: string) => `${API_ENDPOINTS.DELETE_USER}/${userId}`;
export const getSubmissionPeriodUrl = (id: string) => `${API_ENDPOINTS.SUBMISSION_PERIOD}/${id}`;

