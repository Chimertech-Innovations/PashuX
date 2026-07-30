import type { ReactNode } from 'react';
import type { DiseaseResult } from '@/types';

interface Props {
  result: DiseaseResult;
}

const SEVERITY_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  None:     { label: 'None',     badge: 'badge-green',  color: 'text-emerald-700' },
  Mild:     { label: 'Mild',     badge: 'badge-grey',   color: 'text-slate-700' },
  Moderate: { label: 'Moderate', badge: 'badge-amber',  color: 'text-amber-700' },
  Severe:   { label: 'Severe',   badge: 'badge-red',    color: 'text-rose-700' },
};

const URGENCY_CONFIG: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  monitoring: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-slate-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-slate-800',
    bg: 'bg-slate-50 border-slate-200'
  },
  'veterinary consultation recommended': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-amber-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-200'
  },
  'urgent veterinary attention': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-rose-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.5 2.25h3l.75 3h-4.5l.75-3zM3.75 9h16.5l-1.5 12h-13.5l-1.5-12z" />
      </svg>
    ),
    color: 'text-rose-800',
    bg: 'bg-rose-50 border-rose-200'
  },
};

export default function DiseaseResultCard({ result }: Props) {
  const severity = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Mild;
  const urgencyKey = Object.keys(URGENCY_CONFIG).find(k =>
    result.urgency.toLowerCase().includes(k.toLowerCase())
  ) || 'monitoring';
  const urgency = URGENCY_CONFIG[urgencyKey];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Main result card - Pristine White */}
      <div className="glass-card p-8 bg-white border border-slate-200 shadow-sm">
        <p className="section-label mb-2">Screening Result</p>
        <h2 className="text-2xl font-black text-slate-900 mb-3">{result.possible_condition}</h2>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className={severity.badge}>{result.severity} Severity</span>
          {result.affected_area !== 'N/A' && (
            <span className="badge-grey">{result.affected_area}</span>
          )}
        </div>

        {/* Confidence metric */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-600">Vision System Confidence</span>
            <span className="text-slate-900 font-extrabold">{Math.round(result.confidence * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Urgency Alert */}
      <div className={`p-5 rounded-2xl border ${urgency.bg}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-center">
            {urgency.icon}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Recommended Action</p>
            <p className={`text-sm font-extrabold ${urgency.color}`}>{result.urgency}</p>
          </div>
        </div>
      </div>

      {/* Visible signs */}
      {result.visible_signs.length > 0 && (
        <div className="glass-card p-6 bg-white border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Visible Signs & Clinical Indicators
          </h3>
          <ul className="space-y-3">
            {result.visible_signs.map((sign, i) => (
              <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <span className="text-sm text-slate-800 leading-relaxed font-semibold">{sign}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="glass-card p-6 bg-white border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Recommended Veterinary Steps
        </h3>
        <ol className="space-y-3">
          {result.next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black">
                {i + 1}
              </span>
              <span className="text-sm text-slate-800 leading-relaxed font-semibold">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
