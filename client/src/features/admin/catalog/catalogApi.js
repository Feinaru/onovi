import { api } from '../../../api';

/**
 * Thin wrappers over the shared api() helper for the admin catalog endpoints:
 *   Field → Profession → ServiceTemplate
 * All routes require an ADMIN token (handled by api() attaching the auth header).
 */

// ---- Fields (תחומים) ----
export const listFields = () => api('/api/admin/fields');
export const createField = (data) =>
  api('/api/admin/fields', { method: 'POST', body: JSON.stringify(data) });
export const updateField = (id, data) =>
  api(`/api/admin/fields/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const archiveField = (id) =>
  api(`/api/admin/fields/${id}/archive`, { method: 'PATCH' });
export const restoreField = (id) =>
  api(`/api/admin/fields/${id}/restore`, { method: 'PATCH' });
export const deleteField = (id) =>
  api(`/api/admin/fields/${id}`, { method: 'DELETE' });

// ---- Professions (מקצועות) ----
export const listProfessions = () => api('/api/admin/professions');
export const createProfession = (data) =>
  api('/api/admin/professions', { method: 'POST', body: JSON.stringify(data) });
export const updateProfession = (id, data) =>
  api(`/api/admin/professions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const archiveProfession = (id) =>
  api(`/api/admin/professions/${id}/archive`, { method: 'PATCH' });
export const restoreProfession = (id) =>
  api(`/api/admin/professions/${id}/restore`, { method: 'PATCH' });
export const deleteProfession = (id) =>
  api(`/api/admin/professions/${id}`, { method: 'DELETE' });

// ---- Service templates (שירותים / תבניות שירות) ----
export const listServiceTemplates = () => api('/api/admin/service-templates');
export const createServiceTemplate = (data) =>
  api('/api/admin/service-templates', { method: 'POST', body: JSON.stringify(data) });
export const updateServiceTemplate = (id, data) =>
  api(`/api/admin/service-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const archiveServiceTemplate = (id) =>
  api(`/api/admin/service-templates/${id}/archive`, { method: 'PATCH' });
export const restoreServiceTemplate = (id) =>
  api(`/api/admin/service-templates/${id}/restore`, { method: 'PATCH' });
export const deleteServiceTemplate = (id) =>
  api(`/api/admin/service-templates/${id}`, { method: 'DELETE' });
