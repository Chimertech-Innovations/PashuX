import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory } from '@/lib/api';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

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
      <div className="min-h-screen pt-24 pb-24 px-6 flex items-center justify-center">
        <div className="text-center glass-card p-12 max-w-md mx-auto">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-heading-xl font-bold text-white mb-3">Sign in to view history</h2>
          <p className="text-grey-500 text-sm mb-6">Your analysis history is stored securely and linked to your account.</p>
          <Link to="/auth" className="btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 animate-fade-up">
          <p className="section-label mb-3">Your Data</p>
          <h1 className="text-display font-black text-white mb-3">Analysis History</h1>
          <p className="text-grey-400 text-sm">View all your past cattle analyses and results.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : history.length === 0 ? (
          <div className="glass-card p-16 text-center animate-fade-in">
            <p className="text-5xl mb-5">📋</p>
            <h3 className="text-heading font-bold text-white mb-2">No analyses yet</h3>
            <p className="text-grey-500 text-sm mb-8">Upload a cattle video to get started with your first analysis.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/bcs" className="btn-primary">BCS Detection</Link>
              <Link to="/disease" className="btn-secondary">Disease Detection</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item: any) => {
              const result = item.analysis_results?.[0];
              const isBCS  = item.analysis_type === 'bcs';
              return (
                <div key={item.id} className="glass-card-hover p-6 flex flex-col sm:flex-row sm:items-center gap-5 animate-fade-up">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isBCS ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                    <span className="text-2xl">{isBCS ? '📊' : '🩺'}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isBCS ? 'text-green-400' : 'text-amber-400'}`}>
                        {isBCS ? 'BCS Detection' : 'Disease Detection'}
                      </span>
                      <span className={`
                        text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${item.processing_status === 'completed' ? 'badge-green' :
                          item.processing_status === 'failed'    ? 'badge-red'   : 'badge-grey'}
                      `}>
                        {item.processing_status}
                      </span>
                    </div>
                    {result && (
                      <p className="text-sm font-medium text-white truncate">
                        {isBCS
                          ? `BCS ${result.bcs_score?.toFixed(1)} — ${result.result_json?.condition}`
                          : result.result_json?.possible_condition}
                      </p>
                    )}
                    <p className="text-xs text-grey-600 mt-1">{formatDate(item.created_at)}</p>
                  </div>

                  {/* Confidence */}
                  {result?.confidence && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-grey-500 mb-1">Confidence</p>
                      <p className="text-sm font-bold text-white">{Math.round(result.confidence * 100)}%</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
