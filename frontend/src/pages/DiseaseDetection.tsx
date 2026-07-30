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
import { generateHealthReportPDF } from '@/utils/pdfGenerator';


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
          <h1 className="text-display font-black text-slate-900 mb-3">Disease Detection</h1>
          <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-medium">
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
                  <div className="glass-card p-5 border-emerald-300 bg-emerald-50 text-center space-y-3 animate-fade-in">
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Frames successfully cleaned & stored</p>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Review your {frames.length} high-clarity frames above. Click below to start AI disease screening.
                      </p>
                    </div>
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-sm py-2.5 px-6 font-bold shadow-md flex items-center justify-center gap-2 mx-auto"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Screen Frames with AI
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Error Message with Retry */}
            {state.status === 'error' && (
              <div className="glass-card p-6 border-rose-200 bg-rose-50 animate-fade-in space-y-3">
                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-rose-700 mb-1">Screening Issue</p>
                    <p className="text-xs text-slate-600">{state.error}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {state.framePaths.length > 0 && (
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Retry AI Screening
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
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-black text-emerald-900">Disease Screening Complete</h3>
                    <p className="text-xs text-emerald-700">Diagnostic report ready to save and print.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!state.diseaseResult) return;
                      generateHealthReportPDF({
                        requestId: state.requestId || `disease_${Date.now()}`,
                        userEmail: user?.email,
                        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                        analysisType: 'disease',
                        possibleCondition: state.diseaseResult.possible_condition,
                        diseaseConfidence: state.diseaseResult.confidence,
                        severity: state.diseaseResult.severity,
                        observations: state.diseaseResult.visible_signs,
                        recommendations: state.diseaseResult.next_steps,
                        recommendedProducts: recProducts,
                      });
                    }}
                    className="btn-primary py-2.5 px-5 text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <span>📄</span> Download PDF Report
                  </button>
                </div>

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
              <div className="glass-card p-5 bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">What We Screen For</h3>
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
                    <li key={item} className="flex items-start gap-2.5 text-xs text-slate-900 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-5 border border-amber-200 bg-amber-50/70 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-950 mb-1">Screening Disclaimer</p>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed">
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
