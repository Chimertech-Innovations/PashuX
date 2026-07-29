import type { BCSResult } from '@/types';

interface Props {
  result: BCSResult;
}

function scoreColor(score: number): string {
  if (score <= 1.5) return '#ef4444'; // red
  if (score <= 2.0) return '#f59e0b'; // amber
  if (score <= 3.5) return '#22c55e'; // green
  if (score <= 4.0) return '#f59e0b'; // amber
  return '#ef4444';                   // red (obese)
}

function scoreConditionBadge(score: number) {
  if (score <= 1.5) return 'badge-red';
  if (score <= 2.0) return 'badge-amber';
  if (score <= 3.5) return 'badge-green';
  if (score <= 4.0) return 'badge-amber';
  return 'badge-red';
}

export default function BCSResultCard({ result }: Props) {
  const color  = scoreColor(result.bcs_score);
  const radius = 45;
  const circ   = 2 * Math.PI * radius;
  const pct    = ((result.bcs_score - 1) / 4);  // 1-5 → 0-1
  const dash   = circ * pct;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Score + condition */}
      <div className="glass-card p-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Donut score */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r={radius} fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1.2s ease-out', filter: `drop-shadow(0 0 8px ${color}55)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white" style={{ color }}>{result.bcs_score.toFixed(1)}</span>
              <span className="text-[10px] text-grey-500 font-medium tracking-widest uppercase">of 5</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="section-label mb-2">BCS Result</p>
            <h2 className="text-heading-xl font-bold text-white mb-2">{result.condition}</h2>
            <span className={scoreConditionBadge(result.bcs_score)}>{result.condition}</span>

            {/* Confidence */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-grey-500">AI Confidence</span>
                <span className="text-grey-200 font-medium">{Math.round(result.confidence * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Key Observations</h3>
        <ul className="space-y-3">
          {result.observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-grey-200">{obs}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Feeding & Management</h3>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-sm text-grey-200">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
