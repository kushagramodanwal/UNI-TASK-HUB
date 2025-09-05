// ===============================
// API utility functions for backend integration
// ===============================

// Backend base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined in your environment variables");
}

// --- Clerk token getter (set from React) ---
let getTokenFunction = null;

export const setAuthTokenGetter = (getToken) => {
  getTokenFunction = getToken;
};

// --- Helper to fetch token safely ---
const fetchAuthToken = async () => {
  try {
    // 1. If React provided `getToken`, use it
    if (getTokenFunction) {
      return await getTokenFunction();
    }
    // 2. Fallback to window.Clerk (for non-React code)
    if (window.Clerk?.session) {
      return await window.Clerk.session.getToken();
    }
  } catch (err) {
    console.error("Failed to get auth token:", err);
  }
  return null;
};

// --- Generic API request function ---
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token
  const token = await fetchAuthToken();

  // Default headers
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Check if body is FormData
  const isFormData = options.body instanceof FormData;

  const config = {
    ...options,
    headers: {
      ...(isFormData ? {} : defaultHeaders), // Don't set Content-Type for FormData
      ...(token && { Authorization: `Bearer ${token}` }), // Always add token
      ...options.headers, // Allow overrides
    },
  };

  // Remove Content-Type header for FormData
  if (isFormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Unauthorized request:", endpoint);
        throw new Error("Unauthorized");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// ===============================
// Task-related API functions
// ===============================
export const taskAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/tasks?${params}`);
  },
  getById: (id) => apiRequest(`/tasks/${id}`),
  create: (taskData, options = {}) => {
    const body = taskData instanceof FormData ? taskData : JSON.stringify(taskData);
    return apiRequest("/tasks", { method: "POST", body, ...options });
  },
  update: (id, taskData) =>
    apiRequest(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    }),
  delete: (id) => apiRequest(`/tasks/${id}`, { method: "DELETE" }),
  getMyTasks: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/tasks/my-tasks?${params}`);
  },
  assignTask: (taskId, data) =>
    apiRequest(`/tasks/${taskId}/assign`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  submitTask: (taskId, data) =>
    apiRequest(`/tasks/${taskId}/submit`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ===============================
// Bid-related API functions
// ===============================
export const bidAPI = {
  create: (bidData) =>
    apiRequest("/bids", {
      method: "POST",
      body: JSON.stringify(bidData),
    }),
  getForTask: (taskId, filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/bids/task/${taskId}?${params}`);
  },
  getMyBids: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/bids/my-bids?${params}`);
  },
  accept: (bidId) => apiRequest(`/bids/${bidId}/accept`, { method: "PUT" }),
  reject: (bidId) => apiRequest(`/bids/${bidId}/reject`, { method: "PUT" }),
  withdraw: (bidId) => apiRequest(`/bids/${bidId}/withdraw`, { method: "PUT" }),
  update: (bidId, bidData) =>
    apiRequest(`/bids/${bidId}`, {
      method: "PUT",
      body: JSON.stringify(bidData),
    }),
  getStats: () => apiRequest("/bids/stats"),
};

// ===============================
// Notification-related API functions
// ===============================
export const notificationAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/notifications?${params}`);
  },
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: "PUT" }),
  markAllAsRead: () => apiRequest("/notifications/mark-all-read", { method: "PUT" }),
  delete: (id) => apiRequest(`/notifications/${id}`, { method: "DELETE" }),
  getUnreadCount: () => apiRequest("/notifications/unread-count"),
  clearOld: () => apiRequest("/notifications/clear-old", { method: "DELETE" }),
  createTest: (data) =>
    apiRequest("/notifications/test", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===============================
// Enhanced Task API
// ===============================
export const enhancedTaskAPI = {
  ...taskAPI,
  submit: (taskId, submissionData) =>
    apiRequest(`/tasks/${taskId}/submit`, {
      method: "PUT",
      body: JSON.stringify(submissionData),
    }),
};

// ===============================
// User-related API functions
// ===============================
export const userAPI = {
  getProfile: () => apiRequest("/users/profile"),
  updateProfile: (profileData) =>
    apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),
};
