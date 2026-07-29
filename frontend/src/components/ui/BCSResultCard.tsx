import type { BCSResult } from '@/types';

interface Props {
  result: BCSResult;
}

function scoreColor(score: number, isInvalid: boolean): string {
  if (isInvalid || score <= 0) return '#ef4444'; // red
  if (score <= 1.5) return '#ef4444'; // red
  if (score <= 2.0) return '#f59e0b'; // amber
  if (score <= 3.5) return '#22c55e'; // green
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
  const radius = 45;
  const circ   = 2 * Math.PI * radius;
  const pct    = isInvalid || result.bcs_score <= 0 ? 0 : ((result.bcs_score - 1) / 4);  // 1-5 → 0-1
  const dash   = circ * Math.max(0, Math.min(1, pct));

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Score + condition */}
      <div className="glass-card p-8 border border-white/10 relative overflow-hidden shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
          {/* Donut score */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r={radius} fill="none"
                stroke={color}
                strokeWidth="9"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)', filter: `drop-shadow(0 0 12px ${color}77)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" style={{ color }}>
                {isInvalid || result.bcs_score <= 0 ? 'N/A' : result.bcs_score.toFixed(1)}
              </span>
              <span className="text-[10px] text-grey-400 font-bold tracking-widest uppercase mt-0.5">
                {isInvalid ? 'Invalid' : 'of 5'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="section-label mb-2">BCS Result</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">{result.condition}</h2>
            <span className={scoreConditionBadge(result.bcs_score, isInvalid)}>{result.condition}</span>

            {/* Confidence */}
            <div className="mt-6 max-w-sm">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-grey-400 font-medium">AI Vision Confidence</span>
                <span className="text-emerald-400 font-bold">{Math.round(result.confidence * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden p-0.5 border border-white/[0.05]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="glass-card p-6 border border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Key Visual Observations
        </h3>
        <ul className="space-y-3">
          {result.observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]" />
              </div>
              <span className="text-sm text-grey-200 leading-relaxed font-medium">{obs}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6 border border-white/10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          Feeding & Management Recommendations
        </h3>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                  className="w-3 h-3 text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
              <span className="text-sm text-grey-200 leading-relaxed font-medium">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
