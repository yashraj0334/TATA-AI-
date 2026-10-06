import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, MapPin, Tag, Eye, Filter, ArrowUpDown,
  AlertTriangle, CheckCircle2, Shield, Sparkles, ScrollText, AlertCircle,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import RiskCard from '../components/RiskCard';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { apiRequest } from '../services/api';

const RESULT_KEY = 'ldi_latest_analysis';
const DOC_KEY = 'ldi_current_document_id';
const FILTERS = ['All', 'High', 'Medium', 'Low'];
const SORTS = ['Severity', 'Confidence', 'Page'];
const SEVERITY_ORDER = { High: 3, Medium: 2, Low: 1, Unknown: 0 };

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function normaliseAnalysis(raw) {
  if (!raw) return null;
  const clauses = Array.isArray(raw.clauses) ? raw.clauses : [];
  const levels = clauses.map((c) => c.analysis?.risk_level).filter(Boolean);
  const high = levels.filter((x) => x === 'High').length;
  const medium = levels.filter((x) => x === 'Medium').length;
  const low = levels.filter((x) => x === 'Low').length;
  const unknown = levels.filter((x) => !['High', 'Medium', 'Low'].includes(x)).length;
  const known = levels.filter((x) => ['High', 'Medium', 'Low'].includes(x));
  const overall = high > 0 ? 'High' : medium > 0 ? 'Medium' : low > 0 ? 'Low' : 'Unknown';
  const confidenceValues = clauses
    .map((c) => Number(c.analysis?.confidence))
    .filter((n) => Number.isFinite(n));
  const confidence = confidenceValues.length
    ? Math.round(confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length)
    : known.length ? Math.round((known.length / Math.max(levels.length, 1)) * 100) : 0;

  const risks = clauses.map((clause, index) => {
    const a = clause.analysis || {};
    const severity = ['High', 'Medium', 'Low'].includes(a.risk_level) ? a.risk_level : 'Low';
    return {
      id: clause.clause_id || `CLAUSE-${index + 1}`,
      title: a.clause_name || clause.clause_name || `Clause ${clause.clause_no || index + 1}`,
      severity,
      confidence: Number.isFinite(Number(a.confidence)) ? Number(a.confidence) : confidence,
      evidence: clause.clause_text || 'No clause text was returned.',
      page: clause.sources?.[0]?.page ?? '—',
      clause: clause.clause_no ? `Section ${clause.clause_no}` : 'Extracted clause',
      reason: a.risk_reason || '',
      recommendation: a.recommendation || '',
    };
  });

  return {
    ...raw,
    riskSummary: raw.risk_summary || {
      overall,
      confidence,
      high,
      medium,
      low,
      unknown,
      total: risks.length,
    },
    risks,
    contractSummary: raw.contract_summary ||
      'No document-level summary was returned by the backend. Review the extracted clauses below.',
  };
}

export default function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Severity');
  const [actionLog, setActionLog] = useState([]);
  const [actionError, setActionError] = useState(null);
  const [escalateModal, setEscalateModal] = useState(null);

  const analysis = useMemo(() => {
    if (location.state?.analysis) return normaliseAnalysis(location.state.analysis);
    try {
      return normaliseAnalysis(JSON.parse(sessionStorage.getItem(RESULT_KEY) || 'null'));
    } catch {
      return null;
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.risks]
      .filter((r) => filter === 'All' || r.severity === filter)
      .sort((a, b) => {
        if (sort === 'Severity') return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
        if (sort === 'Confidence') return b.confidence - a.confidence;
        const ap = Number.isFinite(Number(a.page)) ? Number(a.page) : Number.MAX_SAFE_INTEGER;
        const bp = Number.isFinite(Number(b.page)) ? Number(b.page) : Number.MAX_SAFE_INTEGER;
        return ap - bp;
      });
  }, [analysis, filter, sort]);

  const handleAction = async (risk, key, confirmed = false) => {
    setActionError(null);
    const documentId = analysis?.document_id || sessionStorage.getItem(DOC_KEY);
    if (!documentId) { setActionError('This analysis has no document ID. Please upload the document again.'); return; }
    if (key === 'escalate' && !confirmed) { setEscalateModal(risk); return; }
    try {
      const path = `/approvals/${encodeURIComponent(risk.id)}/${key}`;
      const result = await apiRequest('POST', path, { body: { document_id: documentId, reviewer: 'Legal Reviewer' } });
      setActionLog((log) => [...log, { risk: risk.title, action: key, id: Date.now(), status: result.status }]);
    } catch (e) { setActionError(e.message || 'Could not save the review action.'); }
  };

  if (!analysis) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="No analysis available" subtitle="Upload a PDF to generate a real analysis." icon={ShieldCheck} />
        <div className="card p-6">
          <div className="flex items-start gap-3 text-amber-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">There is no uploaded-document result in this browser session.</p>
          </div>
          <Button className="mt-5" onClick={() => navigate('/upload')}>Upload Document</Button>
        </div>
      </div>
    );
  }

  const { riskSummary, risks, contractSummary } = analysis;
  const overallStyle =
    riskSummary.overall === 'High' ? 'from-rose-500 to-rose-600' :
    riskSummary.overall === 'Medium' ? 'from-amber-500 to-amber-600' :
    riskSummary.overall === 'Low' ? 'from-emerald-500 to-emerald-600' :
    'from-slate-500 to-slate-600';
  const metadata = analysis.metadata || {};
  const typeLabel = metadata.documentType || 'Legal Document';
  const jurisdiction = metadata.jurisdiction || 'Not specified';

  return (
    <div>
      <PageHeader
        title="Contract Review"
        subtitle="AI-extracted clauses, risk analysis, and recommended actions from the uploaded document."
        icon={ShieldCheck}
        actions={
          <>
            <Button variant="secondary" icon={ScrollText}>Export Report</Button>
            <Button variant="primary" icon={CheckCircle2}>Mark Reviewed</Button>
          </>
        }
      />

      <div className="card mb-6 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{analysis.filename}</h2>
              <p className="text-sm text-slate-500">{risks.length} clauses analyzed · Real backend result</p>
            </div>
          </div>
          <StatusBadge status="Under Review" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaItem icon={Tag} label="Document Type" value={typeLabel} />
          <MetaItem icon={MapPin} label="Jurisdiction" value={jurisdiction} />
          <MetaItem icon={Eye} label="Review Status" value="Under Review" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card mb-6 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-semibold text-slate-700">Contract Summary</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">AI Generated</span>
            </div>
            <p className="font-serif text-[15px] leading-relaxed text-slate-700">{contractSummary}</p>
          </div>

          {actionError ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</div> : null}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Risk Analysis</h3>
              <p className="text-sm text-slate-500">{filtered.length} of {risks.length} findings shown</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
                <Filter className="ml-1.5 h-3.5 w-3.5 text-slate-400" />
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent text-xs font-medium text-slate-600 focus:outline-none">
                  {SORTS.map((s) => <option key={s} value={s}>Sort: {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((risk) => <RiskCard key={risk.id} risk={risk} onAction={handleAction} />)}
          </div>
          {filtered.length === 0 && <div className="card p-8 text-center text-sm text-slate-500">No risks match the selected filter.</div>}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="card overflow-hidden">
              <div className={`bg-gradient-to-br ${overallStyle} p-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Overall Risk</p>
                    <p className="mt-1 text-3xl font-bold">{riskSummary.overall}</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-white/70" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>AI Confidence</span>
                    <span className="font-semibold text-white">{riskSummary.confidence}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white" style={{ width: `${riskSummary.confidence}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Risk Breakdown</h3>
              <div className="space-y-3">
                {[
                  ['High Risks', riskSummary.high, 'bg-rose-50', 'text-rose-600', 'text-rose-700'],
                  ['Medium Risks', riskSummary.medium, 'bg-amber-50', 'text-amber-600', 'text-amber-700'],
                  ['Low Risks', riskSummary.low, 'bg-emerald-50', 'text-emerald-600', 'text-emerald-700'],
                ].map(([label, value, bgClass, iconClass, textClass]) => (
                  <div key={label} className={`flex items-center justify-between rounded-lg ${bgClass} px-3 py-2.5`}>
                    <div className="flex items-center gap-2"><Shield className={`h-4 w-4 ${iconClass}`} /><span className={`text-sm font-medium ${textClass}`}>{label}</span></div>
                    <span className={`text-lg font-bold ${textClass}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Your Actions</h3>
              {actionLog.length === 0 ? (
                <p className="text-sm text-slate-400">No actions taken yet.</p>
              ) : (
                <div className="space-y-2">
                  {actionLog.slice(-4).reverse().map((log) => (
                    <div key={log.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-700"><span className="font-medium capitalize">{log.action}</span> · {log.risk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button to="/audit" variant="secondary" className="w-full" icon={ScrollText}>View Audit History</Button>
          </div>
        </div>
      </div>

      <Modal
        open={!!escalateModal}
        onClose={() => setEscalateModal(null)}
        title="Escalate Risk"
        footer={<><Button variant="secondary" onClick={() => setEscalateModal(null)}>Cancel</Button><Button variant="danger" onClick={async () => { const risk = escalateModal; setEscalateModal(null); await handleAction(risk, 'escalate', true); }}>Confirm Escalation</Button></>}
      >
        {escalateModal && (
          <div>
            <div className="mb-4 flex items-center gap-3"><RiskBadge level={escalateModal.severity} /><p className="font-semibold text-slate-900">{escalateModal.title}</p></div>
            <p className="text-sm text-slate-600">This risk will be escalated to the Legal Head for review.</p>
            <div className="mt-4"><label className="mb-1.5 block text-sm font-medium text-slate-700">Add a note (optional)</label><textarea rows={3} placeholder="Explain why this risk is being escalated..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100" /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
