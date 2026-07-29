import type { DiseaseResult } from '@/types';

interface Props {
  result: DiseaseResult;
}

const SEVERITY_CONFIG: Record<string, { label: string; badge: string; color: string }> = {
  None:     { label: 'None',     badge: 'badge-green',  color: 'text-green-400' },
  Mild:     { label: 'Mild',     badge: 'badge-grey',   color: 'text-grey-300' },
  Moderate: { label: 'Moderate', badge: 'badge-amber',  color: 'text-amber-400' },
  Severe:   { label: 'Severe',   badge: 'badge-red',    color: 'text-red-400' },
};

const URGENCY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  monitoring:                              { icon: '👁', color: 'text-grey-300', bg: 'bg-white/[0.04]' },
  'veterinary consultation recommended':   { icon: '🩺', color: 'text-amber-400', bg: 'bg-amber-500/[0.08]' },
  'urgent veterinary attention':           { icon: '🚨', color: 'text-red-400',   bg: 'bg-red-500/[0.08]' },
};

export default function DiseaseResultCard({ result }: Props) {
  const severity = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.Mild;
  const urgencyKey = Object.keys(URGENCY_CONFIG).find(k =>
    result.urgency.toLowerCase().includes(k.toLowerCase())
  ) || 'monitoring';
  const urgency = URGENCY_CONFIG[urgencyKey];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Main result */}
      <div className="glass-card p-8">
        <p className="section-label mb-3">Screening Result</p>
        <h2 className="text-heading-xl font-bold text-white mb-3">{result.possible_condition}</h2>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className={severity.badge}>{result.severity} Severity</span>
          {result.affected_area !== 'N/A' && (
            <span className="badge-grey">{result.affected_area}</span>
          )}
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-grey-500">AI Confidence</span>
            <span className="text-grey-200 font-medium">{Math.round(result.confidence * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Urgency */}
      <div className={`p-5 rounded-2xl border border-white/[0.06] ${urgency.bg}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{urgency.icon}</span>
          <div>
            <p className="text-xs text-grey-500 mb-0.5">Recommended Action</p>
            <p className={`text-sm font-semibold ${urgency.color}`}>{result.urgency}</p>
          </div>
        </div>
      </div>

      {/* Visible signs */}
      {result.visible_signs.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Visible Signs Detected</h3>
          <ul className="space-y-3">
            {result.visible_signs.map((sign, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                <span className="text-sm text-grey-200">{sign}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Recommended Next Steps</h3>
        <ol className="space-y-3">
          {result.next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-grey-300">
                {i + 1}
              </span>
              <span className="text-sm text-grey-200">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
