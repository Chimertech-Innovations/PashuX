import type { BCSResult } from '@/types';
import { getBCSProductRecommendations } from '@/utils/bcsProducts';

interface Props {
  result: BCSResult;
}

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

function scoreColor(score: number, isInvalid: boolean): string {
  if (isInvalid || score <= 0) return '#ef4444';
  if (score <= 1.5) return '#ef4444';
  if (score <= 2.0) return '#f59e0b';
  if (score <= 3.5) return '#10b981';
  if (score <= 4.0) return '#f59e0b';
  return '#ef4444';
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
  const pct    = isInvalid || result.bcs_score <= 0 ? 0 : ((result.bcs_score - 1) / 4);
  const dash   = circ * Math.max(0, Math.min(1, pct));

  const recData = getBCSProductRecommendations(result.bcs_score, []);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Score + condition */}
      <div className="glass-card p-8 border border-slate-300 bg-white relative overflow-hidden shadow-md rounded-3xl">
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
              <span className="text-[10px] text-slate-900 font-black tracking-wider uppercase mt-0.5">
                {isInvalid ? 'Invalid' : 'OF 5.0 SCALE'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="section-label mb-1.5 text-slate-900 font-black">BCS DIAGNOSTIC RESULT</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{result.condition}</h2>
            <span className={scoreConditionBadge(result.bcs_score, isInvalid)}>{result.condition}</span>

            {/* Confidence metric bar */}
            <div className="mt-5 max-w-sm">
              <div className="flex items-center justify-between text-xs mb-1.5 font-black text-slate-900">
                <span>AI System Confidence</span>
                <span className="text-emerald-700 font-black">{Math.round(result.confidence * 100)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-300">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-1000"
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target BCS Recommendation Rule Callout */}
      {!isInvalid && recData.guidance && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.5 2.25h3l.75 3h-4.5l.75-3zM3.75 9h16.5l-1.5 12h-13.5l-1.5-12z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-widest mb-1">TARGETED CLINICAL PROTOCOL</h4>
            <p className="text-sm font-black text-slate-900 leading-relaxed">{recData.guidance}</p>
          </div>
        </div>
      )}

      {/* iHerd Mobile App Callout Banner with Pristine White Background */}
      <div className="p-6 rounded-3xl bg-white border-2 border-emerald-300 text-slate-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <img src="/iherd_logo.png" alt="iHerd Logo" className="w-14 h-14 rounded-2xl object-contain bg-slate-50 p-1 border border-slate-200 shadow-sm flex-shrink-0" />
          <div className="space-y-1 text-left">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              OFFICIAL HERD MANAGEMENT APP
            </span>
            <h3 className="text-lg font-black tracking-tight text-slate-900 mt-1">Track Cattle Health on iHerd App</h3>
            <p className="text-xs font-bold text-slate-900 max-w-md">
              Record daily body condition scores, milk yields, vaccination logs, and health records directly on your phone.
            </p>
          </div>
        </div>

        <a
          href={IHERD_PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="z-10 flex-shrink-0 transition-transform hover:scale-105"
        >
          <img src="/google_play_badge.png" alt="Get it on Google Play" className="h-12 w-auto object-contain drop-shadow-sm" />
        </a>
      </div>

      {/* Observations */}
      <div className="glass-card p-6 border border-slate-300 bg-white shadow-sm rounded-3xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          Key Visual Observations
        </h3>
        <ul className="space-y-3">
          {result.observations.map((obs, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-black text-xs">
                ✓
              </div>
              <span className="text-sm text-slate-900 leading-relaxed font-bold">{obs}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6 border border-slate-300 bg-white shadow-sm rounded-3xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          Nutritional & Management Guidance
        </h3>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-emerald-800 font-black text-sm flex-shrink-0 mt-0.5">•</span>
              <span className="text-sm text-slate-900 leading-relaxed font-bold">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
