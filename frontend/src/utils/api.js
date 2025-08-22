let getAuthToken = null;

// App.jsx se token getter inject karne ke liye
export function setAuthTokenGetter(fn) {
  getAuthToken = fn;
}

// Match backend server port and base
const API_BASE_URL = "http://localhost:5001";

export async function apiRequest(url, options = {}) {
  if (!getAuthToken) {
    throw new Error("Auth token getter not set. Did you call setAuthTokenGetter in App.jsx?");
  }

  const token = await getAuthToken();

  // Respect FormData by not forcing Content-Type
  const isFormData = options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormData && { "Content-Type": "application/json" }),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // ⚠️ Redirect mat karo — Clerk handle karega
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// GET helper
export function apiGet(url) {
  return apiRequest(url, { method: "GET" });
}

// POST helper
export function apiPost(url, body) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  return apiRequest(url, {
    method: "POST",
    body: isFormData ? body : JSON.stringify(body),
  });
}

// PUT helper
export function apiPut(url, body) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  return apiRequest(url, {
    method: "PUT",
    body: isFormData ? body : JSON.stringify(body),
  });
}

// DELETE helper
export function apiDelete(url) {
  return apiRequest(url, { method: "DELETE" });
}

// Domain-specific APIs
export const taskAPI = {
  getAll: () => apiGet('/api/tasks'),
  getById: (id) => apiGet(`/api/tasks/${id}`),
  getMyTasks: () => apiGet('/api/tasks/my-tasks'),
  create: (formData) => apiPost('/api/tasks', formData),
  update: (id, payload) => apiPut(`/api/tasks/${id}`, payload),
  delete: (id) => apiDelete(`/api/tasks/${id}`),
  assignTask: (id, payload) => apiPut(`/api/tasks/${id}/assign`, payload),
};

export const enhancedTaskAPI = {
  submit: (id, submissionData) => apiPut(`/api/tasks/${id}/submit`, submissionData),
};

export const bidAPI = {
  getForTask: (taskId) => apiGet(`/api/bids/task/${taskId}`),
  getMyBids: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params.append(key, value);
    });
    const query = params.toString();
    return apiGet(`/api/bids/my-bids${query ? `?${query}` : ''}`);
  },
  create: (payload) => apiPost('/api/bids', payload),
  update: (bidId, payload) => apiPut(`/api/bids/${bidId}`, payload),
  withdraw: (bidId) => apiPut(`/api/bids/${bidId}/withdraw`, {}),
};
