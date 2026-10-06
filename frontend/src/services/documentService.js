import { apiRequest } from './api';

const RESULT_KEY = 'ldi_latest_analysis';
const DOC_KEY = 'ldi_current_document_id';

export default {
  async uploadDocument(file, metadata = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => { if (value) formData.append(key, value); });
    const result = await apiRequest('POST', '/upload', { body: formData, isForm: true });
    const enriched = { ...result, metadata, document_id: result.document_id };
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(enriched));
    if (result.document_id) sessionStorage.setItem(DOC_KEY, result.document_id);
    return enriched;
  },
  async getDocument(id) { return apiRequest('GET', `/documents/${id}`); },
  async getDocuments() { return []; },
  async searchDocuments() { return []; },
};
