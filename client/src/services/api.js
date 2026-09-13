// DropThing API Client
const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase ? `${rawBase.replace(/\/$/, '')}/api` : '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('dropthing_token') || localStorage.getItem('droppin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Folder Operations
  async getFolderByCode(code) {
    const res = await fetch(`${API_BASE}/folders/code/${encodeURIComponent(code)}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch folder');
    return data;
  },

  async createQuickDrop(name) {
    const res = await fetch(`${API_BASE}/folders/quick-drop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create quick drop');
    return data;
  },

  async createPermanentFolder(name, customCode) {
    const res = await fetch(`${API_BASE}/folders/permanent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ name, customCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create permanent folder');
    return data;
  },

  async getUserFolders() {
    const res = await fetch(`${API_BASE}/folders/my-folders`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch your folders');
    return data.folders;
  },

  async deleteFolder(folderId) {
    const res = await fetch(`${API_BASE}/folders/${folderId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete folder');
    return data;
  },

  // Item Operations
  async addText({ folderId, title, textContent }) {
    const res = await fetch(`${API_BASE}/items/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, title, textContent })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add text');
    return data;
  },

  async uploadFiles({ folderId, files }) {
    const formData = new FormData();
    formData.append('folderId', folderId);
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const res = await fetch(`${API_BASE}/items/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload files');
    return data;
  },

  getDownloadUrl(itemId) {
    return `${API_BASE}/items/download/${itemId}`;
  },

  getViewUrl(itemId) {
    return `${API_BASE}/items/view/${itemId}`;
  },

  async deleteItem(itemId) {
    const res = await fetch(`${API_BASE}/items/${itemId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete item');
    return data;
  },

  // Auth Operations
  async register({ name, email, password }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    localStorage.setItem('dropthing_token', data.token);
    localStorage.setItem('dropthing_user', JSON.stringify(data.user));
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    localStorage.setItem('dropthing_token', data.token);
    localStorage.setItem('dropthing_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('dropthing_token');
    localStorage.removeItem('dropthing_user');
    localStorage.removeItem('droppin_token');
    localStorage.removeItem('droppin_user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('dropthing_user') || localStorage.getItem('droppin_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
};
