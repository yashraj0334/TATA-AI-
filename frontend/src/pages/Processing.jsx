import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Sparkles, Cpu, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProgressStep from '../components/ProgressStep';
import Button from '../components/Button';
import { processingSteps } from '../data/mockData';

const RESULT_KEY = 'ldi_latest_analysis';
const DOC_KEY = 'ldi_current_document_id';

export default function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadResult = location.state?.uploadResult;
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const result = useMemo(() => {
    if (uploadResult) return uploadResult;
    try {
      return JSON.parse(sessionStorage.getItem(RESULT_KEY) || 'null');
    } catch {
      return null;
    }
  }, [uploadResult]);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
      if (result.document_id) sessionStorage.setItem(DOC_KEY, result.document_id);
    }
  }, [result]);

  useEffect(() => {
    if (!result || currentStep >= processingSteps.length) return undefined;
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), 500);
    return () => clearTimeout(timer);
  }, [currentStep, result]);

  useEffect(() => {
    const target = (currentStep / processingSteps.length) * 100;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= target) return p;
        return Math.min(p + 2, target);
      });
    }, 20);
    return () => clearInterval(interval);
  }, [currentStep]);

  const done = currentStep >= processingSteps.length;
  const fileName = result?.filename || 'Uploaded document';
  const clauseCount = result?.clauses?.length || 0;
  const riskCount = result?.risk_summary?.total ?? clauseCount;

  const getState = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep && !done) return 'processing';
    return 'pending';
  };

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="No document to process" subtitle="Upload a document first." icon={Cpu} />
        <div className="card p-6">
          <div className="flex items-start gap-3 text-amber-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">The analysis result is missing. Please upload the PDF again.</p>
          </div>
          <Button to="/upload" className="mt-5">Back to Upload</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Analyzing Document"
        subtitle="The backend has processed this uploaded document. This screen shows the processing stages before the real results are displayed."
        icon={Cpu}
      />

      <div className="card mb-6 flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{fileName}</p>
          <p className="text-sm text-slate-500">{clauseCount} clauses analyzed · {riskCount} risk findings</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-600">{Math.round(progress)}%</p>
          <p className="text-xs text-slate-400">{done ? 'Complete' : 'Processing'}</p>
        </div>
      </div>

      <div className="card mb-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Overall progress</span>
          <span className="font-semibold text-brand-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-slate-700">Processing Pipeline</h3>
        </div>
        <div className="mt-4">
          {processingSteps.map((step, i) => (
            <ProgressStep key={step.id} step={step} index={i} total={processingSteps.length} state={getState(i)} />
          ))}
        </div>
      </div>

      {done ? (
        <div className="mt-6 flex animate-fade-in flex-col items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900">Analysis complete</p>
              <p className="text-sm text-emerald-700">{riskCount} risk findings from the uploaded document</p>
            </div>
          </div>
          <Button onClick={() => navigate('/review', { state: { analysis: result } })} icon={ArrowRight} size="lg" variant="success" className="w-full sm:w-auto">
            View Analysis
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          Preparing analysis view...
        </div>
      )}
    </div>
  );
}
