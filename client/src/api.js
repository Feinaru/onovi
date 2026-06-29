const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Migrate old storage keys to Onovi (safe migration)
function migrateStorageKeys() {
  // Migrate from pickme to onovi
  const pickmeToken = localStorage.getItem('pickme_token');
  const pickmeUser = localStorage.getItem('pickme_user');

  if (pickmeToken && !localStorage.getItem('onovi_token')) {
    localStorage.setItem('onovi_token', pickmeToken);
    localStorage.removeItem('pickme_token');
  }

  if (pickmeUser && !localStorage.getItem('onovi_user')) {
    localStorage.setItem('onovi_user', pickmeUser);
    localStorage.removeItem('pickme_user');
  }

  // Also migrate old timefill keys
  const oldToken = localStorage.getItem('timefill_token');
  const oldUser = localStorage.getItem('timefill_user');

  if (oldToken && !localStorage.getItem('onovi_token')) {
    localStorage.setItem('onovi_token', oldToken);
    localStorage.removeItem('timefill_token');
  }

  if (oldUser && !localStorage.getItem('onovi_user')) {
    localStorage.setItem('onovi_user', oldUser);
    localStorage.removeItem('timefill_user');
  }
}

// Run migration on load
migrateStorageKeys();

export function getToken() {
  return localStorage.getItem('onovi_token');
}

export function setSession(token, user) {
  localStorage.setItem('onovi_token', token);
  localStorage.setItem('onovi_user', JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem('onovi_user');
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem('onovi_token');
  localStorage.removeItem('onovi_user');
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'שגיאת שרת');
  return data;
}
