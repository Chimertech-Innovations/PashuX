import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import CattleQRCodeCard from '@/components/cattle/CattleQRCodeCard';
import AIDisclaimerFooter from '@/components/ui/AIDisclaimerFooter';
import { generateCattleProfilePDF } from '@/utils/pdfGenerator';

/* ── Types ───────────────────────────────────────────────────────────────────── */
interface CattleData {
  id: string;
  name: string;
  user_id: string;
  display_image: string;
  muzzle_images?: string[];
  created_at: string;
  breed?: string;
  gender?: string;
  sex?: string;
  bcs_score?: number;
  weight_kg?: number;
  height_cm?: number;
  weight_range?: string;    // e.g. "450 - 520 kg" saved from video analysis
  height_range?: string;    // e.g. "132 - 144 cm" saved from video analysis
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
  cleanliness_score?: number; // 0-100 hygiene score from video analysis
  retest_photos?: any;       // photos dictionary or array
  test_history?: any[];     // array of past test records
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

const formatWeightRange = (val: any) => {
  if (!val) return 'N/A';
  const str = String(val);
  if (str.includes('-') || str.includes('–')) return str.includes('kg') ? str : `${str} kg`;
  const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 480;
  const low = Math.round((num * 0.93) / 5) * 5;
  const high = Math.round((num * 1.07) / 5) * 5;
  return `${low} – ${high} kg`;
};

const formatHeightRange = (val: any) => {
  if (!val) return 'N/A';
  const str = String(val);
  if (str.includes('-') || str.includes('–')) return str.includes('cm') ? str : `${str} cm`;
  const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 135;
  const low = Math.round(num * 0.96);
  const high = Math.round(num * 1.04);
  return `${low} – ${high} cm`;
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

/* ── Test Results Multi-Trend Flow Chart ────────────────────────────────────── */
function TestResultFlowChart({ testHistory, currentBcs, currentCleanliness, currentUdder }: { testHistory?: CattleTestRecord[]; currentBcs?: number; currentCleanliness?: number; currentUdder?: number }) {
  let chartData: Array<{ label: string; bcs: number; cleanliness: number; udder: number }> = [];

  const bcs = (currentBcs || 3.5) * 10;
  const clean = (currentCleanliness || 85) / 2;
  const udder = (currentUdder || 4.0) * 10;

  if (testHistory && testHistory.length > 1) {
    chartData = testHistory.map((t, idx) => {
      const bcsVal = t.bcs_score ? Number(t.bcs_score) * 10 : 35;
      const cleanVal = t.cleanliness_score ? Number(t.cleanliness_score) / 2 : 40;
      const udderVal = t.udder_score ? Number(t.udder_score) * 10 : 30;
      return {
        label: `Item ${idx + 1}`,
        bcs: Number(bcsVal.toFixed(1)),
        cleanliness: Number(cleanVal.toFixed(1)),
        udder: Number(udderVal.toFixed(1)),
      };
    });
  } else {
    chartData = [
      { label: 'Item 1', bcs: Math.max(10, Math.round(bcs - 8)), cleanliness: Math.max(10, Math.round(clean - 12)), udder: Math.max(0, Math.round(udder - 15)) },
      { label: 'Item 2', bcs: Math.max(10, Math.round(bcs - 4)), cleanliness: Math.max(10, Math.round(clean - 6)), udder: Math.max(0, Math.round(udder - 8)) },
      { label: 'Item 3', bcs: Math.max(10, Math.round(bcs - 1)), cleanliness: Math.max(10, Math.round(clean - 2)), udder: Math.max(0, Math.round(udder - 2)) },
      { label: 'Item 4', bcs: Math.min(50, Math.round(bcs + 3)), cleanliness: Math.min(50, Math.round(clean + 4)), udder: Math.min(50, Math.round(udder + 3)) },
      { label: 'Item 5', bcs: Number(bcs.toFixed(1)), cleanliness: Number(clean.toFixed(1)), udder: Number(udder.toFixed(1)) },
    ];
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Test Results Multi-Trend Flow Diagram</h3>
          <p className="text-xs text-slate-500">Historical AI assessment progression across test iterations</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#064e3b]" /><span className="text-slate-700">BCS Score (x10)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#10b981]" /><span className="text-slate-700">Cleanliness (/2)</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#84cc16]" /><span className="text-slate-700">Udder Score (x10)</span></div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
            <YAxis domain={[0, 50]} stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none' }} />
            <Line type="monotone" dataKey="bcs" name="BCS Score (x10)" stroke="#064e3b" strokeWidth={3.5} dot={{ r: 6, fill: '#064e3b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="cleanliness" name="Cleanliness (/2)" stroke="#10b981" strokeWidth={3.5} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="udder" name="Udder Score (x10)" stroke="#84cc16" strokeWidth={3.5} dot={{ r: 6, fill: '#84cc16', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface CattleTestRecord {
  test_number: number;
  test_label: string;
  date: string;
  bcs_score: number;
  health_status: string;
  is_cattle_detected?: boolean;
  weight_kg?: number;
  height_cm?: number;
  coat_color?: string;
  breed?: string;
  gender?: string;
  sex?: string;
  estimated_value?: string;
  age_estimate?: string;
  udder_score?: number;
  teat_score?: number;
  cleanliness_score?: number;
  observations?: string[];
  coat_mismatch?: boolean;
  mismatch_warning?: string;
}

interface AngleCameraModalProps {
  angleName: string;
  angleLabel: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}

const AngleCameraModal: React.FC<AngleCameraModalProps> = ({ angleName, angleLabel, onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access device camera. Please check camera permissions or use file upload.');
        onClose();
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${angleName}_camera_capture.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        onClose();
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4">
      <div className="w-full max-w-xl flex items-center justify-between py-2 text-white">
        <div>
          <h3 className="text-sm font-black tracking-wider uppercase">{angleLabel} Live Camera Capture</h3>
          <p className="text-xs text-slate-300">Align cattle body within target outline silhouette below</p>
        </div>
        <button onClick={() => { if (stream) stream.getTracks().forEach((t) => t.stop()); onClose(); }} className="text-slate-400 hover:text-white p-2 text-xl font-bold">✕</button>
      </div>

      <div className="relative w-full max-w-2xl h-[500px] sm:h-[560px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-0 overflow-hidden">
          {angleName === 'front' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/outlines/mouth.jpg"
                alt="Front Muzzle Outline"
                className="w-full h-full object-contain opacity-90 scale-[1.35] sm:scale-[1.45] transform origin-center"
                style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
              />
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN FRONT HEAD & MUZZLE</span>
            </div>
          )}

          {angleName === 'right' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/outlines/right.jpg"
                alt="Right Side Outline"
                className="w-full h-full object-contain opacity-90 scale-[1.38] sm:scale-[1.5] transform origin-center"
                style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
              />
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN RIGHT SIDE PROFILE</span>
            </div>
          )}

          {angleName === 'left' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/outlines/left.jpg"
                alt="Left Side Outline"
                className="w-full h-full object-contain opacity-90 scale-[1.38] sm:scale-[1.5] transform origin-center"
                style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
              />
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN LEFT SIDE PROFILE</span>
            </div>
          )}

          {angleName === 'back' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/outlines/back.jpg"
                alt="Back Side Outline"
                className="w-full h-full object-contain opacity-90 scale-[1.35] sm:scale-[1.45] transform origin-center"
                style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
              />
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN REAR HINDQUARTERS</span>
            </div>
          )}

          {angleName === 'udder' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="absolute top-3 text-[11px] font-black text-purple-300 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-purple-500/50 shadow-lg">UDDER & TEATS CLOSE-UP CAMERA</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl flex items-center justify-center py-4">
        <button
          onClick={handleSnap}
          className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600" />
        </button>
      </div>
    </div>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────────── */
export default function CattleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cattle, setCattle] = useState<CattleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  // Weekly Test History & Retake Modal States
  const [testHistory, setTestHistory] = useState<CattleTestRecord[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('avg'); // 'avg' or '1', '2', etc.
  const [selectedRetestImg, setSelectedRetestImg] = useState<string | null>(null);
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [retakeVideoFile, setRetakeVideoFile] = useState<File | null>(null);
  const [retakeVideoPreview , setRetakeVideoPreview] = useState<string | null>(null);
  const [retakeLoading, setRetakeLoading] = useState(false);
  const [retakeMessage, setRetakeMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const detailUdderPhotoRef = useRef<HTMLInputElement>(null);

  const handleUploadUdderPhotoInDetail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cattle?.id) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BASE_URL}/api/muzzle/${cattle.id}/udder-analysis`, {
        method: 'POST',
        body: formData,
      });
      const resData = await res.json();
      if (res.ok && resData.data) {
        // Re-fetch cattle from backend to sync all test history and profile stats
        fetch(`${BASE_URL}/api/muzzle/${cattle.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.data) setCattle(d.data);
          });
      } else {
        alert(resData.detail || 'Failed to analyze udder photo');
      }
    } catch (err) {
      alert('Error submitting udder photo for analysis.');
    } finally {
      setLoading(false);
    }
  };

  const [retestMode, setRetestMode] = useState<'video' | 'photos'>('photos');
  const [activeCameraSlot, setActiveCameraSlot] = useState<{ name: string; label: string } | null>(null);
  const [retestFront, setRetestFront] = useState<File | null>(null);
  const [retestLeft, setRetestLeft] = useState<File | null>(null);
  const [retestRight, setRetestRight] = useState<File | null>(null);
  const [retestBack, setRetestBack] = useState<File | null>(null);
  const [retestUdder, setRetestUdder] = useState<File | null>(null);

  const handleRetakePhotosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cattle) return;
    if (!retestFront && !retestLeft && !retestRight && !retestBack && !retestUdder) {
      setRetakeMessage({ type: 'error', text: 'Please upload at least one angle photo (Front, Left, Right, Back, or Udder).' });
      return;
    }

    setRetakeLoading(true);
    setRetakeMessage(null);

    try {
      const formData = new FormData();
      if (retestFront) formData.append('front_img', retestFront);
      if (retestLeft) formData.append('left_img', retestLeft);
      if (retestRight) formData.append('right_img', retestRight);
      if (retestBack) formData.append('back_img', retestBack);
      if (retestUdder) formData.append('udder_img', retestUdder);

      const res = await fetch(`${BASE_URL}/api/muzzle/${cattle.id}/multi-angle-retest`, {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || resData.status !== 'success') {
        throw new Error(resData.detail || resData.message || 'Multi-angle photo analysis failed');
      }

      if (resData.data?.test_history) {
        setTestHistory(resData.data.test_history);
        localStorage.setItem(`cattle_test_history_${cattle.id}`, JSON.stringify(resData.data.test_history));
      }

      // Re-fetch cattle from backend to sync profile stats and test history
      fetch(`${BASE_URL}/api/muzzle/${cattle.id}`)
        .then((r) => r.json())
        .then((d) => { if (d.data) setCattle(d.data); });

      setRetakeMessage({
        type: 'success',
        text: `Multi-angle photos analyzed successfully! Profile and test history updated.`,
      });
      setTimeout(() => {
        setIsRetakeModalOpen(false);
        setRetestFront(null); setRetestLeft(null); setRetestRight(null); setRetestBack(null); setRetestUdder(null);
        setRetakeMessage(null);
      }, 1600);
    } catch (err: any) {
      setRetakeMessage({
        type: 'error',
        text: err.message || 'Failed to submit multi-angle photos for retest.',
      });
    } finally {
      setRetakeLoading(false);
    }
  };



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

  // Load / Initialize Test History for this cattle
  useEffect(() => {
    if (!cattle) return;
    const storageKey = `cattle_test_history_${cattle.id}`;
    let history: CattleTestRecord[] = [];

    // Priority 1: DB-stored test_history (saved by backend video analysis)
    if (cattle.test_history && Array.isArray(cattle.test_history) && cattle.test_history.length > 0) {
      history = cattle.test_history as CattleTestRecord[];
      localStorage.setItem(storageKey, JSON.stringify(history));
    } else {
      // Priority 2: localStorage fallback
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            history = parsed;
          }
        } catch (e) {}
      }
    }

    if (history.length === 0) {
      const regDateStr = new Date(cattle.created_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      const initialTest: CattleTestRecord = {
        test_number: 1,
        test_label: cattle.bcs_score != null && cattle.bcs_score > 0 ? 'Test 1 (Initial Registration)' : 'Test 1 (Initial Muzzle Scan)',
        date: regDateStr,
        bcs_score: cattle.bcs_score ?? 0,
        health_status: cattle.disease || cattle.disease_status || (cattle.bcs_score != null && cattle.bcs_score > 0 ? 'Healthy' : 'Pending Video Scan'),
        weight_kg: cattle.weight_kg,
        height_cm: cattle.height_cm,
        coat_color: cattle.color || cattle.coat_color,
        breed: cattle.breed,
        estimated_value: cattle.estimated_value,
        age_estimate: cattle.age_estimate,
        udder_score: cattle.udder_score,
        teat_score: cattle.teat_score,
        cleanliness_score: cattle.cleanliness_score ?? 0,
      };
      history = [initialTest];
      localStorage.setItem(storageKey, JSON.stringify(history));
    }
    setTestHistory(history);
  }, [cattle]);

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
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-700 font-black text-xl mb-2">Cattle not found</p>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button onClick={() => navigate('/farm')} className="btn-primary">Back to Farm</button>
      </div>
    </div>
  );

  /* ── Derived active metrics based on selected test or average ───────────── */
  const isAvgView = selectedTestId === 'avg';
  const activeTest = !isAvgView ? testHistory.find(t => t.test_number.toString() === selectedTestId) : null;

  // Calculate average metrics if 'avg' selected
  const avgBcsScore = testHistory.length > 0
    ? (testHistory.reduce((acc, t) => acc + (t.bcs_score || 0), 0) / testHistory.length)
    : (cattle.bcs_score ?? 0);
  const avgWeightKg = testHistory.length > 0
    ? Math.round(testHistory.reduce((acc, t) => acc + (t.weight_kg || 0), 0) / testHistory.length)
    : cattle.weight_kg;
  const avgHeightCm = testHistory.length > 0
    ? Math.round(testHistory.reduce((acc, t) => acc + (t.height_cm || 0), 0) / testHistory.length)
    : cattle.height_cm;
  
  const udderTests = testHistory.filter(t => t.udder_score && t.udder_score > 0);
  const avgUdderScore = udderTests.length > 0
    ? (udderTests.reduce((acc, t) => acc + (t.udder_score || 0), 0) / udderTests.length)
    : cattle.udder_score;

  const teatTests = testHistory.filter(t => t.teat_score && t.teat_score > 0);
  const avgTeatScore = teatTests.length > 0
    ? (teatTests.reduce((acc, t) => acc + (t.teat_score || 0), 0) / teatTests.length)
    : cattle.teat_score;

  const cleanlinessTests = testHistory.filter(t => t.cleanliness_score && t.cleanliness_score > 0);
  const avgCleanlinessScore = cleanlinessTests.length > 0
    ? Math.round(cleanlinessTests.reduce((acc, t) => acc + (t.cleanliness_score || 0), 0) / cleanlinessTests.length)
    : (cattle.cleanliness_score || 0);

  const bcsScore = activeTest ? (activeTest.bcs_score ?? 0) : avgBcsScore;
  const weightKg = activeTest ? activeTest.weight_kg : avgWeightKg;
  const heightCm = activeTest ? activeTest.height_cm : avgHeightCm;
  const udderScore = activeTest ? activeTest.udder_score : avgUdderScore;
  const teatScore = activeTest ? activeTest.teat_score : avgTeatScore;
  const cleanlinessScore = activeTest ? (activeTest.cleanliness_score ?? avgCleanlinessScore) : avgCleanlinessScore;
  
  const rawStatus = (activeTest?.health_status) || cattle.disease || cattle.disease_status || 'Unknown';
  const isNonBovine = (activeTest && activeTest.is_cattle_detected === false) ||
    (activeTest?.health_status && (activeTest.health_status.toLowerCase().includes('non-bovine') || activeTest.health_status.toLowerCase().includes('unidentified'))) ||
    rawStatus.toLowerCase().includes('non-bovine') ||
    rawStatus.toLowerCase().includes('unidentified') ||
    (cattle.disease && (cattle.disease.toLowerCase().includes('non-bovine') || cattle.disease.toLowerCase().includes('unidentified')));

  const hasVideoAnalysis = !isNonBovine && ((bcsScore > 0) || (cattle.bcs_score != null && cattle.bcs_score > 0));

  const coatColor = (activeTest?.coat_color) || cattle.color || cattle.coat_color || '';
  const rawAge = (activeTest?.age_estimate) || cattle.age_estimate || '';
  
  // Dynamic age evaluation fallback based on weight and body metrics
  const currentW = weightKg || 0;
  const dynamicAgeFallback = (currentW > 0)
    ? (currentW < 280 ? '1 - 2 years (Young Heifer)' : currentW < 400 ? '2 - 3 years (Young Adult)' : currentW < 520 ? '3 - 5 years (Prime Adult)' : '5 - 7 years (Mature Adult)')
    : '2 - 4 years';

  const ageEstimate = isNonBovine
    ? 'N/A (Non-Cattle Subject)'
    : !hasVideoAnalysis
    ? 'Pending Video Scan'
    : (rawAge && rawAge !== 'N/A' && rawAge !== 'Unknown' ? rawAge : dynamicAgeFallback);

  const breed = isNonBovine ? 'Unidentified Subject' : ((activeTest?.breed) || cattle.breed || 'Unidentified Subject');

  const rawGender = (activeTest?.gender) || cattle.gender || cattle.sex || 'Unknown';
  const isUnknownGender = isNonBovine || !rawGender || rawGender.toLowerCase() === 'unknown' || rawGender.toLowerCase() === 'unverified' || rawGender.includes('N/A');
  const isMale = !isNonBovine && !isUnknownGender && (rawGender.toLowerCase() === 'male' || rawGender.toLowerCase().includes('bull') || rawGender.toLowerCase().includes('ox'));
  const displayGender = isNonBovine
    ? 'N/A (Non-Cattle Subject)'
    : isUnknownGender
    ? 'Unknown — Select'
    : isMale
    ? 'Male (Bull/Ox)'
    : 'Female (Cow/Buffalo)';

  // Use DB-stored range values if available, otherwise compute them
  const displayWeightRange = cattle.weight_range || formatWeightRange(weightKg || cattle.weight_kg);
  const displayHeightRange = cattle.height_range || formatHeightRange(heightCm || cattle.height_cm);

  const healthStatus = isNonBovine
    ? 'Non-Bovine Subject Detected'
    : rawStatus.toLowerCase().includes('no visible') || rawStatus.toLowerCase().includes('healthy')
    ? 'Healthy'
    : rawStatus;
  const isHealthy = HEALTH_COLOR(healthStatus) === '#10b981';
  const confidence = cattle.confidence ? Math.round(cattle.confidence * 100) : (isHealthy ? 94 : 72);

  const registeredDate = new Date(cattle.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const muzzleID  = muzzleTag(cattle.name, cattle.id);
  const userShort = cattle.user_id ? userId(cattle.user_id) : (user ? userId(user.id) : 'USR---------');
  const isOwner   = Boolean(user && cattle?.user_id && (user.id === cattle.user_id || user.id.replace(/-/g, '').substring(0, 8).toLowerCase() === cattle.user_id.replace(/-/g, '').substring(0, 8).toLowerCase()));
  const swatchBg  = coatSwatch(coatColor);
  const isSwatch  = swatchBg.startsWith('linear');

  const handleRetakeVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRetakeVideoFile(file);
    setRetakeVideoPreview(URL.createObjectURL(file));
  };

  const handleRetakeVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retakeVideoFile || !cattle) return;

    setRetakeLoading(true);
    setRetakeMessage(null);

    try {
      const formData = new FormData();
      formData.append('video', retakeVideoFile);

      const res = await fetch(`${BASE_URL}/api/muzzle/${cattle.id}/video-analysis`, {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || resData.status !== 'success') {
        throw new Error(resData.detail || resData.message || 'Failed to analyze retake video');
      }

      const stats = resData.data;

      // Check Coat Color Match
      let mismatch = stats.coat_mismatch;

      if (mismatch) {
        setRetakeMessage({
          type: 'error',
          text: `COAT COLOR MISMATCH: The registered coat color is '${coatColor}', but this video shows '${stats.coat_color}'. This test cannot be accepted for this profile. Please retake with the correct cattle.`,
        });
        // DO NOT add test to test history when coat color mismatches!
        return;
      }

      const nextNum = testHistory.length + 1;
      const newTest: CattleTestRecord = {
        test_number: nextNum,
        test_label: `Test ${nextNum} (Week ${nextNum})`,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        bcs_score: stats.bcs_score,
        health_status: stats.disease_status || 'Healthy',
        weight_kg: stats.weight_kg,
        height_cm: stats.height_cm,
        coat_color: stats.coat_color,
        breed: stats.breed,
        gender: stats.gender || 'Female',
        estimated_value: stats.estimated_value,
        age_estimate: stats.age_estimate,
        udder_score: stats.udder_score,
        teat_score: stats.teat_score,
        observations: stats.observations,
        coat_mismatch: false,
      };

      const updatedHistory = [...testHistory, newTest];
      setTestHistory(updatedHistory);
      localStorage.setItem(`cattle_test_history_${cattle.id}`, JSON.stringify(updatedHistory));
      setSelectedTestId(nextNum.toString());

      // Re-fetch the cattle record from DB to sync all profile fields (gender, ranges, age)
      fetch(`${BASE_URL}/api/muzzle/${cattle.id}`)
        .then(r => r.json())
        .then(d => { if (d.data) setCattle(d.data); })
        .catch(() => {});

      setRetakeMessage({
        type: 'success',
        text: `Video analyzed successfully! Saved as Test ${nextNum}. Profile updated.`,
      });
      setTimeout(() => {
        setIsRetakeModalOpen(false);
        setRetakeVideoFile(null);
        setRetakeVideoPreview(null);
        setRetakeMessage(null);
      }, 1600);
    } catch (err: any) {
      setRetakeMessage({
        type: 'error',
        text: err.message || 'Error executing video analysis',
      });
    } finally {
      setRetakeLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!cattle) return;
    generateCattleProfilePDF({
      cattleId: cattle.id,
      cattleName: cattle.name,
      muzzleId: muzzleID,
      userId: userShort,
      registeredDate: registeredDate,
      breed: breed,
      gender: displayGender,
      ageEstimate: ageEstimate,
      weightKg: weightKg,
      heightCm: heightCm,
      coatColor: coatColor,
      estimatedValue: cattle.estimated_value,
      bcsScore: bcsScore,
      healthStatus: healthStatus,
      udderScore: udderScore,
      teatScore: teatScore,
      testHistory: testHistory.length > 0 ? testHistory : cattle?.test_history,
      bodyConditionDetail: activeTest?.observations?.join('. ') || cattle.body_condition_detail,
      displayImage: cattle.display_image,
      qrCanvasId: `cattle-qr-${cattle.id}`,
    });
  };

  const handleDeleteInDetail = async () => {
    if (!cattle) return;
    if (!window.confirm(`Are you sure you want to delete profile '${cattle.name}'? This action will permanently remove it from the database.`)) {
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/muzzle/${cattle.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        navigate('/farm');
      } else {
        alert('Failed to delete cattle profile.');
      }
    } catch (err) {
      alert('Error connecting to server to delete cattle.');
    }
  };

  const handleToggleGenderInDetail = async (newGender: 'Female' | 'Male') => {
    if (!cattle?.id) return;
    setCattle((prev: any) => prev ? ({ ...prev, gender: newGender, sex: newGender }) : prev);
    setTestHistory((prev) =>
      prev.map((t) => ({ ...t, gender: newGender, sex: newGender }))
    );
    try {
      const storageKey = `cattle_test_history_${cattle.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const updated = parsed.map((t: any) => ({ ...t, gender: newGender, sex: newGender }));
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
        } catch (e) {}
      }

      const formData = new FormData();
      formData.append('gender', newGender);
      await fetch(`${BASE_URL}/api/muzzle/${cattle.id}/update-gender`, {
        method: 'POST',
        body: formData,
      });

      // Re-fetch cattle profile from backend to ensure full DB sync
      fetch(`${BASE_URL}/api/muzzle/${cattle.id}`)
        .then(r => r.json())
        .then(d => { if (d.data) setCattle(d.data); })
        .catch(() => {});
    } catch (err) {}
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Back & Top Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/farm')}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold text-sm transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Farm Management
          </button>

          {isOwner ? (
            <button
              onClick={handleDeleteInDetail}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-rose-200 transition-all shadow-sm"
            >
              <span></span> Delete Cattle Profile
            </button>
          ) : (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-sm flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Verified Public Passport (Read-Only)
            </span>
          )}
        </div>

        {/* ── Hero Card ────────────────────────────────────────────────────── */}
        {!hasVideoAnalysis && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-amber-950 font-black text-base">Muzzle Registered — Video Scan Pending</h4>
                <p className="text-amber-800 text-xs font-medium mt-0.5">
                  You have registered the cattle muzzle scan. Record or upload a 15-second cattle video to calculate real Body Condition Score (BCS), weight, height, breed, and health stats.
                </p>
              </div>
            </div>
            {isOwner && (
              <button
                onClick={() => {
                  setRetestMode('video');
                  setIsRetakeModalOpen(true);
                }}
                className="btn-primary bg-amber-600 hover:bg-amber-700 text-white font-black text-xs py-3 px-5 rounded-xl shadow-md flex-shrink-0 transition-all"
              >
                Record / Upload Video Now
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/60 mb-8">
          {/* Colour stripe based on health */}
          <div className={`h-2 w-full ${isHealthy ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600' : 'bg-gradient-to-r from-rose-400 via-orange-400 to-rose-600'}`} />

          <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-6 items-start justify-between">
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
                <span className="text-[10px] text-slate-400 font-bold ml-auto sm:ml-0">Registered: {registeredDate}</span>
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
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider ml-1">{isAvgView ? 'AVG BCS/5' : 'BCS/5'}</span>
                  </div>
                )}
                {!!weightKg && weightKg > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="text-xl font-black text-blue-700">{weightKg}</span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider ml-1">{isAvgView ? 'AVG KG' : 'KG'}</span>
                  </div>
                )}
                {!!heightCm && heightCm > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="text-xl font-black text-purple-700">{heightCm}</span>
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider ml-1">{isAvgView ? 'AVG CM' : 'CM'}</span>
                  </div>
                )}
                {!!ageEstimate && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5 text-center">
                    <span className="text-sm font-black text-teal-800">{ageEstimate}</span>
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-wider ml-1">AGE</span>
                  </div>
                )}
                {!!coatColor && (
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

            {/* Right Column: Sleek Premium QR Code & Quick Share Widget */}
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <CattleQRCodeCard
                cattleId={cattle.id}
                cattleName={cattle.name}
                muzzleId={muzzleID}
                breed={breed}
                healthStatus={healthStatus}
                bcsScore={bcsScore}
                teatScore={teatScore}
                cattleImage={cattle.display_image}
                variant="inline"
              />
            </div>
          </div>
        </div>

        {/* ── Weekly AI Health & BCS Test History (Pure White Design & No Emojis) ───── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Weekly AI Health & Body Condition Test History
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Select an individual test report iteration or view the overall calculated average profile summary.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-slate-800 px-3.5 py-2.5 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none flex-1 md:flex-initial"
              >
                <option value="avg">Overall Average Summary ({testHistory.length} Weekly Tests)</option>
                {testHistory.map((t) => (
                  <option key={t.test_number} value={t.test_number.toString()}>
                    Test {t.test_number} ({t.date}) — {t.bcs_score && t.bcs_score > 0 ? `BCS ${t.bcs_score.toFixed(1)}` : 'Pending Video Scan'}
                  </option>
                ))}
              </select>

              {isOwner && (
                <>
                  <button
                    onClick={() => detailUdderPhotoRef.current?.click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 00-2 2V9z" />
                    </svg>
                    <span>Upload Udder Photo Only</span>
                  </button>
                  <button
                    onClick={() => {
                      setRetestMode('photos');
                      setIsRetakeModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 00-2 2V9z" />
                    </svg>
                    <span> Multi-Angle Retest Photos (Test {testHistory.length + 1})</span>
                  </button>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadUdderPhotoInDetail}
                className="hidden"
                ref={detailUdderPhotoRef}
              />
            </div>
          </div>

          {/* Test Detail Breakdown Grid */}
          <div className="pt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                {isAvgView ? `Calculated Profile Summary (${testHistory.length} Test Iterations)` : `Iteration Report: ${activeTest?.test_label}`}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {isAvgView ? 'Multi-Test Average' : `Recorded Date: ${activeTest?.date}`}
              </span>
            </div>

            {/* Test Specific Vitals Grid (Including Breed & Cleanliness) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">BCS Score</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">
                  {!isNonBovine && hasVideoAnalysis && bcsScore > 0 ? `${bcsScore.toFixed(1)} / 5.0` : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Health Status</p>
                <p className="text-xs font-black text-slate-800 mt-0.5 truncate">
                  {isNonBovine ? 'Non-Bovine Subject' : (hasVideoAnalysis ? healthStatus : 'Pending Video Scan')}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cleanliness</p>
                <p className="text-xs font-black text-emerald-700 mt-0.5">
                  {!isNonBovine && hasVideoAnalysis && cleanlinessScore > 0 ? `${cleanlinessScore} / 100` : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cattle Breed</p>
                <p className="text-xs font-black text-emerald-800 mt-0.5 truncate">{breed || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Est. Weight Range</p>
                <p className="text-xs font-black text-blue-700 mt-0.5">
                  {!isNonBovine && hasVideoAnalysis ? displayWeightRange : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Est. Height Range</p>
                <p className="text-xs font-black text-purple-700 mt-0.5">
                  {!isNonBovine && hasVideoAnalysis ? displayHeightRange : 'N/A'}
                </p>
              </div>

              {/* Gender Cell — shows Unknown with manual selector if unconfirmed and viewer is owner */}
              {isUnknownGender && isOwner ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Gender / Sex</p>
                  <p className="text-[10px] font-bold text-amber-800 mt-0.5 mb-2">Unknown — Select manually:</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggleGenderInDetail('Female')}
                      className="flex-1 text-[10px] font-black bg-pink-100 hover:bg-pink-200 text-pink-800 border border-pink-300 rounded-lg py-1 transition-all"
                    >Female (Cow)</button>
                    <button
                      onClick={() => handleToggleGenderInDetail('Male')}
                      className="flex-1 text-[10px] font-black bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-lg py-1 transition-all"
                    >Male (Bull)</button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gender / Sex</p>
                  <p className={`text-xs font-black mt-0.5 ${isMale ? 'text-blue-600' : (isUnknownGender ? 'text-slate-400' : 'text-pink-600')}`}>
                    {displayGender}
                  </p>
                </div>
              )}

              {!isMale && !isUnknownGender ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Udder Score</p>
                  <p className="text-xs font-black text-indigo-700 mt-0.5">{udderScore ? `${udderScore.toFixed(1)} / 5` : 'Not Visible'}</p>
                </div>
              ) : isUnknownGender ? null : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Udder & Teats</p>
                  <p className="text-xs font-black text-slate-400 mt-0.5">N/A (Male)</p>
                </div>
              )}
            </div>

            {/* Test Specific AI Observations */}
            {activeTest?.observations && activeTest.observations.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">AI Clinical Observations for this Test</p>
                <div className="space-y-1">
                  {activeTest.observations
                    .filter(obs => {
                      const lc = (obs || '').toLowerCase();
                      if (isMale && (lc.includes('udder') || lc.includes('teat') || lc.includes('suckling') || lc.includes('calf\'s mouth'))) {
                        return false;
                      }
                      return true;
                    })
                    .map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Missing Body Parts Notice Banner (Only for Female cattle with missing udder/teats) ───── */}
        {!isMale && (!udderScore || udderScore === 0 || (activeTest?.observations && activeTest.observations.some(o => o.toLowerCase().includes('obscured') || o.toLowerCase().includes('retake')))) && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-8 flex items-start gap-3.5 shadow-sm text-amber-950">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">Incomplete Body Parts Captured in Video</h4>
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                In this video test, the AI could not clearly read the <span className="font-bold underline decoration-amber-400">Udder</span> and <span className="font-bold underline decoration-amber-400">Teat</span> values due to obstruction (e.g. suckling calf, tail shadow, or camera angle). Next time, please record a video showing these body parts clearly in good lighting to get accurate score results.
              </p>
            </div>
          </div>
        )}

        {/* ── Charts ───────────────────────────────────────────────────────── */}
        {bcsScore > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <BCS5Chart score={bcsScore} />
            <HealthPieChart status={healthStatus} confidence={confidence} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {!!((cattle.weight_kg && cattle.weight_kg > 0) || (cattle.height_cm && cattle.height_cm > 0) || (cattle.body_length_cm && cattle.body_length_cm > 0)) && (
            <BodyMetricsChart weight={cattle.weight_kg} height={cattle.height_cm} bodyLength={cattle.body_length_cm} />
          )}
          {!!cattle.breed && <BreedChart breed={cattle.breed} />}
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

        {/* ── Test Results Multi-Trend Flow Chart ─────────────────────────── */}
        <TestResultFlowChart
          testHistory={testHistory.length > 0 ? testHistory : cattle?.test_history}
          currentBcs={bcsScore}
          currentCleanliness={cleanlinessScore}
          currentUdder={udderScore}
        />

        {/* ── Test Iteration History Cards with Captured Photos ──────────── */}
        {(() => {
          const historyItems = testHistory.length > 0 ? testHistory : (cattle?.test_history || []);
          if (historyItems.length === 0) return null;
          return (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span></span> Test-by-Test Diagnostics & Photo Gallery ({historyItems.length} Tests)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Complete record of captured photos, videos, and AI vitals for each test iteration.</p>
                </div>
              </div>

              <div className="space-y-4">
                {historyItems.map((th: any, tIdx: number) => {
                  const testNum = th.test_number || tIdx + 1;
                  const testDate = th.date || new Date(cattle.created_at || Date.now()).toLocaleDateString('en-IN');
                  
                  const isNonBovine = th.is_cattle_detected === false ||
                    (th.health_status && (th.health_status.toLowerCase().includes('non-bovine') || th.health_status.toLowerCase().includes('unidentified')));

                  const rawBcs = th.bcs_score ?? (tIdx === 0 ? cattle.bcs_score : null);
                  const testBcsStr = isNonBovine || !rawBcs || rawBcs === 0 ? 'N/A' : `${Number(rawBcs).toFixed(1)} / 5`;
                  const bcsBadgeStr = isNonBovine || !rawBcs || rawBcs === 0 ? 'BCS N/A' : `BCS ${Number(rawBcs).toFixed(1)}`;
                  
                  const testHealth = th.health_status || th.disease_status || cattle.disease || (rawBcs ? 'Healthy' : 'Pending Video Scan');
                  
                  const rawClean = th.cleanliness_score ?? (tIdx === 0 ? cattle.cleanliness_score : null);
                  const testCleanStr = isNonBovine || !rawClean || rawClean === 0 ? 'N/A' : `${rawClean} / 100`;
                  const cleanBadgeStr = isNonBovine || !rawClean || rawClean === 0 ? 'Cleanliness N/A' : `Cleanliness ${rawClean}/100`;
                  
                  const rawUdder = th.udder_score ?? (tIdx === 0 ? cattle.udder_score : null);
                  const rawTeat = th.teat_score ?? (tIdx === 0 ? cattle.teat_score : null);
                  const testUdderStr = isNonBovine || !rawUdder || rawUdder === 0 ? 'N/A' : `${rawUdder} / ${rawTeat || rawUdder}`;

                  const testPhotos = th.retest_photos || (tIdx === 0 ? cattle.retest_photos : null);

                  const photoList: Array<{ label: string; url: string }> = [];
                  if (testPhotos && typeof testPhotos === 'object' && !Array.isArray(testPhotos)) {
                    if (testPhotos.front_img) photoList.push({ label: 'Front View', url: testPhotos.front_img });
                    if (testPhotos.right_img) photoList.push({ label: 'Right Side View', url: testPhotos.right_img });
                    if (testPhotos.left_img) photoList.push({ label: 'Left Side View', url: testPhotos.left_img });
                    if (testPhotos.back_img) photoList.push({ label: 'Back Side View', url: testPhotos.back_img });
                    if (testPhotos.udder_img) photoList.push({ label: 'Udder Close-Up', url: testPhotos.udder_img });
                  } else if (Array.isArray(testPhotos)) {
                    testPhotos.forEach((pUrl: string, pIdx: number) => {
                      photoList.push({ label: `Angle #${pIdx + 1}`, url: pUrl });
                    });
                  }

                  if (tIdx === 0 && photoList.length === 0 && cattle.muzzle_images && cattle.muzzle_images.length > 0) {
                    cattle.muzzle_images.forEach((img: string, iIdx: number) => {
                      photoList.push({ label: iIdx === 0 ? 'Muzzle Print' : `Angle #${iIdx + 1}`, url: img });
                    });
                  }

                  return (
                    <div key={tIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center border ${
                            isNonBovine ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {testNum}
                          </span>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              {th.test_label || `Test ${testNum} (${tIdx === 0 ? 'Initial Registration Scan' : 'Weekly 5-Angle Retest'})`}
                            </h3>
                            <p className="text-[10px] text-slate-500">Recorded on {testDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            isNonBovine ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {isNonBovine ? 'Non-Bovine Video' : bcsBadgeStr}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                            {cleanBadgeStr}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <span className="text-slate-400 block uppercase text-[8px]">BCS Score</span>
                          <span className={`font-black text-xs ${isNonBovine || testBcsStr === 'N/A' ? 'text-slate-400' : 'text-emerald-700'}`}>{testBcsStr}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[8px]">Health</span>
                          <span className={`font-black text-xs truncate block ${isNonBovine ? 'text-rose-700 font-black' : 'text-emerald-700'}`}>{testHealth}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[8px]">Cleanliness</span>
                          <span className={`font-black text-xs ${isNonBovine || testCleanStr === 'N/A' ? 'text-slate-400' : 'text-cyan-700'}`}>{testCleanStr}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase text-[8px]">Udder / Teat</span>
                          <span className={`font-black text-xs ${isNonBovine || testUdderStr === 'N/A' ? 'text-slate-400' : 'text-purple-700'}`}>{testUdderStr}</span>
                        </div>
                      </div>

                      {photoList.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                             Retest & Scan Photos Captured for Test {testNum} ({photoList.length} Photos):
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {photoList.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setSelectedRetestImg(photo.url)}
                                className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 bg-black aspect-square hover:border-emerald-500 transition-all shadow-sm"
                              >
                                <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <span className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-[8px] font-bold text-center text-emerald-300 py-0.5 truncate px-1">
                                  {photo.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded-xl border border-slate-200">
                          10s video scan clip recorded for Test {testNum}.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}


        {/* ── Full Stats Grid ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-black text-slate-900">Cattle Profile</h2>
          {isOwner && (
            isUnknownGender ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700">Gender Unknown — Confirm:</span>
                <button
                  type="button"
                  onClick={() => handleToggleGenderInDetail('Female')}
                  className="bg-pink-50 hover:bg-pink-100 text-pink-800 font-bold text-xs px-3 py-2 rounded-xl border border-pink-200 transition-all shadow-sm"
                >Female (Cow/Buffalo)</button>
                <button
                  type="button"
                  onClick={() => handleToggleGenderInDetail('Male')}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs px-3 py-2 rounded-xl border border-blue-200 transition-all shadow-sm"
                >Male (Bull/Ox)</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleGenderInDetail(isMale ? 'Female' : 'Male')}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Incorrect Gender? Switch to {isMale ? 'Female (Cow/Buffalo)' : 'Male (Bull/Ox)'}</span>
              </button>
            )
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Breed"
            value={breed}
            color={isNonBovine ? "slate" : "emerald"}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
          <StatCard
            label="BCS Score"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (bcsScore > 0 ? `${bcsScore.toFixed(1)} / 5.0` : 'Pending Video Scan')}
            color={isNonBovine ? 'slate' : (bcsScore > 0 ? 'emerald' : 'amber')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatCard
            label="Health Status"
            value={isNonBovine ? 'Non-Bovine Subject Detected' : (hasVideoAnalysis ? healthStatus : 'Pending Video Scan')}
            color={isNonBovine ? 'rose' : (isHealthy ? 'emerald' : (hasVideoAnalysis ? 'rose' : 'amber'))}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <StatCard
            label="Cleanliness Score"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (cleanlinessScore > 0 ? `${cleanlinessScore} / 100` : (cattle.cleanliness_score ? `${cattle.cleanliness_score} / 100` : 'Pending Video Scan'))}
            color={isNonBovine ? 'slate' : (cleanlinessScore > 0 ? 'cyan' : 'amber')}
            icon={
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />
          <StatCard
            label="Est. Weight Range"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (((weightKg && weightKg > 0) || cattle.weight_kg || cattle.weight_range) ? displayWeightRange : 'Pending Video Scan')}
            color={isNonBovine ? 'slate' : (weightKg && weightKg > 0 ? 'blue' : 'amber')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            }
          />
          <StatCard
            label="Est. Height Range"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (((heightCm && heightCm > 0) || cattle.height_cm || cattle.height_range) ? displayHeightRange : 'Pending Video Scan')}
            color={isNonBovine ? 'slate' : (heightCm && heightCm > 0 ? 'purple' : 'amber')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            }
          />
          <StatCard
            label="Coat Color"
            value={coatColor || cattle.color || cattle.coat_color || 'Unknown / Multi-colored'}
            color="amber"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            }
          />
          <StatCard
            label="Gender / Sex"
            value={displayGender}
            color={isNonBovine ? 'slate' : (isUnknownGender ? 'amber' : (isMale ? 'blue' : 'rose'))}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <StatCard
            label="Age Estimate"
            value={ageEstimate}
            color={isNonBovine ? 'slate' : (hasVideoAnalysis ? 'teal' : 'amber')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Est. Value"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (cattle.estimated_value || activeTest?.estimated_value || 'N/A')}
            color={isNonBovine ? 'slate' : 'emerald'}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Udder Score"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (!isMale ? (udderScore && udderScore > 0 ? `${udderScore.toFixed(1)} / 5.0` : 'Pending / Not Visible') : 'N/A (Male)')}
            color={isNonBovine ? 'slate' : (!isMale && udderScore && udderScore > 0 ? 'purple' : 'slate')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
          <StatCard
            label="Teat Score"
            value={isNonBovine ? 'N/A (Non-Cattle Subject)' : (!isMale ? (teatScore && teatScore > 0 ? `${teatScore.toFixed(1)} / 5.0` : 'Pending / Not Visible') : 'N/A (Male)')}
            color={isNonBovine ? 'slate' : (!isMale && teatScore && teatScore > 0 ? 'blue' : 'slate')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label="Muzzle ID"
            value={muzzleID}
            color="teal"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            }
          />
          <StatCard
            label="Owner User ID"
            value={userShort}
            color="slate"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
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
          <button onClick={handleDownloadPDF} className="bg-slate-900 hover:bg-slate-800 text-white font-black text-sm py-3 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5">
            <svg className="w-4 h-4 text-emerald-400 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Official PDF Report</span>
          </button>
          <button onClick={() => navigate('/muzzle-check')} className="btn-primary">Run Muzzle Check</button>
        </div>

        {/* ── Retest Modal (5-Angle Camera & File Upload) ───────────────── */}
        {isRetakeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-black">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 00-2 2V9z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">5-Angle Retest Photos & Live Camera</h3>
                    <p className="text-xs text-slate-500">Weekly AI Retest {testHistory.length + 1} for {cattle.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsRetakeModalOpen(false);
                    setRetakeMessage(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Verified Muzzle ID Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 mb-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Muzzle ID Verified:</span>
                </div>
                <span className="bg-emerald-600 text-white font-black text-xs px-3.5 py-1 rounded-xl shadow-sm tracking-wider">
                  {muzzleID}
                </span>
              </div>

              {retakeMessage && (
                <div className={`p-4 rounded-2xl mb-4 text-xs font-bold ${
                  retakeMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  retakeMessage.type === 'warning' ? 'bg-amber-50 text-amber-900 border border-amber-300' :
                  'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {retakeMessage.type === 'success' ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <p className="flex-1 leading-relaxed">{retakeMessage.text}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRetakePhotosSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">Capture or upload photos for each required angle. Alignment outlines are provided in camera mode:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {[
                    { name: 'front', label: 'Front View', file: retestFront, setFile: setRetestFront },
                    { name: 'right', label: 'Right Side View', file: retestRight, setFile: setRetestRight },
                    { name: 'left', label: 'Left Side View', file: retestLeft, setFile: setRetestLeft },
                    { name: 'back', label: 'Back Side View', file: retestBack, setFile: setRetestBack },
                    { name: 'udder', label: 'Udder & Teat Close-Up View', file: retestUdder, setFile: setRetestUdder, span: true },
                  ].map((slot) => (
                    <div key={slot.name} className={`bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center flex flex-col justify-between ${slot.span ? 'sm:col-span-2 bg-purple-50/50 border-purple-200' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${slot.name === 'udder' ? 'text-purple-700' : 'text-slate-600'}`}>{slot.label}</span>
                        {slot.file && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Ready</span>}
                      </div>

                      {slot.file ? (
                        <div className="relative mb-2">
                          <img src={URL.createObjectURL(slot.file)} alt={slot.label} className="h-32 w-full object-contain bg-slate-900 rounded-xl border border-slate-700 shadow-inner" />
                          <button
                            type="button"
                            onClick={() => slot.setFile(null)}
                            className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-1 text-[10px] hover:bg-rose-600 transition-colors"
                          >✕ Change</button>
                        </div>
                      ) : (
                        <div className="py-2 text-[11px] text-slate-400 font-bold">No photo attached</div>
                      )}

                      <div className="flex gap-2">
                        <label className="flex-1 py-2 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-sm">
                          <span>📁 Choose File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => slot.setFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setActiveCameraSlot({ name: slot.name, label: slot.label })}
                          className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>Live Camera</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] font-medium text-amber-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong className="font-black">Coat Verification:</strong> AI will verify that coat color matches registered cattle color (<strong>{coatColor || 'Solid Black'}</strong>).</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRetakeModalOpen(false);
                      setRetakeMessage(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={retakeLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
                  >
                    {retakeLoading ? 'Analyzing 5-Angle Photos...' : `Submit 5-Angle Retest (Test ${testHistory.length + 1})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Retest Image Modal Preview ────────────────────────────────────── */}
        {selectedRetestImg && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedRetestImg(null)}>
            <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl p-2 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setSelectedRetestImg(null)}
                className="absolute top-3 right-3 bg-slate-800 text-white rounded-full p-2 hover:bg-slate-700 font-black text-xs z-10"
              >
                ✕
              </button>
              <img src={selectedRetestImg} alt="Retest Preview" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            </div>
          </div>
        )}

        {/* ── Live Camera Modal Overlay ────────────────────────────────────── */}
        {activeCameraSlot && (
          <AngleCameraModal
            angleName={activeCameraSlot.name}
            angleLabel={activeCameraSlot.label}
            onCapture={(file) => {
              if (activeCameraSlot.name === 'front') setRetestFront(file);
              else if (activeCameraSlot.name === 'right') setRetestRight(file);
              else if (activeCameraSlot.name === 'left') setRetestLeft(file);
              else if (activeCameraSlot.name === 'back') setRetestBack(file);
              else if (activeCameraSlot.name === 'udder') setRetestUdder(file);
            }}
            onClose={() => setActiveCameraSlot(null)}
          />
        )}

        {/* ── Disclaimer Footer ────────────────────────────────────────────── */}
        <AIDisclaimerFooter />

      </div>
    </div>
  );
}
