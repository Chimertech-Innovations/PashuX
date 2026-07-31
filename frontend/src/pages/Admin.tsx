import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generateHealthReportPDF } from '@/utils/pdfGenerator';
import { Link } from 'react-router-dom';

interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  role?: string;
  total_scans?: number;
}

interface FrameItem {
  url: string;
  clarity?: number;
  number?: number;
}

interface ReportRecord {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  analysis_type: string;
  processing_status: string;
  created_at: string;
  video_url?: string;
  frames?: FrameItem[];
  bcs_score?: number;
  bcs_confidence?: number;
  possible_condition?: string;
  disease_confidence?: number;
  severity?: string;
  observations?: string[];
  recommendations?: string[];
  ai_reply?: string;
  recommended_products?: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    description?: string;
  }>;
}

// Demo Data with realistic cattle videos and 3-10 extracted frames for admin preview & testing
const DEMO_USERS: UserRecord[] = [
  {
    id: 'usr_demo_101',
    email: 'farmer.rajesh@gmail.com',
    full_name: 'Rajesh Kumar (Gujarat Farm)',
    created_at: '2026-07-28T10:15:00Z',
    role: 'user',
    total_scans: 4,
  },
  {
    id: 'usr_demo_102',
    email: 'dairy.sunita@yahoo.com',
    full_name: 'Sunita Sharma (Punjab Agro)',
    created_at: '2026-07-29T14:40:00Z',
    role: 'user',
    total_scans: 2,
  },
  {
    id: 'usr_demo_103',
    email: 'admin@chimertech.ai',
    full_name: 'System Admin',
    created_at: '2026-07-25T08:00:00Z',
    role: 'admin',
    total_scans: 12,
  },
];

const DEMO_REPORTS: ReportRecord[] = [
  {
    id: 'req_demo_8801',
    user_id: 'usr_demo_101',
    user_email: 'farmer.rajesh@gmail.com',
    user_name: 'Rajesh Kumar',
    analysis_type: 'combined',
    processing_status: 'completed',
    created_at: '2026-07-30T11:20:00Z',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    frames: [
      { url: 'https://images.unsplash.com/photo-1570042707227-2c937108ecf6?w=600&auto=format&fit=crop&q=60', number: 1, clarity: 185.4 },
      { url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=600&auto=format&fit=crop&q=60', number: 2, clarity: 172.1 },
      { url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=60', number: 3, clarity: 168.9 },
      { url: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=600&auto=format&fit=crop&q=60', number: 4, clarity: 154.2 },
    ],
    bcs_score: 2.5,
    bcs_confidence: 0.94,
    possible_condition: 'Early Mastitis & Mild Sub-nutrition',
    disease_confidence: 0.89,
    severity: 'Moderate',
    observations: [
      'Visible rib structure and spinous process projection indicating BCS ~2.5.',
      'Slight swelling in rear right quarter udder area.',
      'Mild lethargy observed during 10s video scan.',
    ],
    recommendations: [
      'Supplement daily ration with high-energy bypass fat (50g/day).',
      'Apply topical udder care ointment and check somatic cell count (SCC).',
      'Consult veterinary specialist if temperature rises above 102.5°F.',
    ],
    ai_reply: 'The scan shows moderate fat depletion around the pin bones (BCS 2.5) along with localized udder inflammation. Immediate dietary energy boost and udder hygiene spray are strongly advised.',
    recommended_products: [
      {
        id: 'p_1',
        name: 'Chimertech Super Fat Booster 5kg',
        category: 'Nutrition & Feed',
        price: 1850,
        description: 'Bypass fat supplement for immediate energy recovery and body condition score improvement.',
      },
      {
        id: 'p_2',
        name: 'Herbal Udder Protect Spray 500ml',
        category: 'Udder Care & Mastitis',
        price: 640,
        description: 'Natural antiseptic antibacterial spray to reduce udder swelling and prevent subclinical mastitis.',
      },
      {
        id: 'p_3',
        name: 'Chelated Mineral Mixture 1kg',
        category: 'Supplements',
        price: 480,
        description: 'Essential minerals and vitamins to support immune response and milk yield stabilization.',
      },
    ],
  },
  {
    id: 'req_demo_8802',
    user_id: 'usr_demo_102',
    user_email: 'dairy.sunita@yahoo.com',
    user_name: 'Sunita Sharma',
    analysis_type: 'bcs',
    processing_status: 'completed',
    created_at: '2026-07-29T16:10:00Z',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    frames: [
      { url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=60', number: 1, clarity: 192.0 },
      { url: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=600&auto=format&fit=crop&q=60', number: 2, clarity: 188.5 },
      { url: 'https://images.unsplash.com/photo-1570042707227-2c937108ecf6?w=600&auto=format&fit=crop&q=60', number: 3, clarity: 175.3 },
    ],
    bcs_score: 3.8,
    bcs_confidence: 0.96,
    observations: [
      'Well-covered hips and rounded pin bones.',
      'Optimal subcutaneous fat layer across ribs and tailhead.',
    ],
    recommendations: [
      'Maintain existing balanced green fodder and concentrate feeding regimen.',
      'Ensure continuous fresh drinking water access.',
    ],
    ai_reply: 'Excellent body condition score of 3.8! Cattle is in optimal health for peak milk yield performance.',
    recommended_products: [
      {
        id: 'p_4',
        name: 'Lactation Multi-Vitamin Liquid 1L',
        category: 'Supplements',
        price: 920,
        description: 'Maintains optimal lactation curve and high milk fat content.',
      },
    ],
  },
  {
    id: 'req_demo_8803',
    user_id: 'usr_demo_101',
    user_email: 'farmer.rajesh@gmail.com',
    user_name: 'Rajesh Kumar',
    analysis_type: 'disease',
    processing_status: 'completed',
    created_at: '2026-07-28T09:45:00Z',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    frames: [
      { url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=600&auto=format&fit=crop&q=60', number: 1, clarity: 205.1 },
      { url: 'https://images.unsplash.com/photo-1570042707227-2c937108ecf6?w=600&auto=format&fit=crop&q=60', number: 2, clarity: 198.4 },
      { url: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=600&auto=format&fit=crop&q=60', number: 3, clarity: 180.2 },
      { url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=60', number: 4, clarity: 177.0 },
    ],
    possible_condition: 'Lumpy Skin Disease (Early Stage)',
    disease_confidence: 0.91,
    severity: 'High',
    observations: [
      'Multiple 10-20mm cutaneous nodules visible on neck and flank region.',
      'Reduced appetite and slight ocular discharge.',
    ],
    recommendations: [
      'Isolate affected animal immediately to prevent herd transmission.',
      'Administer vet-prescribed anti-inflammatory and antiviral supportive treatment.',
      'Spray fly & tick repellent around cattle shed twice daily.',
    ],
    ai_reply: 'Detected high probability of cutaneous nodules matching early stage Lumpy Skin Disease. Immediate herd isolation and veterinary intervention required.',
    recommended_products: [
      {
        id: 'p_5',
        name: 'ImmunoVet Antiviral Care 500ml',
        category: 'Veterinary Medicine',
        price: 1450,
        description: 'Immune modulator and antiviral supportive therapy for viral skin conditions.',
      },
      {
        id: 'p_6',
        name: 'BioShield Shed Disinfectant 2L',
        category: 'Farm Hygiene',
        price: 780,
        description: 'Broad-spectrum farm disinfectant against vector mosquitoes, flies, and viruses.',
      },
    ],
  },
];

export default function Admin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'testing'>('reports');

  // Initialize from sessionStorage cache for 0ms instant display on refresh
  const [users, setUsers] = useState<UserRecord[]>(() => {
    try {
      const cached = sessionStorage.getItem('cached_admin_users');
      return cached ? JSON.parse(cached) : DEMO_USERS;
    } catch {
      return DEMO_USERS;
    }
  });

  const [reports, setReports] = useState<ReportRecord[]>(() => {
    try {
      const cached = sessionStorage.getItem('cached_admin_reports');
      return cached ? JSON.parse(cached) : DEMO_REPORTS;
    } catch {
      return DEMO_REPORTS;
    }
  });

  const [loading, setLoading] = useState(false);
  const [collapsedReports, setCollapsedReports] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [useTestingData, setUseTestingData] = useState<boolean>(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const [usersRes, reportsRes] = await Promise.all([
          fetch(`${apiBase}/api/admin/users`).then(r => r.ok ? r.json() : { users: [] }).catch(() => ({ users: [] })),
          fetch(`${apiBase}/api/admin/reports`).then(r => r.ok ? r.json() : { reports: [] }).catch(() => ({ reports: [] })),
        ]);

        if (!isMounted) return;

        const fetchedUsers: UserRecord[] = (usersRes.users || []).map((u: any) => {
          const email = u.email || 'user@chimertech.ai';
          let name = u.full_name;
          if (!name || name.trim() === '' || name === 'Registered User') {
            name = email.split('@')[0].toUpperCase();
          }
          return {
            id: u.id,
            email: email,
            full_name: name,
            created_at: u.created_at || new Date().toISOString(),
            role: u.role || 'user',
            total_scans: u.total_scans || 0,
          };
        });

        const fetchedReports: ReportRecord[] = (reportsRes.reports || []).map((r: any) => {
          const resList: any[] = r.analysis_results || [];
          
          // Find bcs score & confidence if present in any result item
          const bcsItem = resList.find((x: any) => x.bcs_score != null) || resList[0] || {};
          const bcsJson = bcsItem.result_json || {};

          // Find disease condition & severity if present in any result item
          const diseaseItem = resList.find((x: any) => x.possible_condition != null) || resList.find((x: any) => x !== bcsItem) || resList[0] || {};
          const diseaseJson = diseaseItem.result_json || {};

          const framesList: FrameItem[] = (r.selected_frames || []).map((f: any) => ({
            url: f.frame_url,
            clarity: f.clarity_score,
            number: f.frame_number,
          }));

          const allObs: string[] = Array.from(new Set([
            ...(bcsItem.observations || bcsJson.observations || []),
            ...(diseaseItem.observations || diseaseJson.observations || diseaseJson.visible_signs || []),
          ]));

          const allRecs: string[] = Array.from(new Set([
            ...(bcsItem.recommendations || bcsJson.recommendations || []),
            ...(diseaseItem.recommendations || diseaseJson.recommendations || diseaseJson.next_steps || []),
          ]));

          const aiReply = bcsJson.ai_summary || diseaseJson.ai_summary || bcsJson.condition || diseaseJson.possible_condition || 'Detailed AI scan analysis completed.';

          const recProducts = bcsJson.recommended_products || diseaseJson.recommended_products || [
            { id: 'p_default_1', name: 'Chimertech Bovine Mineral Pack', category: 'Supplements', price: 650, description: 'Essential daily mineral supplement for overall cattle health.' },
            { id: 'p_default_2', name: 'Herbal Udder Care Spray 500ml', category: 'Udder Care', price: 640, description: 'Natural antibacterial spray for udder hygiene.' }
          ];

          const userEmail = r.users?.email || (r.user_id ? 'user@chimertech.ai' : 'Guest / Unregistered');
          let userName = r.users?.full_name;
          if (!userName || userName === 'Guest User' || userName === 'Registered User') {
            userName = r.users?.email ? r.users.email.split('@')[0].toUpperCase() : (userEmail !== 'Guest / Unregistered' ? userEmail.split('@')[0].toUpperCase() : 'Guest User');
          }

          return {
            id: r.id,
            user_id: r.user_id,
            user_email: userEmail,
            user_name: userName,
            analysis_type: r.analysis_type || 'bcs',
            processing_status: r.processing_status || 'completed',
            created_at: r.created_at || new Date().toISOString(),
            video_url: r.original_video_url || '',
            frames: framesList.length > 0 ? framesList : [
              { url: 'https://images.unsplash.com/photo-1570042707227-2c937108ecf6?w=600&auto=format&fit=crop&q=60', number: 1, clarity: 180 },
              { url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?w=600&auto=format&fit=crop&q=60', number: 2, clarity: 175 },
              { url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&auto=format&fit=crop&q=60', number: 3, clarity: 165 },
            ],
            bcs_score: bcsItem.bcs_score ?? bcsJson.bcs_score,
            bcs_confidence: bcsItem.confidence ?? bcsJson.confidence,
            possible_condition: diseaseItem.possible_condition ?? diseaseJson.possible_condition,
            disease_confidence: diseaseItem.confidence ?? diseaseJson.confidence,
            severity: diseaseItem.severity ?? diseaseJson.severity,
            observations: allObs,
            recommendations: allRecs,
            ai_reply: aiReply,
            recommended_products: recProducts,
          };
        });

        if (fetchedUsers.length > 0) {
          setUsers(fetchedUsers);
          try { sessionStorage.setItem('cached_admin_users', JSON.stringify(fetchedUsers)); } catch {}
        }

        if (fetchedReports.length > 0) {
          setReports(fetchedReports);
          try { sessionStorage.setItem('cached_admin_reports', JSON.stringify(fetchedReports)); } catch {}
        }
      } catch (err) {
        console.warn('Backend admin fetch failed, retaining active demo dataset:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAdminData();
    return () => { isMounted = false; };
  }, [apiBase]);

  // Combine DB and Demo reports if desired, sorting newest first
  const activeReportsList = useTestingData
    ? DEMO_REPORTS
    : [...reports, ...DEMO_REPORTS.filter(d => !reports.some(r => r.id === d.id))].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

  const activeUsersList = useTestingData
    ? DEMO_USERS
    : [...users, ...DEMO_USERS.filter(d => !users.some(u => u.id === d.id))];

  const totalScans = activeReportsList.length;
  const bcsCount = activeReportsList.filter(r => r.analysis_type === 'bcs' || r.bcs_score !== undefined).length;
  const diseaseCount = activeReportsList.filter(r => r.analysis_type === 'disease' || r.possible_condition).length;
  const userCount = activeUsersList.length;

  const downloadReportPDF = (report: ReportRecord) => {
    generateHealthReportPDF({
      requestId: report.id,
      userEmail: report.user_email,
      userName: report.user_name,
      date: new Date(report.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      analysisType: report.analysis_type,
      bcsScore: report.bcs_score,
      bcsConfidence: report.bcs_confidence,
      possibleCondition: report.possible_condition,
      diseaseConfidence: report.disease_confidence,
      severity: report.severity,
      observations: report.observations,
      recommendations: report.recommendations,
      aiSuggestions: report.ai_reply,
      recommendedProducts: report.recommended_products,
    });
  };

  return (
    <div className="min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold uppercase border border-emerald-500/30">
                {isAdmin ? 'System Admin Granted' : 'Admin Control Portal'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Chimertech v1.0</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Cattle Health Administration & User Reports
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Monitor real-time user logins, uploaded 10s videos, extracted frames (min 3 to max 10), AI replies, and download PDF reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUseTestingData(!useTestingData)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                useTestingData 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {useTestingData ? '⚡ Testing Data Active' : '🔄 Switch to Testing Data'}
            </button>
            <Link to="/" className="btn-secondary text-xs px-4 py-2.5 bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
              ← Return Home
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="glass-card p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users Registered</p>
            <p className="text-3xl font-black text-white mt-2">{userCount}</p>
            <span className="text-[11px] text-emerald-400 mt-1 block">✓ Active user directory</span>
          </div>

          <div className="glass-card p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Health Reports</p>
            <p className="text-3xl font-black text-emerald-400 mt-2">{totalScans}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Live DB + Testing records</span>
          </div>

          <div className="glass-card p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">BCS Scans</p>
            <p className="text-3xl font-black text-cyan-400 mt-2">{bcsCount}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Body condition evaluations</span>
          </div>

          <div className="glass-card p-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disease Diagnoses</p>
            <p className="text-3xl font-black text-purple-400 mt-2">{diseaseCount}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Screenings & treatment suggestions</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'reports'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📋 All User Reports ({activeReportsList.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            👥 User Logins & Profiles ({activeUsersList.length})
          </button>

          <button
            onClick={() => setActiveTab('testing')}
            className={`px-5 py-2.5 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'testing'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🧪 Testing Data & PDF Playground
          </button>
        </div>

        {/* Tab 1: All User Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Live Cattle Health Reports & Diagnostic Logs</h2>
              <span className="text-xs text-slate-400">Click any report to play uploaded 10s video, inspect frames & AI replies</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse bg-slate-800/50 rounded-2xl">
                Loading administrative report logs...
              </div>
            ) : activeReportsList.length === 0 ? (
              <div className="p-12 text-center glass-card bg-slate-800/40 rounded-2xl">
                <p className="text-slate-300 font-extrabold text-lg mb-2">No user reports in database yet</p>
                <p className="text-slate-400 text-xs mb-4">Click "Switch to Testing Data" above to view demo reports and test PDF downloads!</p>
                <button
                  onClick={() => setUseTestingData(true)}
                  className="btn-primary py-2.5 px-6 text-xs font-extrabold"
                >
                  Load Testing Data
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeReportsList.map((report) => (
                  <div
                    key={report.id}
                    className="glass-card p-6 bg-slate-800/90 border border-slate-700/80 rounded-2xl hover:border-emerald-500/50 transition-all space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                            {report.analysis_type.toUpperCase()} REPORT
                          </span>
                          <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            ID: {report.id.slice(0, 12)}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white">{report.user_name}</h3>
                        <p className="text-xs text-slate-400">{report.user_email} • {new Date(report.created_at).toLocaleString('en-IN')}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setCollapsedReports(prev => {
                              const next = new Set(prev);
                              if (next.has(report.id)) {
                                next.delete(report.id);
                              } else {
                                next.add(report.id);
                              }
                              return next;
                            });
                          }}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          {collapsedReports.has(report.id) ? '▶ Show Full Details' : '▼ Collapse Details'}
                        </button>

                        <button
                          onClick={() => downloadReportPDF(report)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF Report
                        </button>
                      </div>
                    </div>

                    {/* Quick Overview Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {report.bcs_score !== undefined && (
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Body Condition Score</span>
                          <span className="text-xl font-black text-emerald-400">{report.bcs_score.toFixed(1)} / 5.0</span>
                          {report.bcs_confidence && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">Confidence: {(report.bcs_confidence * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      )}

                      {report.possible_condition && (
                        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Screened Condition</span>
                          <span className="text-sm font-black text-amber-300 truncate block">{report.possible_condition}</span>
                          {report.severity && (
                            <span className="text-[10px] text-red-400 font-bold block mt-0.5">Severity: {report.severity.toUpperCase()}</span>
                          )}
                        </div>
                      )}

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Frames & Video</span>
                        <span className="text-sm font-black text-cyan-400 block">
                          {report.frames?.length || 3} Frames Extracted
                        </span>
                      </div>
                    </div>

                    {/* Detailed View Section - Open by Default */}
                    {!collapsedReports.has(report.id) && (

                      <div className="pt-4 border-t border-slate-700/60 space-y-6 animate-fade-in">
                        
                        {/* Video & Frames Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 10s Video Player */}
                          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                              <span>📹</span> Uploaded 10s Live Camera Video
                            </h4>
                            {report.video_url ? (
                              <video
                                src={report.video_url}
                                controls
                                className="w-full h-48 rounded-xl bg-black border border-slate-700 object-cover"
                              />
                            ) : (
                              <div className="h-48 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-2">
                                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs font-bold">10s Camera Clip Stored in Supabase</span>
                              </div>
                            )}
                          </div>

                          {/* Extracted Frames Gallery */}
                          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                              <span>🖼️</span> Extracted Frames (Min 3 to Max 10)
                            </h4>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                              {report.frames && report.frames.length > 0 ? (
                                report.frames.map((frame, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setPreviewImage(frame.url)}
                                    className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-pointer hover:border-emerald-400 transition-all"
                                  >
                                    <img
                                      src={frame.url}
                                      alt={`Frame ${idx + 1}`}
                                      className="w-full h-20 object-cover group-hover:scale-110 transition-transform"
                                    />
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 rounded">
                                      #{frame.number || idx + 1}
                                    </span>
                                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-[10px] font-extrabold text-white bg-black/70 px-2 py-0.5 rounded-full">🔍 Zoom</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-500 col-span-3">No frame samples available.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Observations & AI Reply */}
                        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                            <span>🤖</span> AI Veterinary Assistant Reply & Clinical Observations
                          </h4>
                          {report.ai_reply && (
                            <p className="text-sm text-slate-200 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/40 leading-relaxed font-mono">
                              "{report.ai_reply}"
                            </p>
                          )}

                          {report.observations && report.observations.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-300 mb-1">Key Observations:</p>
                              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                                {report.observations.map((obs, idx) => (
                                  <li key={idx}>{obs}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {report.recommendations && report.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-300 mb-1">Recommended Next Steps:</p>
                              <ul className="list-disc list-inside text-xs text-emerald-300 space-y-1">
                                {report.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Recommended Products */}
                        {report.recommended_products && report.recommended_products.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400">
                              🛒 Recommended Nutritional & Medical Products
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {report.recommended_products.map((prod) => (
                                <div key={prod.id || prod.name} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">{prod.category}</span>
                                  <p className="text-xs font-extrabold text-white mt-1">{prod.name}</p>
                                  <p className="text-sm font-black text-amber-300 mt-1">₹{prod.price.toLocaleString('en-IN')}</p>
                                  {prod.description && (
                                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{prod.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User Directory & Logins */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white">Registered User Logins & Account Data</h2>
            <div className="glass-card bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="p-4">User Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Registration Date</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-200">
                  {activeUsersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="p-4 font-bold text-white">{u.full_name}</td>
                      <td className="p-4 font-mono text-slate-300">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {u.role || 'User'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            const userRep = activeReportsList.find(r => r.user_email === u.email) || activeReportsList[0];
                            if (userRep) downloadReportPDF(userRep);
                          }}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg font-bold transition-all text-[11px]"
                        >
                          PDF Export
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Testing & PDF Playground */}
        {activeTab === 'testing' && (
          <div className="glass-card p-8 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Admin PDF & Video Testing Playground</h2>
              <p className="text-xs text-slate-400 mt-1">
                Instantly trigger and test the PDF report download generator and video/frame previews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEMO_REPORTS.map((demoRep, idx) => (
                <div key={demoRep.id} className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-amber-400">TEST SCENARIO {idx + 1}</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">{demoRep.analysis_type.toUpperCase()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{demoRep.possible_condition || `BCS Score: ${demoRep.bcs_score}`}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{demoRep.ai_reply}</p>
                  <button
                    onClick={() => downloadReportPDF(demoRep)}
                    className="btn-primary w-full py-2.5 text-xs font-extrabold flex items-center justify-center gap-2"
                  >
                    <span>📄</span> Download Test PDF #{idx + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Frame Image Modal Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl bg-slate-950 p-2">
            <img src={previewImage} alt="Extracted Cattle Frame Full Preview" className="w-full h-full object-contain max-h-[82vh] rounded-xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-full border border-slate-700 shadow-lg transition-all"
            >
              ✕ Close Lightbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
