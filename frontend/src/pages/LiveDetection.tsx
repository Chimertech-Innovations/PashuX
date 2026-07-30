import { useEffect, useState } from 'react';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts } from '@/lib/api';
import LiveCameraScanner from '@/components/ui/LiveCameraScanner';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import BCSResultCard from '@/components/ui/BCSResultCard';
import DiseaseResultCard from '@/components/ui/DiseaseResultCard';
import FrameGallery from '@/components/ui/FrameGallery';
import ProductCard from '@/components/ui/ProductCard';
import ChatBot from '@/components/ui/ChatBot';
import Disclaimer from '@/components/ui/Disclaimer';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { Product, BCSResult, DiseaseResult } from '@/types';

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

const FRAMES_READY_STATUSES = new Set([
  'frames_ready', 'sending_ai', 'analysing', 'completed', 'error'
]);

export default function LiveDetection() {
  const { user } = useAuth();
  const { state, run, startAnalysis, reset } = useVideoAnalysis('combined');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'bcs' | 'disease'>('all');

  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  const isProcessing = ['uploading','extracting','filtering_blur','removing_duplicates','ranking','sending_ai','analysing'].includes(state.status);
  const framesReady  = FRAMES_READY_STATUSES.has(state.status) && state.frameUrls.length > 0;

  const bcsRecs = state.bcsResult ? getBCSProducts(state.bcsResult.bcs_score, allProducts) : [];
  const diseaseRecs = state.diseaseResult ? getDiseaseProducts(state.diseaseResult, allProducts) : [];
  const combinedRecs = Array.from(new Set([...bcsRecs, ...diseaseRecs]));

  const frames = state.frameUrls.map((url, i) => ({
    url,
    frameNumber: i + 1,
    clarityScore: state.clarityScores[i],
  }));

  return (
    <div className="min-h-screen pt-24 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-label">Live Camera Scan</span>
            <span className="badge-green text-[10px] uppercase font-bold tracking-wider animate-pulse">10s Auto-Off Camera</span>
          </div>
          <h1 className="text-display font-black text-white mb-3">Live BCS & Disease Detection</h1>
          <p className="text-grey-400 text-sm max-w-xl leading-relaxed">
            Turn on live camera stream to record a 10-second clip of your cattle. Camera automatically shuts off after 10s and performs instant dual AI analysis for Body Condition Score (BCS) & Disease Screening.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-5">
            {/* Live Camera Scanner */}
            {state.status === 'idle' && (
              <LiveCameraScanner onFile={f => run(f, user?.id)} disabled={isProcessing} />
            )}

            {/* Processing Progress Bar */}
            {state.status !== 'idle' && state.status !== 'completed' && (
              <ProcessingProgress status={state.status} />
            )}

            {/* Cleaned Frames Gallery */}
            {framesReady && (
              <div className="animate-fade-in space-y-4">
                <FrameGallery
                  frames={frames}
                  label={
                    state.status === 'completed' ? 'Cleaned Frames Analyzed' :
                    state.status === 'frames_ready' ? 'Cleaned & Deduplicated Frames (Ready for Multi-AI)' :
                    'Cleaned Frames — AI Analysing BCS & Disease…'
                  }
                  isLoading={state.status === 'sending_ai' || state.status === 'analysing'}
                />

                {state.status === 'frames_ready' && (
                  <div className="glass-card p-5 border-emerald-500/30 bg-emerald-500/[0.04] text-center space-y-3 animate-fade-in">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">✨ 10-Second Live Stream Processed!</p>
                      <p className="text-xs text-grey-400 mt-1">
                        Camera turned off. Extracted & cleaned {frames.length} top clarity frames. Click below for AI BCS & Disease assessment.
                      </p>
                    </div>
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-sm py-3 px-8 font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-lg hover:scale-105 transition-all"
                    >
                      ⚡ Analyze BCS & Disease with AI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {state.status === 'error' && (
              <div className="glass-card p-6 border-red-500/20 animate-fade-in space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-1">Analysis Error</p>
                    <p className="text-xs text-grey-400">{state.error}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {state.framePaths.length > 0 && (
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-xs py-2 px-4 bg-emerald-500 text-black font-semibold"
                    >
                      🔄 Retry Dual AI Analysis
                    </button>
                  )}
                  <button onClick={reset} className="btn-secondary text-xs py-2 px-4">
                    New Live Camera Scan
                  </button>
                </div>
              </div>
            )}

            {/* Combined Completed Results */}
            {state.status === 'completed' && (state.bcsResult || state.diseaseResult) ? (
              <div className="space-y-6 animate-fade-in">
                {/* Result Tabs */}
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'all'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                        : 'text-grey-400 hover:text-white'
                    }`}
                  >
                    All Results
                  </button>
                  <button
                    onClick={() => setActiveTab('bcs')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'bcs'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                        : 'text-grey-400 hover:text-white'
                    }`}
                  >
                    BCS Score
                  </button>
                  <button
                    onClick={() => setActiveTab('disease')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'disease'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-emerald-500/30'
                        : 'text-grey-400 hover:text-white'
                    }`}
                  >
                    Disease Screening
                  </button>
                </div>

                {/* BCS Card */}
                {(activeTab === 'all' || activeTab === 'bcs') && state.bcsResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <span>📊</span> Body Condition Score (BCS)
                      </h3>
                    </div>
                    <BCSResultCard result={state.bcsResult} />
                  </div>
                )}

                {/* Disease Card */}
                {(activeTab === 'all' || activeTab === 'disease') && state.diseaseResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                        <span>🩺</span> Disease & Health Screening
                      </h3>
                    </div>
                    <DiseaseResultCard result={state.diseaseResult} />
                  </div>
                )}

                <Disclaimer type="vet" />

                {/* Combined Product Recommendations */}
                {combinedRecs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4">Targeted Health & Nutrition Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {combinedRecs.map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          reason="Recommended based on live BCS and health assessment"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={reset} className="btn-ghost text-xs text-grey-500">
                  ← Start another 10s live camera scan
                </button>
              </div>
            ) : state.status === 'completed' ? (
              <SkeletonCard />
            ) : null}
          </div>

          {/* Right Info Column */}
          {state.status === 'idle' && (
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
              <div className="glass-card p-5 space-y-3">
                <h3 className="text-xs font-extrabold text-white">How Live 10s Scan Works</h3>
                <ol className="space-y-3">
                  {[
                    'Click "Open Camera Stream" and align cattle in grid',
                    'Press "START 10s LIVE SCAN" to begin recording',
                    'Live timer counts down 10s while capturing video',
                    'At 10s mark, camera hardware automatically shuts OFF',
                    'OpenCV extracts top clarity de-blurred frames',
                    'AI performs simultaneous BCS scoring & disease check',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-grey-400">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-emerald-400">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="glass-card p-5 border-emerald-500/20 bg-emerald-500/[0.02]">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-400 mb-1">Combined AI Engine</p>
                    <p className="text-xs text-grey-400 leading-relaxed">
                      Evaluates rib prominence, spine contour, flank shadows, skin texture, udder symmetry, and posture in a single 10s video scan.
                    </p>
                  </div>
                </div>
              </div>

              <Disclaimer type="ai" />
            </div>
          )}
        </div>
      </div>

      {/* Interactive AI Assistant */}
      <ChatBot
        requestId={state.requestId || undefined}
        userId={user?.id}
        analysisType="combined"
        analysisContext={{ bcs: state.bcsResult, disease: state.diseaseResult }}
      />
    </div>
  );
}
