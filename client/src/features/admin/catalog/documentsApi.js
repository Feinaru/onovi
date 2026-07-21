import { api } from '../../../api';

/**
 * Thin wrappers over the admin document endpoints (/api/admin/documents).
 * These endpoints wrap payloads as { success, data }, so each wrapper unwraps
 * `.data`; on failure api() throws with the server `error` string, which the
 * UI maps to Hebrew via catalogErrors.toHebrewError(err, 'document').
 *
 * Scope: defining requirements only — no upload, storage, or review here.
 */

// ---- Document types (סוגי מסמכים) ----
export async function listDocumentTypes(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api(`/api/admin/documents/document-types${qs}`);
  return res.data;
}

export async function createDocumentType(data) {
  const res = await api('/api/admin/documents/document-types', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function updateDocumentType(id, data) {
  const res = await api(`/api/admin/documents/document-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function archiveDocumentType(id) {
  const res = await api(`/api/admin/documents/document-types/${id}/archive`, { method: 'POST' });
  return res.data;
}

export async function restoreDocumentType(id) {
  const res = await api(`/api/admin/documents/document-types/${id}/restore`, { method: 'POST' });
  return res.data;
}

export async function deleteDocumentType(id) {
  return api(`/api/admin/documents/document-types/${id}`, { method: 'DELETE' });
}

// ---- Service document requirements (דרישות מסמכים) ----
export async function listRequirements(serviceTemplateId) {
  const res = await api(`/api/admin/documents/service-templates/${serviceTemplateId}/requirements`);
  return res.data;
}

export async function addRequirement(serviceTemplateId, data) {
  const res = await api(`/api/admin/documents/service-templates/${serviceTemplateId}/requirements`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function updateRequirement(id, data) {
  const res = await api(`/api/admin/documents/requirements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return res.data;
}

export async function removeRequirement(id) {
  return api(`/api/admin/documents/requirements/${id}`, { method: 'DELETE' });
}
