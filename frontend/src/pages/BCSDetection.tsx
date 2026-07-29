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
          <h1 className="text-display font-black text-white mb-3">BCS Score Detection</h1>
          <p className="text-grey-400 text-sm max-w-xl leading-relaxed">
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
                  <div className="glass-card p-5 border-emerald-500/30 bg-emerald-500/[0.04] text-center space-y-3 animate-fade-in">
                    <div>
                      <p className="text-sm font-bold text-emerald-400">✨ Frames successfully cleaned & stored!</p>
                      <p className="text-xs text-grey-400 mt-1">
                        Review your {frames.length} high-clarity frames above. Click below to start AI BCS scoring.
                      </p>
                    </div>
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-sm py-2.5 px-6 font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
                    >
                      🤖 Analyse Frames with AI
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
                    <p className="text-sm font-semibold text-red-400 mb-1">Analysis Issue</p>
                    <p className="text-xs text-grey-400">{state.error}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {state.framePaths.length > 0 && (
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-xs py-2 px-4 bg-emerald-500 text-black font-semibold"
                    >
                      🔄 Retry AI Analysis
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
                <BCSResultCard result={state.bcsResult} />
                <Disclaimer type="ai" />
                {recProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">Recommended Products</h3>
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
                <button onClick={reset} className="btn-ghost text-xs text-grey-500">
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
              <div className="glass-card p-5">
                <h3 className="text-xs font-semibold text-white mb-4">Processing Pipeline</h3>
                <ol className="space-y-3">
                  {[
                    'Video uploaded to Supabase',
                    'Extract 1 frame per second',
                    'Remove blurry frames (Laplacian filter)',
                    'Remove duplicate frames (pHash filter)',
                    'Select top 10 frames by clarity score',
                    'Review cleaned frames in UI',
                    'Send to Gemini AI Vision for BCS score',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-grey-500">
                      <span className="w-5 h-5 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-grey-400">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* BCS scale */}
              <div className="glass-card p-5">
                <h3 className="text-xs font-semibold text-white mb-4">BCS Scale Reference</h3>
                <div className="space-y-2">
                  {[
                    [1, 'Emaciated', '#ef4444'],
                    [2, 'Thin', '#f59e0b'],
                    [3, 'Ideal', '#22c55e'],
                    [4, 'Fat', '#f59e0b'],
                    [5, 'Obese', '#ef4444'],
                  ].map(([score, label, color]) => (
                    <div key={String(score)} className="flex items-center gap-3">
                      <span className="text-sm font-black" style={{ color: color as string }}>{score}</span>
                      <span className="text-xs text-grey-500 flex-1">{label}</span>
                      <div className="h-1 w-16 rounded-full bg-white/[0.06]">
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
