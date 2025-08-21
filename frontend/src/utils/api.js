// ===============================
// API utility functions for backend integration
// ===============================

// Backend base URL from .env or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://uni-task-hub.onrender.com';

// --- Get Clerk token using useAuth hook ---
let getTokenFunction = null;

export const setAuthTokenGetter = (getToken) => {
  getTokenFunction = getToken;
};

// --- Generic API request function ---
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token if auth function is available
  let token = null;
  if (getTokenFunction) {
    try {
      token = await getTokenFunction();
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }

  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // Add token if present
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

  // Remove Content-Type header for FormData to let browser set it with boundary
  if (isFormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Handle 401 Unauthorized - redirect to sign-in
      if (response.status === 401) {
        // Redirect to sign-in page
        window.location.href = '/sign-in';
        throw new Error('Authentication required. Redirecting to sign-in...');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
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
    // Handle both FormData and regular objects
    const body = taskData instanceof FormData ? taskData : JSON.stringify(taskData);
    return apiRequest('/tasks', {
      method: 'POST',
      body,
      ...options
    });
  },
  
  update: (id, taskData) => apiRequest(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  }),
  
  delete: (id) => apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
  }),
  
  getMyTasks: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/tasks/my-tasks?${params}`);
  },
  
  assignTask: (taskId, data) => apiRequest(`/tasks/${taskId}/assign`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  submitTask: (taskId, data) => apiRequest(`/tasks/${taskId}/submit`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ===============================
// Review-related API functions
// ===============================
export const reviewAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/reviews?${params}`);
  },
  
  create: (reviewData) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }),
  
  update: (id, reviewData) => apiRequest(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  }),
  
  delete: (id) => apiRequest(`/reviews/${id}`, {
    method: 'DELETE',
  }),
};

// ===============================
// Bid-related API functions
// ===============================
export const bidAPI = {
  create: (bidData) => apiRequest('/bids', {
    method: 'POST',
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
  
  accept: (bidId) => apiRequest(`/bids/${bidId}/accept`, {
    method: 'PUT',
  }),
  
  reject: (bidId) => apiRequest(`/bids/${bidId}/reject`, {
    method: 'PUT',
  }),
  
  withdraw: (bidId) => apiRequest(`/bids/${bidId}/withdraw`, {
    method: 'PUT',
  }),
  
  update: (bidId, bidData) => apiRequest(`/bids/${bidId}`, {
    method: 'PUT',
    body: JSON.stringify(bidData),
  }),
  
  getStats: () => apiRequest('/bids/stats'),
};



// ===============================
// Dispute-related API functions
// ===============================
export const disputeAPI = {
  create: (disputeData) => apiRequest('/disputes', {
    method: 'POST',
    body: JSON.stringify(disputeData),
  }),
  
  addMessage: (disputeId, message) => apiRequest(`/disputes/${disputeId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  
  resolve: (disputeId, resolution) => apiRequest(`/disputes/${disputeId}/resolve`, {
    method: 'PUT',
    body: JSON.stringify(resolution),
  }),
  
  getDetails: (disputeId) => apiRequest(`/disputes/${disputeId}`),
  
  getMyDisputes: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/disputes/my-disputes?${params}`);
  },
  
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/disputes?${params}`);
  },
  
  getStats: () => apiRequest('/disputes/stats'),
};

// ===============================
// Notification-related API functions
// ===============================
export const notificationAPI = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`/notifications?${params}`);
  },
  
  markAsRead: (notificationId) => apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  }),
  
  markAllAsRead: () => apiRequest('/notifications/mark-all-read', {
    method: 'PUT',
  }),
  
  delete: (notificationId) => apiRequest(`/notifications/${notificationId}`, {
    method: 'DELETE',
  }),
  
  getUnreadCount: () => apiRequest('/notifications/unread-count'),
  
  clearOld: () => apiRequest('/notifications/clear-old', {
    method: 'DELETE',
  }),
  
  createTest: (notificationData) => apiRequest('/notifications/test', {
    method: 'POST',
    body: JSON.stringify(notificationData),
  }),
};

// ===============================
// Enhanced Task API functions
// ===============================
export const enhancedTaskAPI = {
  ...taskAPI,
  
  submit: (taskId, submissionData) => apiRequest(`/tasks/${taskId}/submit`, {
    method: 'PUT',
    body: JSON.stringify(submissionData),
  }),
};

// ===============================
// User-related API functions
// ===============================
export const userAPI = {
  getProfile: () => apiRequest('/users/profile'),
  updateProfile: (profileData) => apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
};
