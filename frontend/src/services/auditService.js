import { apiRequest } from './api';

function formatEvent(e) {
  const d = e.created_at ? new Date(e.created_at) : new Date();
  return {
    id: e.id,
    document_id: e.document_id,
    action: e.action,
    user: e.user,
    role: e.role,
    timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('en-CA'),
    status: e.status,
    detail: e.detail,
  };
}

export default {
  async getAuditHistory(documentId) {
    const q = documentId ? `?document_id=${encodeURIComponent(documentId)}` : '';
    const result = await apiRequest('GET', `/audit${q}`);
    return (result.events || []).map(formatEvent);
  },
  async exportAuditLog(format='csv', documentId) {
    const events = await this.getAuditHistory(documentId);
    if (format === 'json') return JSON.stringify(events, null, 2);
    const headers=['ID','Action','Description','User','Role','Date','Timestamp','Status'];
    const rows=events.map(e=>[e.id,e.action,e.detail,e.user,e.role,e.date,e.timestamp,e.status].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    return [headers.join(','),...rows].join('\n');
  },
  downloadExport(content, filename, type='text/csv') {
    const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  },
};
