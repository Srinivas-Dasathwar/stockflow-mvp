const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('stockflow_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('stockflow_token', token);
  } else {
    localStorage.removeItem('stockflow_token');
  }
}

export function clearAuth() {
  localStorage.removeItem('stockflow_token');
  localStorage.removeItem('stockflow_user');
  localStorage.removeItem('stockflow_org');
}

export function saveSession(user, org, token) {
  if (token) setAuthToken(token);
  if (user) localStorage.setItem('stockflow_user', JSON.stringify(user));
  if (org) localStorage.setItem('stockflow_org', JSON.stringify(org));
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem('stockflow_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getCachedOrg() {
  try {
    const raw = localStorage.getItem('stockflow_org');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  async signup({ email, password, organizationName }) {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, organizationName }),
    });
  },

  async login({ email, password }) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return request('/auth/me');
  },

  // Dashboard
  async getDashboard() {
    return request('/dashboard');
  },

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.lowStockOnly) query.set('lowStockOnly', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/products${queryString}`);
  },

  async getProduct(id) {
    return request(`/products/${id}`);
  },

  async createProduct(data) {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(id, data) {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(id) {
    return request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async adjustStock(id, { delta, note }) {
    return request(`/products/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ delta, note }),
    });
  },

  async seedDemoProducts() {
    return request('/products/seed', {
      method: 'POST',
    });
  },

  // Settings
  async getSettings() {
    return request('/settings');
  },

  async updateSettings(data) {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
