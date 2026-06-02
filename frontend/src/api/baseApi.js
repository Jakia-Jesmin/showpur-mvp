// frontend/src/api/baseApi.js

const API_BASE_URL = 'http://localhost:8000/api';

const getToken = () => localStorage.getItem('access');

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Extract meaningful error message from Django REST Framework response.
 */
const extractErrorMessage = async (response) => {
  try {
    const errorData = await response.json();
    const messages = [];

    // Handle different DRF error formats
    if (typeof errorData === 'string') {
      return errorData;
    }

    // Flat error fields
    const fields = ['detail', 'email', 'username', 'password', 'current_password', 
                    'new_password', 'phone', 'non_field_errors', 'general'];

    fields.forEach((field) => {
      if (errorData[field]) {
        if (Array.isArray(errorData[field])) {
          messages.push(errorData[field][0]);
        } else if (typeof errorData[field] === 'string') {
          messages.push(errorData[field]);
        } else if (typeof errorData[field] === 'object') {
          // Nested errors
          Object.values(errorData[field]).forEach((val) => {
            if (Array.isArray(val)) messages.push(val[0]);
            else if (typeof val === 'string') messages.push(val);
          });
        }
      }
    });

    if (messages.length > 0) {
      return messages.join(' ');
    }

    // Fallback: show first error value found
    const firstKey = Object.keys(errorData)[0];
    if (firstKey) {
      const val = errorData[firstKey];
      return Array.isArray(val) ? val[0] : String(val);
    }

    return `Error ${response.status}: ${response.statusText}`;
  } catch {
    return `Error ${response.status}: ${response.statusText}`;
  }
};

const baseApi = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },

  patch: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },

  postFormData: async (endpoint, formData) => {
    const token = getToken();
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },

  patchFormData: async (endpoint, formData) => {
    const token = getToken();
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new Error(message);
    }
    return response.json();
  },
};

export default baseApi;
