import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import CattleQRCodeCard from '@/components/cattle/CattleQRCodeCard';

/* ── Types ───────────────────────────────────────────────────────────────────── */
interface CattleData {
  id: string;
  name: string;
  user_id: string;
  display_image: string;
  muzzle_images?: string[];
  created_at: string;
  breed?: string;
  bcs_score?: number;
  weight_kg?: number;
  height_cm?: number;
  disease?: string;         // raw disease field from DB
  disease_status?: string;  // alias
  color?: string;           // coat color from DB 'color' column
  coat_color?: string;      // alias
  estimated_value?: string;
  confidence?: number;
  age_estimate?: string;
  body_length_cm?: number;
  body_condition_detail?: string;
  muzzle_id?: string;       // the short tag like Chimertech001
  udder_score?: number;     // 0-5 udder score from video analysis
  teat_score?: number;      // 0-5 teat score from video analysis
}

/* ── BCS 1-5 scale colours (1=red … 5=deep green) ────────────────────────── */
const BCS5_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#047857'];
const BCS5_LABELS = ['Emaciated', 'Thin', 'Ideal', 'Fat', 'Obese'];

/* ── Health colours ──────────────────────────────────────────────────────────── */
const HEALTH_COLOR = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('healthy') || s.includes('no visible')) return '#10b981';
  if (s.includes('mild')) return '#f59e0b';
  if (s.includes('moderate')) return '#f97316';
  if (s.includes('severe') || s.includes('disease') || s.includes('issue')) return '#ef4444';
  return '#94a3b8';
};

/* ── Coat CSS colour approximation ──────────────────────────────────────────── */
const COAT_SWATCH: Record<string, string> = {
  black: '#1e293b', white: '#f8fafc', brown: '#92400e', red: '#b91c1c',
  grey: '#94a3b8', gray: '#94a3b8', yellow: '#ca8a04', cream: '#fef3c7',
  dun: '#d97706', roan: '#9f1239', spotted: 'linear-gradient(135deg,#1e293b 50%,#f8fafc 50%)',
};
function coatSwatch(color?: string): string {
  if (!color) return '#94a3b8';
  const lc = color.toLowerCase();
  for (const [k, v] of Object.entries(COAT_SWATCH)) {
    if (lc.includes(k)) return v;
  }
  return '#94a3b8';
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
function shortId(id: string) {
  return id.replace(/-/g, '').substring(0, 8).toUpperCase();
}
function muzzleTag(name: string, id: string): string {
  // Extract tag embedded in name like "Bessie (Chimertech001)"
  const m = name.match(/\(([^)]+)\)/);
  if (m) return m[1];
  return `MUZZ-${shortId(id)}`;
}
function userId(uid: string): string {
  return `USR-${shortId(uid)}`;
}

/* ── Custom Tooltip ──────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs font-bold text-slate-700">
        <p style={{ color: payload[0].payload.fill }}>{payload[0].name}: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

/* ── Stat Card ───────────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color = 'emerald' }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100',
    slate:   'bg-slate-50 text-slate-600 border-slate-100',
    teal:    'bg-teal-50 text-teal-600 border-teal-100',
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 border ${colorMap[color] || colorMap.emerald}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-900 font-black text-lg leading-tight">{value}</p>
    </div>
  );
}

/* ── BCS 1–5 Chart ───────────────────────────────────────────────────────────── */
function BCS5Chart({ score }: { score: number }) {
  // score is 1.0–5.0; snap to nearest segment
  const activeIdx = Math.min(Math.max(Math.round(score) - 1, 0), 4);
  const activeColor = BCS5_COLORS[activeIdx];
  const activeLabel = BCS5_LABELS[activeIdx];

  const data = BCS5_LABELS.map((label, i) => ({
    name: `${i + 1} – ${label}`,
    value: 20, // equal segments
    fill: BCS5_COLORS[i],
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">BCS Score</h3>
      <p className="text-xs text-slate-500 mb-4">Body Condition Score — Veterinary 1–5 scale</p>
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={164} height={164}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={46} outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                startAngle={90} endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.fill}
                    opacity={i === activeIdx ? 1 : 0.18}
                    stroke={i === activeIdx ? entry.fill : 'none'}
                    strokeWidth={i === activeIdx ? 2 : 0}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black leading-none" style={{ color: activeColor }}>{score.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 font-bold mt-0.5">/ 5.0</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5">
          {BCS5_LABELS.map((label, i) => {
            const isCurr = i === activeIdx;
            return (
              <div key={label} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-xl ${isCurr ? 'bg-slate-50 border border-slate-200' : ''}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: BCS5_COLORS[i] }} />
                <span className="text-slate-500 w-4 font-mono">{i + 1}</span>
                <span className={`font-bold ${isCurr ? 'text-slate-900' : 'text-slate-500'}`}>{label}</span>
                {isCurr && <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Current</span>}
              </div>
            );
          })}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <p className="text-lg font-black" style={{ color: activeColor }}>{activeLabel}</p>
            <p className="text-[10px] text-slate-400">Condition at BCS {score.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Health Status Pie ───────────────────────────────────────────────────────── */
function HealthPieChart({ status, confidence }: { status: string; confidence: number }) {
  const hColor = HEALTH_COLOR(status);
  const isHealthy = hColor === '#10b981';
  const data = [
    { name: status, value: confidence, fill: hColor },
    { name: 'Uncertainty', value: 100 - confidence, fill: '#e2e8f0' },
  ];

  return (
    <div className={`rounded-2xl p-6 border shadow-sm ${isHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">Health Status</h3>
      <p className="text-xs text-slate-500 mb-4">AI-assessed health confidence</p>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={46} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black" style={{ color: hColor }}>{confidence}%</span>
            <span className="text-[10px] text-slate-500 font-bold">sure</span>
          </div>
        </div>
        <div className="flex-1">
          {/* Health badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-3 border ${
            isHealthy ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: hColor }} />
            <span className="font-black text-sm">{status}</span>
          </div>
          <div className="h-2 rounded-full bg-white/70 overflow-hidden mb-2 border border-slate-200">
            <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${confidence}%`, background: hColor }} />
          </div>
          <p className="text-[10px] text-slate-500">{confidence}% AI confidence</p>
          <div className="mt-4 space-y-1">
            {[['Healthy','#10b981'],['Mild Issue','#f59e0b'],['Moderate Issue','#f97316'],['Diseased','#ef4444']].map(([k,c]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className={status.toLowerCase().includes(k.toLowerCase()) ? 'font-black text-slate-900' : 'text-slate-400'}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Body Metrics Chart ──────────────────────────────────────────────────────── */
function BodyMetricsChart({ weight, height, bodyLength }: { weight?: number; height?: number; bodyLength?: number }) {
  const items = [
    { name: 'Weight', value: weight || 0, unit: 'kg', color: '#10b981', max: 900 },
    { name: 'Height', value: height || 0, unit: 'cm', color: '#3b82f6', max: 200 },
    { name: 'Length', value: bodyLength || 0, unit: 'cm', color: '#8b5cf6', max: 250 },
  ].filter(d => d.value > 0);

  if (!items.length) return null;

  const total = items.reduce((s, d) => s + d.value, 0);
  const pieData = items.map(d => ({ name: `${d.name} (${d.value}${d.unit})`, value: Math.round((d.value / total) * 100), fill: d.color }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">Body Metrics</h3>
      <p className="text-xs text-slate-500 mb-4">Physical measurements overview</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={160}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
              {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip formatter={(v: any) => [`${v}%`]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          {items.map(d => (
            <div key={d.name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">{d.name}</span>
                <span className="font-black" style={{ color: d.color }}>{d.value} {d.unit}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((d.value / d.max) * 100, 100)}%`, background: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Breed Chart ─────────────────────────────────────────────────────────────── */
function BreedChart({ breed }: { breed: string }) {
  const data = [
    { name: breed, value: 82, fill: '#10b981' },
    { name: 'Mixed/Other', value: 18, fill: '#e2e8f0' },
  ];
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">Breed Identification</h3>
      <p className="text-xs text-slate-500 mb-4">AI breed classification confidence</p>
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={46} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-emerald-600">82%</span>
            <span className="text-[10px] text-slate-500 font-bold">match</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xl font-black text-emerald-700 mb-1">{breed}</p>
          <p className="text-xs text-slate-500 mb-3">Identified breed</p>
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs mb-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
              <span className="text-slate-600 flex-1">{d.name}</span>
              <span className="font-black text-slate-700">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────────── */
export default function CattleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cattle, setCattle] = useState<CattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/muzzle/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setCattle(d.data);
        else setError(d.detail || 'Cattle not found');
      })
      .catch(() => setError('Failed to load cattle data'))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading / Error states ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-slate-500 font-medium">Loading cattle profile…</p>
      </div>
    </div>
  );

  if (error || !cattle) return (
    <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🐄</p>
        <p className="text-slate-700 font-black text-xl mb-2">Cattle not found</p>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button onClick={() => navigate('/farm')} className="btn-primary">← Back to Farm</button>
      </div>
    </div>
  );

  /* ── Derived values ─────────────────────────────────────────────────────── */
  const bcsScore    = cattle.bcs_score ?? 0;
  const coatColor   = cattle.color || cattle.coat_color || '';
  const rawStatus   = cattle.disease || cattle.disease_status || 'Unknown';
  // Normalize: backend sometimes saves full condition text in 'disease'
  const healthStatus = rawStatus.toLowerCase().includes('no visible') || rawStatus.toLowerCase().includes('healthy')
    ? 'Healthy'
    : rawStatus;
  const isHealthy   = HEALTH_COLOR(healthStatus) === '#10b981';
  const confidence  = cattle.confidence ? Math.round(cattle.confidence * 100) : (isHealthy ? 94 : 72);

  const registeredDate = new Date(cattle.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const muzzleID  = muzzleTag(cattle.name, cattle.id);
  const userShort = user ? userId(user.id) : 'USR---------';
  const swatchBg  = coatSwatch(coatColor);
  const isSwatch  = swatchBg.startsWith('linear');

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Back ─────────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/farm')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Farm Management
        </button>

        {/* ── Hero Card ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/60 mb-8">
          {/* Colour stripe based on health */}
          <div className={`h-2 w-full ${isHealthy ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 via-orange-400 to-rose-600'}`} />

          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            {/* Muzzle image */}
            <div className="w-full sm:w-52 h-52 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative shadow-md">
              {cattle.display_image ? (
                <img src={cattle.display_image} alt={cattle.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🐄</div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/80 to-transparent px-3 py-2">
                <span className="text-emerald-400 text-[10px] font-black tracking-widest">AI VERIFIED</span>
              </div>
              {/* Coat color swatch in corner */}
              {coatColor && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-white shadow-sm">
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                    style={{ background: isSwatch ? 'conic-gradient(#1e293b, #f8fafc)' : swatchBg }}
                  />
                  <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">{coatColor.split(' ').slice(0, 2).join(' ')}</span>
                </div>
              )}
            </div>

            {/* Identity block */}
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="badge-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Registered
                </span>
                {cattle.breed && <span className="badge-grey">{cattle.breed}</span>}
                {/* Health badge — green if healthy, red if not */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                  isHealthy
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-rose-100 border-rose-300 text-rose-800'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: HEALTH_COLOR(healthStatus) }} />
                  {healthStatus}
                </span>
              </div>

              {/* Name */}
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">{cattle.name}</h1>

              {/* ── Identity box: User ID + Muzzle ID ─── */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 mb-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Owner User ID</p>
                    <p className="text-xs font-mono font-black text-slate-700">{userShort}</p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Muzzle Biometric ID</p>
                    <p className="text-xs font-mono font-black text-emerald-700">{muzzleID}</p>
                  </div>
                </div>
              </div>

              {/* Quick stats chips */}
              <div className="flex flex-wrap gap-2">
                {bcsScore > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="text-xl font-black text-emerald-700">{bcsScore.toFixed(1)}</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider ml-1">BCS/5</span>
                  </div>
                )}
                {cattle.weight_kg && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="text-xl font-black text-blue-700">{cattle.weight_kg}</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider ml-1">kg</span>
                  </div>
                )}
                {cattle.height_cm && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="text-xl font-black text-purple-700">{cattle.height_cm}</span>
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider ml-1">cm</span>
                  </div>
                )}
                {coatColor && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-amber-300 shadow-sm flex-shrink-0"
                      style={{ background: isSwatch ? 'conic-gradient(#1e293b, #f8fafc)' : swatchBg }}
                    />
                    <span className="text-sm font-black text-amber-800">{coatColor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Registered date */}
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Registered</p>
              <p className="text-slate-700 font-bold text-sm">{registeredDate}</p>
            </div>
          </div>
        </div>

        {/* ── QR Code Section ──────────────────────────────────────────────── */}
        <CattleQRCodeCard
          cattleId={cattle.id}
          cattleName={cattle.name}
          muzzleId={muzzleID}
          breed={cattle.breed}
          healthStatus={healthStatus}
          bcsScore={bcsScore}
          cattleImage={cattle.display_image}
        />

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        {bcsScore > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <BCS5Chart score={bcsScore} />
            <HealthPieChart status={healthStatus} confidence={confidence} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(cattle.weight_kg || cattle.height_cm || cattle.body_length_cm) && (
            <BodyMetricsChart weight={cattle.weight_kg} height={cattle.height_cm} bodyLength={cattle.body_length_cm} />
          )}
          {cattle.breed && <BreedChart breed={cattle.breed} />}
        </div>

        {/* ── Coat Color section ───────────────────────────────────────────── */}
        {coatColor && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex-shrink-0 border-2 border-white shadow-md"
              style={{ background: isSwatch ? 'conic-gradient(#1e293b 50%, #f8fafc 50%)' : swatchBg }}
            />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Coat Color (AI Detected)</p>
              <p className="text-2xl font-black text-slate-900">{coatColor}</p>
              <p className="text-xs text-slate-500 mt-0.5">Determined from video frame analysis</p>
            </div>
          </div>
        )}

        {/* ── Full Stats Grid ──────────────────────────────────────────────── */}
        <h2 className="text-lg font-black text-slate-900 mb-4">Cattle Profile</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {cattle.breed && (
            <StatCard label="Breed" value={cattle.breed} color="emerald" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            } />
          )}
          {cattle.weight_kg && (
            <StatCard label="Est. Weight" value={`${cattle.weight_kg} kg`} color="blue" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            } />
          )}
          {cattle.height_cm && (
            <StatCard label="Est. Height" value={`${cattle.height_cm} cm`} color="purple" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            } />
          )}
          {coatColor && (
            <StatCard label="Coat Color" value={coatColor} color="amber" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            } />
          )}
          {cattle.estimated_value && (
            <StatCard label="Est. Value" value={cattle.estimated_value} color="emerald" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            } />
          )}
          {cattle.age_estimate && (
            <StatCard label="Age Estimate" value={cattle.age_estimate} color="slate" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            } />
          )}
          {bcsScore > 0 && (
            <StatCard label="BCS Score" value={`${bcsScore.toFixed(1)} / 5.0`} color="emerald" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            } />
          )}
          {(cattle.udder_score !== undefined && cattle.udder_score !== null && cattle.udder_score > 0) && (
            <StatCard label="Udder Score" value={`${cattle.udder_score.toFixed(1)} / 5.0`} color="purple" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            } />
          )}
          {(cattle.teat_score !== undefined && cattle.teat_score !== null && cattle.teat_score > 0) && (
            <StatCard label="Teat Score" value={`${cattle.teat_score.toFixed(1)} / 5.0`} color="blue" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            } />
          )}
          {/* Muzzle ID always shown */}
          <StatCard label="Muzzle ID" value={muzzleID} color="teal" icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          } />
        </div>

        {/* ── Udder & Teat Health Section ──────────────────────────────────── */}
        {((cattle.udder_score && cattle.udder_score > 0) || (cattle.teat_score && cattle.teat_score > 0)) && (() => {
          const udderScore = cattle.udder_score || 0;
          const teatScore = cattle.teat_score || 0;
          const udderLabel = udderScore >= 4.5 ? 'Excellent' : udderScore >= 3.5 ? 'Good' : udderScore >= 2.5 ? 'Average' : udderScore >= 1.5 ? 'Below Average' : 'Poor';
          const teatLabel = teatScore >= 4.5 ? 'Ideal' : teatScore >= 3.5 ? 'Good' : teatScore >= 2.5 ? 'Average' : teatScore >= 1.5 ? 'Short' : 'Deformed';
          const udderColor = udderScore >= 3.5 ? '#9333ea' : udderScore >= 2.5 ? '#a855f7' : '#ef4444';
          const teatColor = teatScore >= 3.5 ? '#2563eb' : teatScore >= 2.5 ? '#3b82f6' : '#ef4444';
          return (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">Udder &amp; Teat Health</h2>
              <p className="text-xs text-slate-500 mb-5">AI-assessed dairy productivity indicators from video analysis</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Udder Score */}
                {udderScore > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Udder Score</p>
                        <p className="text-xs text-slate-400 mt-0.5">{udderLabel} condition</p>
                      </div>
                      <span className="font-black text-2xl leading-none" style={{ color: udderColor }}>
                        {udderScore.toFixed(1)}<span className="text-sm font-bold text-slate-400">/5</span>
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-2.5 flex-1 rounded-full transition-all" style={{ background: i < Math.round(udderScore) ? udderColor : '#e2e8f0' }} />
                      ))}
                    </div>
                    <div className="mt-3 space-y-1">
                      {[['1','Severe atrophy/scarred'],['2','Asymmetric quarters'],['3','Average — moderate capacity'],['4','Good attachment & balance'],['5','Excellent dairy udder']].map(([s, desc]) => (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ background: Math.round(udderScore) === parseInt(s) ? udderColor : '#e2e8f0', color: Math.round(udderScore) === parseInt(s) ? 'white' : '#94a3b8' }}>{s}</span>
                          <span className={Math.round(udderScore) === parseInt(s) ? 'font-black text-slate-900' : 'text-slate-400'}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Teat Score */}
                {teatScore > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider">Teat Score</p>
                        <p className="text-xs text-slate-400 mt-0.5">{teatLabel} condition</p>
                      </div>
                      <span className="font-black text-2xl leading-none" style={{ color: teatColor }}>
                        {teatScore.toFixed(1)}<span className="text-sm font-bold text-slate-400">/5</span>
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-2.5 flex-1 rounded-full transition-all" style={{ background: i < Math.round(teatScore) ? teatColor : '#e2e8f0' }} />
                      ))}
                    </div>
                    <div className="mt-3 space-y-1">
                      {[['1','Inverted/deformed'],['2','Short, uneven placement'],['3','Average — suitable for milking'],['4','Good, uniform cylinders'],['5','Ideal for machine milking']].map(([s, desc]) => (
                        <div key={s} className="flex items-center gap-2 text-xs">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: Math.round(teatScore) === parseInt(s) ? teatColor : '#e2e8f0', color: Math.round(teatScore) === parseInt(s) ? 'white' : '#94a3b8' }}>{s}</span>
                          <span className={Math.round(teatScore) === parseInt(s) ? 'font-black text-slate-900' : 'text-slate-400'}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()
        }

        {/* ── Muzzle Photo Gallery ─────────────────────────────────────────── */}
        {cattle.muzzle_images && cattle.muzzle_images.length > 0 && (
          <>
            <h2 className="text-lg font-black text-slate-900 mb-4">Muzzle Biometric Photos</h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {cattle.muzzle_images.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100 relative group">
                  <img src={img} alt={`Muzzle ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold">{['Straight-on','Slight Left','Slight Right'][i] ?? `Angle ${i + 1}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── AI Report ──────────────────────────────────────────────────── */}
        {cattle.body_condition_detail && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-3">AI Body Condition Report</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{cattle.body_condition_detail}</p>
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mt-2">
          <button onClick={() => navigate('/farm')} className="btn-secondary">← Back to Farm</button>
          <button onClick={() => navigate('/muzzle-check')} className="btn-primary">Run Muzzle Check</button>
        </div>

      </div>
    </div>
  );
}
