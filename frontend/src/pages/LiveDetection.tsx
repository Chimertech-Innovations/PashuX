import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, analyseInstantLive } from '@/lib/api';
import LiveCameraScanner from '@/components/ui/LiveCameraScanner';
import BCSResultCard from '@/components/ui/BCSResultCard';
import DiseaseResultCard from '@/components/ui/DiseaseResultCard';
import ProductCard from '@/components/ui/ProductCard';
import ChatBot from '@/components/ui/ChatBot';
import Disclaimer from '@/components/ui/Disclaimer';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { Product, BCSResult, DiseaseResult } from '@/types';
import { generateHealthReportPDF } from '@/utils/pdfGenerator';


// Rule-based BCS product recommendations
function getBCSProducts(score: number, allProducts: Product[]): Product[] {
  if (score < 2.5) {
    return allProducts.filter(p =>
      p.recommended_for?.some(r => ['low bcs', 'body condition', 'nutrition', 'supplement'].includes(r.toLowerCase()))
    );
  }
  return [];
}

// Rule-based disease product recommendations
const DISEASE_PRODUCT_MAP: Record<string, string[]> = {
  mastitis:   ['cmt-kit', 'quadmastest', 'finekine', 'iogiene', 'moofoam'],
  tick:       ['tic-tick-tic'],
  udder:      ['finekine', 'iogiene', 'moofoam'],
  'milk quality': ['mbrt-test', 'resazurin-test', 'bcp-test'],
};

function getDiseaseProducts(result: DiseaseResult, allProducts: Product[]): Product[] {
  const condition = result.possible_condition.toLowerCase();
  const ids = new Set<string>();

  for (const [keyword, productIds] of Object.entries(DISEASE_PRODUCT_MAP)) {
    if (condition.includes(keyword) || result.visible_signs.some(s => s.toLowerCase().includes(keyword))) {
      productIds.forEach(id => ids.add(id));
    }
  }

  return allProducts.filter(p => ids.has(p.id));
}

export default function LiveDetection() {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [bcsResult, setBcsResult] = useState<BCSResult | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'bcs' | 'disease'>('all');

  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  // Handle instant live camera capture file (snapshot or 10s clip)
  const handleLiveMediaCapture = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await analyseInstantLive(file, user?.id);
      setRequestId(res.request_id);
      setBcsResult(res.bcs_result);
      setDiseaseResult(res.disease_result);
      if (res.frame_urls && res.frame_urls.length > 0) {
        setCapturedFrames(res.frame_urls);
      }
    } catch (err: any) {
      setError(err.message || 'AI live analysis encountered an issue. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const bcsRecs = bcsResult ? getBCSProducts(bcsResult.bcs_score, allProducts) : [];
  const diseaseRecs = diseaseResult ? getDiseaseProducts(diseaseResult, allProducts) : [];
  const combinedRecs = Array.from(new Set([...bcsRecs, ...diseaseRecs]));

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-20 sm:pb-24 px-3 sm:px-6 max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-label">Real-Time Camera Scan</span>
            <span className="badge-green text-[10px] uppercase font-bold tracking-wider animate-pulse">Live 10s Auto-Shutoff</span>
          </div>
          <h1 className="text-display font-black text-slate-900 mb-2">Live BCS & Disease Detection</h1>
          <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-medium">
            Turn on the camera stream to scan your cattle. Results for Body Condition Score (BCS) & Disease Screening appear directly below the live video container in real time!
          </p>
        </div>

        {/* 1. TOP CONTAINER: Live Camera Stream */}
        <div className="space-y-4">
          <LiveCameraScanner
            onFile={handleLiveMediaCapture}
            onInstantSnapshot={handleLiveMediaCapture}
            disabled={isAnalyzing}
          />

          {/* Real-time status banner under video container */}
          {isAnalyzing && (
            <div className="glass-card p-4 border-emerald-300 bg-emerald-50 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">ANALYZING LIVE CATTLE FEED</p>
                  <p className="text-[11px] text-slate-600 font-medium">Processing live snapshot frame through Chimertech Neural Vision models...</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">Please wait...</span>
            </div>
          )}

          {error && (
            <div className="glass-card p-4 border-rose-300 bg-rose-50 flex items-center gap-3 text-rose-700 text-xs font-medium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-rose-600 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="font-bold flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="btn-ghost text-xs text-rose-600 hover:text-rose-800 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 2. BOTTOM CONTAINER: Live Detailed Results directly below live video feed */}
        {(bcsResult || diseaseResult || isAnalyzing) && (
          <div className="space-y-6 pt-4 border-t border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Live Analysis Results
                  <span className="badge-green text-[10px] uppercase font-bold tracking-wider">Updated Live</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Detailed AI assessment of your cattle / buffalo below the live video container</p>
              </div>


              {/* View Tabs */}
              {(bcsResult || diseaseResult) && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Results
                  </button>
                  <button
                    onClick={() => setActiveTab('bcs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'bcs'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    BCS Score
                  </button>
                  <button
                    onClick={() => setActiveTab('disease')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'disease'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Disease Check
                  </button>
                </div>
              )}
            </div>

            {(bcsResult || diseaseResult) && (
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-emerald-900">Live Camera Health Scan Complete</h3>
                  <p className="text-xs text-emerald-700">Combined BCS and Disease report ready to download.</p>
                </div>
                <button
                  onClick={() => {
                    generateHealthReportPDF({
                      requestId: requestId || `live_${Date.now()}`,
                      userEmail: user?.email,
                      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                      analysisType: 'combined',
                      bcsScore: bcsResult?.bcs_score,
                      bcsConfidence: bcsResult?.confidence,
                      possibleCondition: diseaseResult?.possible_condition,
                      diseaseConfidence: diseaseResult?.confidence,
                      severity: diseaseResult?.severity,
                      observations: [
                        ...(bcsResult?.observations || []),
                        ...(diseaseResult?.visible_signs || []),
                      ],
                      recommendations: [
                        ...(bcsResult?.recommendations || []),
                        ...(diseaseResult?.next_steps || []),
                      ],
                      recommendedProducts: combinedRecs,
                    });
                  }}
                  className="btn-primary py-2.5 px-5 text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <span>📄</span> Download PDF Report
                </button>
              </div>
            )}

            {/* Skeleton Loading Card while analyzing */}

            {isAnalyzing && !bcsResult && !diseaseResult && (
              <SkeletonCard />
            )}

            {/* Detailed BCS Card */}
            {(activeTab === 'all' || activeTab === 'bcs') && bcsResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Live Body Condition Scoring (BCS)
                  </h3>
                </div>
                <BCSResultCard result={bcsResult} />
              </div>
            )}

            {/* Detailed Disease Screening Card */}
            {(activeTab === 'all' || activeTab === 'disease') && diseaseResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Live Disease & Health Screening
                  </h3>
                </div>
                <DiseaseResultCard result={diseaseResult} />
              </div>
            )}

            {/* Captured Snapshot Frame Preview */}
            {capturedFrames.length > 0 && (
              <div className="glass-card p-4 space-y-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <p className="text-xs font-black text-slate-900">Live Captured Snapshot</p>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {capturedFrames.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Live frame ${idx + 1}`}
                      className="h-24 rounded-xl object-cover bg-slate-900 border border-slate-200 shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            <Disclaimer type="vet" />

            {/* Combined Recommended Products */}
            {combinedRecs.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-slate-900 mb-4">Recommended Products for Identified Live Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {combinedRecs.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      reason="Suggested for cattle health based on live camera scan"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info panel when idle */}
        {!bcsResult && !diseaseResult && !isAnalyzing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-3 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">How Real-Time Camera Scan Works</h3>
              <ol className="space-y-3 text-xs text-slate-900 font-bold">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-[10px] font-black">1</span>
                  Turn on live camera at top and align cattle in grid overlay
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-[10px] font-black">2</span>
                  Click "START 10s LIVE SCAN"
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-[10px] font-black">3</span>
                  Instant frame snapshot is analyzed and results update DIRECTLY BELOW the live video feed!
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-[10px] font-black">4</span>
                  After 10 seconds, camera hardware automatically shuts OFF
                </li>
              </ol>
            </div>

            <div className="glass-card p-5 space-y-3 border border-emerald-200 bg-emerald-50/80 shadow-sm rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-950 mb-1">Cattle & Buffalo AI Intelligence</p>
                  <p className="text-xs text-slate-800 leading-relaxed font-bold">
                    Evaluates ribs, spine, flank hollows, udder symmetry, coat condition, and posture directly from live camera feed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Interactive AI Chatbot */}
      <ChatBot
        requestId={requestId || undefined}
        userId={user?.id}
        analysisType="combined"
        analysisContext={{ bcs: bcsResult, disease: diseaseResult }}
      />
    </div>
  );
}
