let getAuthToken = null;

// App.jsx se token getter inject karne ke liye
export function setAuthTokenGetter(fn) {
  getAuthToken = fn;
}

const API_BASE_URL = "http://localhost:5000"; // apne backend ka URL yaha daalo

export async function apiRequest(url, options = {}) {
  if (!getAuthToken) {
    throw new Error("Auth token getter not set. Did you call setAuthTokenGetter in App.jsx?");
  }

  const token = await getAuthToken();

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
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
  return apiRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// PUT helper
export function apiPut(url, body) {
  return apiRequest(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// DELETE helper
export function apiDelete(url) {
  return apiRequest(url, { method: "DELETE" });
}
