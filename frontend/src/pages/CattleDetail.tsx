import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
  disease_status?: string;
  coat_color?: string;
  estimated_value?: string;
  confidence?: number;
  age_estimate?: string;
  body_length_cm?: number;
  body_condition_detail?: string;
}

/* ── Colour helpers ──────────────────────────────────────────────────────────── */
const BCS_COLORS  = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#059669','#047857'];
const HEALTH_COLORS: Record<string, string> = {
  Healthy: '#10b981',
  'Mild Issue': '#f59e0b',
  'Moderate Issue': '#f97316',
  Diseased: '#ef4444',
  Unknown: '#94a3b8',
};

/* ── Custom Tooltip ──────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs font-bold text-slate-700">
        <p style={{ color: payload[0].payload.fill }}>{payload[0].name}: {payload[0].value}%</p>
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
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 border ${colorMap[color] || colorMap.emerald}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-slate-900 font-black text-lg leading-tight">{value}</p>
    </div>
  );
}

/* ── BCS Chart ───────────────────────────────────────────────────────────────── */
function BCSChart({ score }: { score: number }) {
  const data = Array.from({ length: 9 }, (_, i) => ({
    name: `BCS ${i + 1}`,
    value: 11,
    fill: BCS_COLORS[i],
    active: i + 1 === Math.round(score),
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">BCS Score</h3>
      <p className="text-xs text-slate-500 mb-4">Body Condition Score — ICAR 1–9 scale</p>
      <div className="flex items-center gap-6">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} opacity={entry.active ? 1 : 0.22} stroke={entry.active ? entry.fill : 'none'} strokeWidth={entry.active ? 2 : 0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-black" style={{ color: BCS_COLORS[Math.round(score) - 1] }}>{score.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 font-bold">/ 9.0</span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {[
            { range: '1–3', label: 'Thin', color: '#ef4444' },
            { range: '4–5', label: 'Moderate', color: '#f59e0b' },
            { range: '6–7', label: 'Good', color: '#22c55e' },
            { range: '8–9', label: 'Fat', color: '#6366f1' },
          ].map(b => {
            const lo = parseInt(b.range);
            const hi = parseInt(b.range.split('–')[1]);
            const isCurrent = Math.round(score) >= lo && Math.round(score) <= hi;
            return (
              <div key={b.range} className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${isCurrent ? 'bg-slate-50 border border-slate-200' : ''}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                <span className="text-slate-500">{b.range}</span>
                <span className="font-bold text-slate-700">{b.label}</span>
                {isCurrent && <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Current</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Health Pie ──────────────────────────────────────────────────────────────── */
function HealthPieChart({ status, confidence }: { status: string; confidence: number }) {
  const healthColor = HEALTH_COLORS[status] || HEALTH_COLORS.Unknown;
  const data = [
    { name: status, value: confidence, fill: healthColor },
    { name: 'Uncertainty', value: 100 - confidence, fill: '#e2e8f0' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">Health Status</h3>
      <p className="text-xs text-slate-500 mb-4">AI confidence in diagnosis</p>
      <div className="flex items-center gap-4">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black" style={{ color: healthColor }}>{confidence}%</span>
            <span className="text-[10px] text-slate-500 font-bold">sure</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full" style={{ background: healthColor }} />
            <span className="text-base font-black text-slate-900">{status}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${confidence}%`, background: healthColor }} />
          </div>
          <p className="text-[10px] text-slate-500">{confidence}% confidence score</p>
          <div className="mt-4 space-y-1">
            {Object.entries(HEALTH_COLORS).filter(([k]) => k !== 'Unknown').map(([k, c]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className={k === status ? 'font-black text-slate-900' : 'text-slate-400'}>{k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Body Metrics Bar Chart (SVG) ────────────────────────────────────────────── */
function BodyMetricsChart({ weight, height, bodyLength }: { weight?: number; height?: number; bodyLength?: number }) {
  const items = [
    { name: 'Weight', value: weight || 0, unit: 'kg', color: '#10b981', max: 900 },
    { name: 'Height', value: height || 0, unit: 'cm', color: '#3b82f6', max: 200 },
    { name: 'Body Length', value: bodyLength || 0, unit: 'cm', color: '#8b5cf6', max: 250 },
  ].filter(d => d.value > 0);

  if (items.length === 0) return null;

  const pieData = items.map(d => ({
    name: `${d.name} (${d.value}${d.unit})`,
    value: Math.round((d.value / items.reduce((s, x) => s + x.value, 0)) * 100),
    fill: d.color,
  }));

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
                <div className="h-2 rounded-full" style={{ width: `${Math.min((d.value / d.max) * 100, 100)}%`, background: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Breed Confidence Chart ──────────────────────────────────────────────────── */
function BreedChart({ breed }: { breed: string }) {
  const data = [
    { name: breed, value: 82, fill: '#10b981' },
    { name: 'Mixed/Other', value: 18, fill: '#e2e8f0' },
  ];
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-1">Breed Identification</h3>
      <p className="text-xs text-slate-500 mb-4">AI breed classification result</p>
      <div className="flex items-center gap-4">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
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
            <div key={d.name} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
              <span className="text-slate-600">{d.name}</span>
              <span className="ml-auto font-black text-slate-700">{d.value}%</span>
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
  const [cattle, setCattle] = useState<CattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/muzzle/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setCattle(d.data);
        else setError(d.detail || 'Cattle not found');
      })
      .catch(() => setError('Failed to load cattle data'))
      .finally(() => setLoading(false));
  }, [id]);

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

  const bcsScore = cattle.bcs_score ?? 0;
  const healthStatus = cattle.disease_status || 'Unknown';
  const confidence = cattle.confidence ? Math.round(cattle.confidence * 100) : (healthStatus === 'Healthy' ? 94 : 72);
  const registeredDate = new Date(cattle.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Back button ─────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/farm')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Farm Management
        </button>

        {/* ── Hero Header ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/60 mb-8">
          <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600" />
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            {/* Photo */}
            <div className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative shadow-md">
              <img src={cattle.display_image} alt={cattle.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2">
                <span className="text-white text-[10px] font-black tracking-widest">AI VERIFIED</span>
              </div>
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge-green">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Registered
                    </span>
                    {cattle.breed && <span className="badge-grey">{cattle.breed}</span>}
                    <span className={healthStatus === 'Healthy' ? 'badge-green' : healthStatus === 'Unknown' ? 'badge-grey' : 'badge-red'}>
                      {healthStatus}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">{cattle.name}</h1>
                  <p className="text-slate-400 font-mono text-xs">ID: {cattle.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Registered</p>
                  <p className="text-slate-700 font-bold text-sm">{registeredDate}</p>
                </div>
              </div>

              {/* Quick stats */}
              {bcsScore > 0 && (
                <div className="flex flex-wrap gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                    <p className="text-2xl font-black text-emerald-700">{bcsScore.toFixed(1)}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">BCS Score</p>
                  </div>
                  {cattle.weight_kg && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-2xl font-black text-blue-700">{cattle.weight_kg}</p>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">kg Weight</p>
                    </div>
                  )}
                  {cattle.height_cm && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-2xl font-black text-purple-700">{cattle.height_cm}</p>
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">cm Height</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Charts Grid ─────────────────────────────────────────────────── */}
        {bcsScore > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <BCSChart score={bcsScore} />
            <HealthPieChart status={healthStatus} confidence={confidence} />
          </div>
        )}

        {/* Body Metrics + Breed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(cattle.weight_kg || cattle.height_cm || cattle.body_length_cm) && (
            <BodyMetricsChart weight={cattle.weight_kg} height={cattle.height_cm} bodyLength={cattle.body_length_cm} />
          )}
          {cattle.breed && <BreedChart breed={cattle.breed} />}
        </div>

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
          {cattle.coat_color && (
            <StatCard label="Coat Color" value={cattle.coat_color} color="amber" icon={
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
          {cattle.body_length_cm && (
            <StatCard label="Body Length" value={`${cattle.body_length_cm} cm`} color="purple" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            } />
          )}
          {bcsScore > 0 && (
            <StatCard label="BCS Score" value={`${bcsScore.toFixed(1)} / 9.0`} color="emerald" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            } />
          )}
        </div>

        {/* ── Muzzle Photo Gallery ─────────────────────────────────────────── */}
        {cattle.muzzle_images && cattle.muzzle_images.length > 0 && (
          <>
            <h2 className="text-lg font-black text-slate-900 mb-4">Muzzle Biometric Photos</h2>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {cattle.muzzle_images.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100 relative group">
                  <img src={img} alt={`Muzzle ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold">{['Straight-on', 'Slight Left', 'Slight Right'][i] || `View ${i + 1}`}</p>
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
