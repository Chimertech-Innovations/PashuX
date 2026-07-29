import { useEffect, useState } from 'react';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts } from '@/lib/api';
import VideoUploader from '@/components/ui/VideoUploader';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import DiseaseResultCard from '@/components/ui/DiseaseResultCard';
import FrameGallery from '@/components/ui/FrameGallery';
import ProductCard from '@/components/ui/ProductCard';
import ChatBot from '@/components/ui/ChatBot';
import Disclaimer from '@/components/ui/Disclaimer';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { DiseaseResult, Product } from '@/types';

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

export default function DiseaseDetection() {
  const { user } = useAuth();
  const { state, run, startAnalysis, reset } = useVideoAnalysis('disease');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  const isProcessing = ['uploading','extracting','filtering_blur','removing_duplicates','ranking','sending_ai','analysing'].includes(state.status);
  const framesReady  = FRAMES_READY_STATUSES.has(state.status) && state.frameUrls.length > 0;
  const recProducts  = state.diseaseResult ? getDiseaseProducts(state.diseaseResult, allProducts) : [];

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
          <p className="section-label mb-3">Cattle Screening</p>
          <h1 className="text-display font-black text-white mb-3">Disease Detection</h1>
          <p className="text-grey-400 text-sm max-w-xl leading-relaxed">
            Upload cattle photo or video (up to 60s) to screen for visible health concerns. Images are analyzed and video frames are de-blurred & deduplicated before AI screening.
          </p>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            {state.status === 'idle' && (
              <VideoUploader onFile={f => run(f, user?.id)} disabled={isProcessing} />
            )}

            {/* Processing progress */}
            {state.status !== 'idle' && state.status !== 'completed' && (
              <ProcessingProgress status={state.status} />
            )}

            {/* ✅ Cleaned Frame Gallery — Shown to user as soon as frames are cleaned */}
            {framesReady && (
              <div className="animate-fade-in space-y-4">
                <FrameGallery
                  frames={frames}
                  label={
                    state.status === 'completed' ? 'Frames Used for Screening' :
                    state.status === 'frames_ready' ? 'Cleaned & Deduplicated Frames (Ready for Screening)' :
                    'Cleaned Frames — AI Screening…'
                  }
                  isLoading={state.status === 'sending_ai' || state.status === 'analysing'}
                />

                {/* Step to trigger AI analysis explicitly */}
                {state.status === 'frames_ready' && (
                  <div className="glass-card p-5 border-emerald-500/30 bg-emerald-500/[0.04] text-center space-y-3 animate-fade-in">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">✨ Frames successfully extracted & cleaned!</p>
                      <p className="text-xs text-grey-400 mt-1">
                        Review your {frames.length} high-clarity frames above. Click below to start AI disease screening.
                      </p>
                    </div>
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-sm py-2.5 px-6 font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                    >
                      🩺 Screen Frames with AI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Message with Retry */}
            {state.status === 'error' && (
              <div className="glass-card p-6 border-red-500/20 animate-fade-in space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-1">Screening Issue</p>
                    <p className="text-xs text-grey-400">{state.error}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {state.framePaths.length > 0 && (
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-xs py-2 px-4 bg-emerald-500 text-black font-semibold"
                    >
                      🔄 Retry AI Screening
                    </button>
                  )}
                  <button onClick={reset} className="btn-secondary text-xs py-2 px-4">
                    Upload New Video
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {state.status === 'completed' && state.diseaseResult ? (
              <>
                <DiseaseResultCard result={state.diseaseResult} />
                <Disclaimer type="vet" />
                {recProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">Recommended Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recProducts.map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          reason={`Relevant to detected: ${state.diseaseResult!.possible_condition}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={reset} className="btn-ghost text-xs text-grey-500">
                  ← Screen another video
                </button>
              </>
            ) : state.status === 'completed' && !state.diseaseResult ? (
              <SkeletonCard />
            ) : null}
          </div>

          {/* Right info panel */}
          {state.status === 'idle' && (
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
              <div className="glass-card p-5">
                <h3 className="text-xs font-semibold text-white mb-4">What We Screen For</h3>
                <ul className="space-y-2.5">
                  {[
                    'Mastitis (udder swelling)',
                    'Skin conditions & tick infestation',
                    'Lameness & locomotion issues',
                    'Respiratory distress signs',
                    'Eye conditions',
                    'General body condition',
                    'Wound or injury detection',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-xs text-grey-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-5 border-amber-500/10 bg-amber-500/[0.02]">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🩺</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">Screening Disclaimer</p>
                    <p className="text-xs text-grey-500 leading-relaxed">
                      This tool screens for visible signs only. Results must be confirmed by a qualified veterinarian before any treatment is started.
                    </p>
                  </div>
                </div>
              </div>

              <Disclaimer type="vet" />
            </div>
          )}
        </div>
      </div>

      <ChatBot
        requestId={state.requestId || undefined}
        userId={user?.id}
        analysisType="disease"
        analysisContext={state.diseaseResult}
      />
    </div>
  );
}
