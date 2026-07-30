import type { BCSResult } from '@/types';

interface Props {
  result: BCSResult;
}

function scoreColor(score: number, isInvalid: boolean): string {
  if (isInvalid || score <= 0) return '#ef4444'; // red
  if (score <= 1.5) return '#ef4444'; // red
  if (score <= 2.0) return '#f59e0b'; // amber
  if (score <= 3.5) return '#10b981'; // emerald green
  if (score <= 4.0) return '#f59e0b'; // amber
  return '#ef4444';                   // red (obese)
}

function scoreConditionBadge(score: number, isInvalid: boolean) {
  if (isInvalid || score <= 0) return 'badge-red';
  if (score <= 1.5) return 'badge-red';
  if (score <= 2.0) return 'badge-amber';
  if (score <= 3.5) return 'badge-green';
  if (score <= 4.0) return 'badge-amber';
  return 'badge-red';
}

export default function BCSResultCard({ result }: Props) {
  const isInvalid = result.confidence === 0 || result.bcs_score <= 0 || result.condition.toLowerCase().includes('invalid') || result.condition.toLowerCase().includes('inadequate');
  const color  = scoreColor(result.bcs_score, isInvalid);
  const radius = 42;
  const circ   = 2 * Math.PI * radius;
  const pct    = isInvalid || result.bcs_score <= 0 ? 0 : ((result.bcs_score - 1) / 4);  // 1-5 → 0-1
  const dash   = circ * Math.max(0, Math.min(1, pct));

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Score + condition - Pristine White & Emerald Card */}
      <div className="glass-card p-8 border border-slate-200 bg-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
          {/* Donut score */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle
                cx="50" cy="50" r={radius} fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight" style={{ color }}>
                {isInvalid || result.bcs_score <= 0 ? 'N/A' : result.bcs_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">
                {isInvalid ? 'Invalid' : 'OF 5'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="section-label mb-1.5">BCS RESULT</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{result.condition}</h2>
            <span className={scoreConditionBadge(result.bcs_score, isInvalid)}>{result.condition}</span>

            {/* Confidence metric bar */}
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-slate-600">Vision System Confidence</span>
                <span className="text-emerald-600 font-extrabold">{Math.round(result.confidence * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="glass-card p-6 border border-slate-200 bg-white shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Key Visual Observations
        </h3>
        <ul className="space-y-3">
          {result.observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                ✓
              </div>
              <span className="text-sm text-slate-800 leading-relaxed font-semibold">{obs}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6 border border-slate-200 bg-white shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Nutritional & Management Guidance
        </h3>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
              <span className="text-emerald-700 font-extrabold text-sm flex-shrink-0 mt-0.5">•</span>
              <span className="text-sm text-slate-800 leading-relaxed font-semibold">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
