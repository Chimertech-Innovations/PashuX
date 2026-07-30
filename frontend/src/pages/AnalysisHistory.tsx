import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory } from '@/lib/api';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { generateHealthReportPDF } from '@/utils/pdfGenerator';


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AnalysisHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getHistory(user.id)
      .then(res => setHistory((res as any).history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-slate-50">
        <div className="text-center glass-card p-12 max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5 border border-emerald-200 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Sign in to view history</h2>
          <p className="text-slate-700 text-sm font-bold mb-8 leading-relaxed">
            Your analysis history is stored securely and linked to your Chimertech account.
          </p>
          <Link to="/auth" className="btn-primary px-8 py-3.5 text-sm font-extrabold shadow-md">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 animate-fade-up">
          <p className="section-label mb-2">Your Data</p>
          <h1 className="text-display font-black text-slate-900 mb-2">Analysis History</h1>
          <p className="text-slate-700 text-sm font-bold">View all your past cattle analyses and results.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card p-16 text-center animate-fade-in bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-5 border border-slate-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No analyses yet</h3>
            <p className="text-slate-700 text-sm font-bold mb-8">Upload a cattle photo or video to get started with your first analysis.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/live" className="btn-primary py-3 px-6 text-xs font-black">Live 10s Scan</Link>
              <Link to="/bcs" className="btn-secondary py-3 px-6 text-xs font-bold">BCS Detection</Link>
              <Link to="/disease" className="btn-secondary py-3 px-6 text-xs font-bold">Disease Detection</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item: any) => {
              const result = item.analysis_results?.[0];
              const isBCS  = item.analysis_type === 'bcs';
              return (
                <div key={item.id} className="glass-card-hover p-6 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-5 animate-fade-up shadow-sm">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isBCS ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                    {isBCS ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-black ${isBCS ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {isBCS ? 'BCS Detection' : 'Disease Detection'}
                      </span>
                      <span className={`
                        text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                        ${item.processing_status === 'completed' ? 'badge-green' :
                          item.processing_status === 'failed'    ? 'badge-red'   : 'badge-grey'}
                      `}>
                        {item.processing_status}
                      </span>
                    </div>
                    {result && (
                      <p className="text-sm font-extrabold text-slate-900 truncate">
                        {isBCS
                          ? `BCS ${result.bcs_score?.toFixed(1)} — ${result.result_json?.condition || 'Evaluated'}`
                          : result.result_json?.possible_condition}
                      </p>
                    )}
                    <p className="text-xs font-bold text-slate-500 mt-1">{formatDate(item.created_at)}</p>
                  </div>

                  {/* PDF Download Button */}
                  <button
                    onClick={() => {
                      const resJson = result?.result_json || {};
                      generateHealthReportPDF({
                        requestId: item.id,
                        userEmail: user?.email,
                        date: formatDate(item.created_at),
                        analysisType: item.analysis_type,
                        bcsScore: result?.bcs_score ?? resJson.bcs_score,
                        bcsConfidence: result?.confidence ?? resJson.confidence,
                        possibleCondition: result?.possible_condition ?? resJson.possible_condition,
                        diseaseConfidence: result?.confidence ?? resJson.confidence,
                        severity: result?.severity ?? resJson.severity,
                        observations: result?.observations || resJson.observations || resJson.visible_signs,
                        recommendations: result?.recommendations || resJson.recommendations || resJson.next_steps,
                        aiSuggestions: resJson.ai_summary || resJson.condition,
                      });
                    }}
                    className="btn-secondary py-2 px-3.5 text-xs font-black flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <span>📄</span> PDF
                  </button>
                </div>
              );
            })}

          </div>
        )}
      </div>
    </div>
  );
}
