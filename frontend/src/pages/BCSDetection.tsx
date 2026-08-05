import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts } from '@/lib/api';
import VideoUploader from '@/components/ui/VideoUploader';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import BCSResultCard from '@/components/ui/BCSResultCard';
import ProductCard from '@/components/ui/ProductCard';
import ChatBot from '@/components/ui/ChatBot';
import Disclaimer from '@/components/ui/Disclaimer';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { Product } from '@/types';
import { generateHealthReportPDF } from '@/utils/pdfGenerator';
import { getBCSProductRecommendations } from '@/utils/bcsProducts';

export default function BCSDetection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { state, run, startAnalysis, reset } = useVideoAnalysis('bcs');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { message: 'Please log in to use BCS Scanning.' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  const isProcessing = ['uploading','extracting','filtering_blur','removing_duplicates','ranking','sending_ai','analysing'].includes(state.status);

  const bcsRecInfo = state.bcsResult
    ? getBCSProductRecommendations(state.bcsResult.bcs_score, allProducts)
    : { products: [], guidance: '' };

  const recProducts = bcsRecInfo.products;

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-24 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        {/* Header with Realistic Banner Image */}
        <div className="glass-card p-6 sm:p-8 lg:p-10 bg-white border border-slate-200/90 rounded-3xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-6 lg:gap-8 mb-10 transition-all duration-300 hover:border-slate-300">
          <div className="flex-1 space-y-2.5">
            <div className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="section-label text-emerald-700 font-extrabold tracking-widest uppercase text-[11px]">Cattle Analysis</p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">BCS Score Detection</h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed font-semibold">
              Upload cattle photo or video (up to 60s). Instant end-to-end frame extraction, AI vision assessment, and PDF report generation.
            </p>
          </div>
          <div className="w-full md:w-64 lg:w-72 h-44 sm:h-48 rounded-2xl overflow-hidden border-2 border-emerald-300/80 shadow-lg shadow-emerald-500/10 flex-shrink-0 relative group">
            <img src="/bcs_banner.png" alt="BCS Detection AI" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
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
            {state.status !== 'idle' && state.status !== 'completed' && state.status !== 'error' && (
              <ProcessingProgress status={state.status} />
            )}

            {/* Error Message with Retry */}
            {state.status === 'error' && (
              <div className="glass-card p-6 border-rose-200 bg-rose-50 animate-fade-in space-y-3 rounded-3xl">
                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <div>
                    <p className="text-sm font-black text-rose-900 mb-1">Analysis Issue</p>
                    <p className="text-xs text-slate-900 font-bold">{state.error}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  {state.framePaths.length > 0 && (
                    <button
                      onClick={() => startAnalysis(user?.id)}
                      className="btn-primary text-xs py-2 px-4 font-black flex items-center gap-1.5"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Retry AI Analysis
                    </button>
                  )}
                  <button onClick={reset} className="btn-secondary text-xs py-2 px-4 text-slate-900 font-black">
                    Upload New Media
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {state.status === 'completed' && state.bcsResult ? (
              <>
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-300 p-4 rounded-3xl shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">BCS Analysis Complete</h3>
                    <p className="text-xs text-slate-900 font-bold">Health report is ready to save and print.</p>
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
                        recommendedProducts: recProducts.map(p => ({
                          name: p.name,
                          category: p.category,
                          price: p.price,
                          description: p.description,
                          product_page_url: p.product_page_url,
                        })),
                      });
                    }}
                    className="btn-primary py-2.5 px-5 text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <span>📄</span> Download PDF Report
                  </button>
                </div>

                <BCSResultCard result={state.bcsResult} />
                <Disclaimer type="ai" />

                {recProducts.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Targeted Product Recommendations</h3>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{bcsRecInfo.guidance}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recProducts.map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          reason={bcsRecInfo.guidance}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300">
                    <p className="text-xs font-black text-amber-950">{bcsRecInfo.guidance}</p>
                  </div>
                )}

                <button onClick={reset} className="btn-ghost text-xs text-slate-900 font-black hover:text-emerald-700">
                  ← Analyse another video / photo
                </button>
              </>
            ) : state.status === 'completed' && !state.bcsResult ? (
              <SkeletonCard />
            ) : null}
          </div>

          {/* Right column: info panel */}
          {state.status === 'idle' && (
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
              <div className="glass-card p-5 bg-white border border-slate-300 shadow-sm rounded-3xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">Automated Pipeline</h3>
                <ol className="space-y-3">
                  {[
                    'Video / Image uploaded securely',
                    'Automated frame extraction & sharpness filtering',
                    'Multi-spectral duplicate removal (pHash/dHash)',
                    'Instant Chimertech AI Vision scoring',
                    'Download official PDF Diagnostic Report',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-slate-900 font-bold">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* BCS scale */}
              <div className="glass-card p-5 bg-white border border-slate-300 shadow-sm rounded-3xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">BCS Scale Reference</h3>
                <div className="space-y-3">
                  {[
                    [1, 'Emaciated', '#ef4444', 'NutraKine Gain + parasite assessment'],
                    [2, 'Thin', '#f59e0b', 'NutraKine Gain + Liver Tonic / Phos+'],
                    [3, 'Ideal', '#10b981', 'Milk Booster / Fertility Booster / Calcdex'],
                    [4, 'Fat', '#f59e0b', 'Ration correction required'],
                    [5, 'Obese', '#ef4444', 'Veterinary review required'],
                  ].map(([score, label, color, rule]) => (
                    <div key={String(score)} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black" style={{ color: color as string }}>BCS {score}</span>
                        <span className="text-xs font-black text-slate-900 flex-1">{label}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-900 mt-1">{rule as string}</p>
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
