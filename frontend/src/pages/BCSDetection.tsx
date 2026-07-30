import { useEffect, useState } from 'react';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts } from '@/lib/api';
import VideoUploader from '@/components/ui/VideoUploader';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import BCSResultCard from '@/components/ui/BCSResultCard';
import FrameGallery from '@/components/ui/FrameGallery';
import ProductCard from '@/components/ui/ProductCard';
import ChatBot from '@/components/ui/ChatBot';
import Disclaimer from '@/components/ui/Disclaimer';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { Product } from '@/types';
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

const FRAMES_READY_STATUSES = new Set([
  'frames_ready', 'sending_ai', 'analysing', 'completed', 'error'
]);

export default function BCSDetection() {
  const { user } = useAuth();
  const { state, run, startAnalysis, reset } = useVideoAnalysis('bcs');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  const isProcessing = ['uploading','extracting','filtering_blur','removing_duplicates','ranking','sending_ai','analysing'].includes(state.status);
  const framesReady  = FRAMES_READY_STATUSES.has(state.status) && state.frameUrls.length > 0;
  const recProducts  = state.bcsResult ? getBCSProducts(state.bcsResult.bcs_score, allProducts) : [];

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
          <p className="section-label mb-3">Cattle Analysis</p>
          <h1 className="text-display font-black text-slate-900 mb-3">BCS Score Detection</h1>
          <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-medium">
            Upload cattle photo or video (up to 60s). Our algorithm extracts, de-blurs, and de-duplicates frames into high-clarity shots before AI assessment.
          </p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            {/* Upload */}
            {state.status === 'idle' && (
              <div className="animate-fade-in">
                <VideoUploader onFile={f => run(f, user?.id)} disabled={isProcessing} />
              </div>
            )}

            {/* Processing progress indicator */}
            {state.status !== 'idle' && state.status !== 'completed' && (
              <ProcessingProgress status={state.status} />
            )}

            {/* ✅ Cleaned Frame Gallery — Shown to user as soon as frames are cleaned & ready */}
            {framesReady && (
              <div className="animate-fade-in space-y-4">
                <FrameGallery
                  frames={frames}
                  label={
                    state.status === 'completed' ? 'Frames Used for Analysis' :
                    state.status === 'frames_ready' ? 'Cleaned & Deduplicated Frames (Ready for AI)' :
                    'Cleaned Frames — AI Analysing…'
                  }
                  isLoading={state.status === 'sending_ai' || state.status === 'analysing'}
                />

                {/* Step to trigger AI analysis explicitly */}
                {state.status === 'frames_ready' && (
                  <div className="glass-card p-5 border-emerald-300 bg-emerald-50 text-center space-y-3 animate-fade-in">
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Frames successfully cleaned & stored</p>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Review your {frames.length} high-clarity frames above. Click below to start AI BCS scoring.
                      </p>
                    </div>
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-sm py-2.5 px-6 font-bold shadow-md flex items-center justify-center gap-2 mx-auto"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Analyse Frames with AI
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
                    <p className="text-sm font-bold text-rose-700 mb-1">Analysis Issue</p>
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
                      Retry AI Analysis
                    </button>
                  )}
                  <button onClick={reset} className="btn-secondary text-xs py-2 px-4">
                    Upload New Video
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {state.status === 'completed' && state.bcsResult ? (
              <>
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-black text-emerald-900">BCS Analysis Complete</h3>
                    <p className="text-xs text-emerald-700">Health report is ready to save and print.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!state.bcsResult) return;
                      generateHealthReportPDF({
                        requestId: state.requestId || `bcs_${Date.now()}`,
                        userEmail: user?.email,
                        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                        analysisType: 'bcs',
                        bcsScore: state.bcsResult.bcs_score,
                        bcsConfidence: state.bcsResult.confidence,
                        observations: state.bcsResult.observations,
                        recommendations: state.bcsResult.recommendations,
                        recommendedProducts: recProducts,
                      });
                    }}
                    className="btn-primary py-2.5 px-5 text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <span>📄</span> Download PDF Report
                  </button>
                </div>

                <BCSResultCard result={state.bcsResult} />
                <Disclaimer type="ai" />
                {recProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">Recommended Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recProducts.map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          reason={`Helpful for improving body condition (BCS ${state.bcsResult!.bcs_score.toFixed(1)})`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={reset} className="btn-ghost text-xs text-slate-500 font-bold">
                  ← Analyse another video
                </button>
              </>
            ) : state.status === 'completed' && !state.bcsResult ? (

              <SkeletonCard />
            ) : null}
          </div>

          {/* Right column: info panel */}
          {state.status === 'idle' && (
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
              <div className="glass-card p-5 bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">Processing Pipeline</h3>
                <ol className="space-y-3">
                  {[
                    'Video uploaded securely',
                    'Extract 1 frame per second',
                    'Remove blurry frames (edge sharpness filter)',
                    'Remove duplicate frames (pHash filter)',
                    'Select top 10 frames by clarity',
                    'Review cleaned frames in UI',
                    'Send to Chimertech AI Vision Engine for BCS score',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-600 font-medium">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* BCS scale */}
              <div className="glass-card p-5 bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">BCS Scale Reference</h3>
                <div className="space-y-2.5">
                  {[
                    [1, 'Emaciated', '#ef4444'],
                    [2, 'Thin', '#f59e0b'],
                    [3, 'Ideal', '#10b981'],
                    [4, 'Fat', '#f59e0b'],
                    [5, 'Obese', '#ef4444'],
                  ].map(([score, label, color]) => (
                    <div key={String(score)} className="flex items-center gap-3">
                      <span className="text-sm font-black" style={{ color: color as string }}>{score}</span>
                      <span className="text-xs font-bold text-slate-600 flex-1">{label}</span>
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div className="h-full rounded-full" style={{ width: `${(Number(score)/5)*100}%`, backgroundColor: color as string }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <Disclaimer type="ai" />
            </div>
          )}
        </div>
      </div>

      {/* AI Chatbot */}
      <ChatBot
        requestId={state.requestId || undefined}
        userId={user?.id}
        analysisType="bcs"
        analysisContext={state.bcsResult}
      />
    </div>
  );
}
