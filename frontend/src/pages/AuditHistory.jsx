import { useEffect, useMemo, useState } from 'react';
import { History, Download, Filter, Search, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import AuditTimeline from '../components/AuditTimeline';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import auditService from '../services/auditService';

const DOC_KEY='ldi_current_document_id';

export default function AuditHistory() {
  const [events,setEvents]=useState([]); const [search,setSearch]=useState(''); const [statusFilter,setStatusFilter]=useState('All'); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  const documentId=sessionStorage.getItem(DOC_KEY);
  const load=async()=>{setLoading(true);setError(null);try{setEvents(await auditService.getAuditHistory(documentId));}catch(e){setError(e.message||'Unable to load audit history.');}finally{setLoading(false);}};
  useEffect(()=>{load();},[documentId]);
  const statuses=['All','Completed','Escalated'];
  const filtered=useMemo(()=>events.filter(e=>(e.action+' '+e.detail+' '+e.user).toLowerCase().includes(search.toLowerCase())&&(statusFilter==='All'||e.status===statusFilter)),[events,search,statusFilter]);
  const exportLog=async()=>{const content=await auditService.exportAuditLog('csv',documentId);auditService.downloadExport(content,'tata-legal-ai-audit.csv');};
  return <div>
    <PageHeader title="Audit History" subtitle="Track document processing and review activities for the uploaded document." icon={History} actions={<div className="flex gap-2"><Button variant="secondary" icon={RefreshCw} onClick={load}>Refresh</Button><Button variant="secondary" icon={Download} onClick={exportLog}>Export Log</Button></div>} />
    {error?<div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>:null}
    {!documentId&&!loading?<div className="card p-6 text-sm text-slate-500">No current document is selected. Upload a document first to view its audit history.</div>:null}
    {documentId?<div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-1"><div className="card p-5"><h3 className="mb-4 text-sm font-semibold text-slate-700">Activity Timeline</h3>{loading?<p className="text-sm text-slate-400">Loading…</p>:<AuditTimeline events={filtered}/>}</div></div><div className="lg:col-span-2"><div className="card p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-sm font-semibold text-slate-700">Audit Log</h3><div className="flex flex-wrap items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm focus:border-brand-400 focus:outline-none"/></div><div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5"><Filter className="ml-1.5 h-3.5 w-3.5 text-slate-400"/>{statuses.map(s=><button key={s} onClick={()=>setStatusFilter(s)} className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusFilter===s?'bg-brand-600 text-white':'text-slate-600 hover:bg-slate-100'}`}>{s}</button>)}</div></div></div><div className="overflow-hidden rounded-lg border border-slate-200"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/60 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Action</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(e=><tr key={e.id}><td className="px-4 py-3"><p className="font-medium text-slate-900">{e.action}</p><p className="text-xs text-slate-400">{e.detail}</p></td><td className="px-4 py-3"><p className="text-slate-700">{e.user}</p><p className="text-xs text-slate-400">{e.role}</p></td><td className="px-4 py-3 text-slate-500"><p>{e.date}</p><p className="text-xs text-slate-400">{e.timestamp}</p></td><td className="px-4 py-3"><StatusBadge status={e.status}/></td></tr>)}</tbody></table></div>{!loading&&!filtered.length?<p className="py-8 text-center text-sm text-slate-400">No audit entries match your search.</p>:null}</div></div></div>:null}
  </div>;
}
