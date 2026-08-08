import type { ReactNode } from 'react';
import type { DiseaseResult } from '@/types';
import AIDisclaimerFooter from '@/components/ui/AIDisclaimerFooter';

interface Props {
  result: DiseaseResult;
}

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

const SEVERITY_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  None:     { label: 'None',     badge: 'badge-green',  color: 'text-emerald-800' },
  Mild:     { label: 'Mild',     badge: 'badge-grey',   color: 'text-slate-900' },
  Moderate: { label: 'Moderate', badge: 'badge-amber',  color: 'text-amber-900' },
  Severe:   { label: 'Severe',   badge: 'badge-red',    color: 'text-rose-900' },
};

const URGENCY_CONFIG: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  monitoring: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-slate-900">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-slate-900',
    bg: 'bg-slate-100 border-slate-300'
  },
  'veterinary consultation recommended': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-amber-800">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    color: 'text-amber-950',
    bg: 'bg-amber-100/90 border-amber-300'
  },
  'urgent veterinary attention': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-rose-800">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.5 2.25h3l.75 3h-4.5l.75-3zM3.75 9h16.5l-1.5 12h-13.5l-1.5-12z" />
      </svg>
    ),
    color: 'text-rose-950',
    bg: 'bg-rose-100/90 border-rose-300'
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
      {/* Main result card */}
      <div className="glass-card p-8 bg-white border border-slate-300 shadow-md rounded-3xl">
        <p className="section-label mb-2 text-slate-900 font-black">DISEASE SCREENING RESULT</p>
        <h2 className="text-2xl font-black text-slate-900 mb-3">{result.possible_condition}</h2>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className={severity.badge}>{result.severity} Severity</span>
          {result.affected_area !== 'N/A' && (
            <span className="badge-grey text-slate-900 font-black">{result.affected_area}</span>
          )}
        </div>

        {/* Confidence metric */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5 font-black text-slate-900">
            <span>Vision System Confidence</span>
            <span className="text-emerald-700 font-black">{Math.round(result.confidence * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-300 p-0.5">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-1000"
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Urgency Alert */}
      <div className={`p-5 rounded-3xl border ${urgency.bg} shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white border border-slate-300 flex items-center justify-center shadow-sm">
            {urgency.icon}
          </div>
          <div>
            <p className="text-xs text-slate-900 font-black uppercase tracking-wider mb-0.5">Recommended Action</p>
            <p className={`text-sm font-black ${urgency.color}`}>{result.urgency}</p>
          </div>
        </div>
      </div>

      {/* iHerd Mobile App Banner with Pristine White Background */}
      <div className="p-6 rounded-3xl bg-white border-2 border-emerald-300 text-slate-900 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <img src="/iherd_logo.png" alt="iHerd Logo" className="w-14 h-14 rounded-2xl object-contain bg-slate-50 p-1 border border-slate-200 shadow-sm flex-shrink-0" />
          <div className="space-y-1 text-left">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              HERD HEALTH RECORDING
            </span>
            <h3 className="text-lg font-black tracking-tight text-slate-900 mt-1">Track Veterinary Treatments on iHerd App</h3>
            <p className="text-xs font-bold text-slate-900 max-w-md">
              Save disease screening records, schedule booster doses, and monitor individual cattle health history directly on your mobile device.
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

      {/* Visible signs */}
      {result.visible_signs.length > 0 && (
        <div className="glass-card p-6 bg-white border border-slate-300 shadow-sm rounded-3xl">
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            Visible Signs & Clinical Indicators
          </h3>
          <ul className="space-y-3">
            {result.visible_signs.map((sign, i) => (
              <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-black text-xs">
                  ✓
                </div>
                <span className="text-sm text-slate-900 leading-relaxed font-bold">{sign}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="glass-card p-6 bg-white border border-slate-300 shadow-sm rounded-3xl">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-800 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          Recommended Veterinary Steps
        </h3>
        <ol className="space-y-3">
          {result.next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black">
                {i + 1}
              </span>
              <span className="text-sm text-slate-900 leading-relaxed font-bold">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* AI Disclaimer Footer */}
      <AIDisclaimerFooter />
    </div>
  );
}
