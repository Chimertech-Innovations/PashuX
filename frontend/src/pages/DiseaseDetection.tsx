import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts } from '@/lib/api';
import VideoUploader from '@/components/ui/VideoUploader';
import ProcessingProgress from '@/components/ui/ProcessingProgress';
import DiseaseResultCard from '@/components/ui/DiseaseResultCard';
import ProductCard from '@/components/ui/ProductCard';
import ChatBot from '@/components/ui/ChatBot';
import Disclaimer from '@/components/ui/Disclaimer';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { Product } from '@/types';
import { generateHealthReportPDF } from '@/utils/pdfGenerator';
import { getDiseaseProductRecommendations } from '@/utils/diseaseProducts';

export default function DiseaseDetection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { state, run, startAnalysis, reset } = useVideoAnalysis('disease');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { message: 'Please log in to use Disease Screening.' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    getProducts().then(setAllProducts).catch(() => {});
  }, []);

  const isProcessing = ['uploading','extracting','filtering_blur','removing_duplicates','ranking','sending_ai','analysing'].includes(state.status);
  const recProducts  = state.diseaseResult ? getDiseaseProductRecommendations(state.diseaseResult, allProducts) : [];

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
              <p className="section-label text-emerald-700 font-extrabold tracking-widest uppercase text-[11px]">Cattle Screening</p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">Disease Detection</h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed font-semibold">
              Upload cattle photo or video (up to 60s) to screen for visible health concerns. Automatic high-speed AI screening delivers instant diagnostic results.
            </p>
          </div>
          <div className="w-full md:w-64 lg:w-72 h-44 sm:h-48 rounded-2xl overflow-hidden border-2 border-emerald-300/80 shadow-lg shadow-emerald-500/10 flex-shrink-0 relative group">
            <img src="/disease_banner.png" alt="Disease Screening AI" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            {state.status === 'idle' && (
              <VideoUploader onFile={f => run(f, user?.id)} disabled={isProcessing} />
            )}

            {/* Processing progress */}
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
                    <p className="text-sm font-black text-rose-900 mb-1">Screening Issue</p>
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
                      Retry AI Screening
                    </button>
                  )}
                  <button onClick={reset} className="btn-secondary text-xs py-2 px-4 text-slate-900 font-black">
                    Upload New Media
                  </button>
                </div>
              </div>
            )}

            {/* Result */}
            {state.status === 'completed' && state.diseaseResult ? (
              <>
                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-300 p-4 rounded-3xl shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">Disease Screening Complete</h3>
                    <p className="text-xs text-slate-900 font-bold">Diagnostic report ready to save and print.</p>
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

                <DiseaseResultCard result={state.diseaseResult} />
                <Disclaimer type="vet" />

                {recProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">Recommended Chimertech Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recProducts.map(p => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          reason={`Recommended for screened condition: ${state.diseaseResult!.possible_condition}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={reset} className="btn-ghost text-xs text-slate-900 font-black hover:text-emerald-700">
                  ← Screen another video / photo
                </button>
              </>
            ) : state.status === 'completed' && !state.diseaseResult ? (
              <SkeletonCard />
            ) : null}
          </div>

          {/* Right info panel */}
          {state.status === 'idle' && (
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
              <div className="glass-card p-5 bg-white border border-slate-300 shadow-sm rounded-3xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4">What We Screen For</h3>
                <ul className="space-y-2.5">
                  {[
                    'Mastitis (swollen udder, abnormal milk)',
                    'Lumpy Skin Disease (nodules, scabs)',
                    'Foot & Mouth Disease (drooling, blisters)',
                    'Tick Infestation & parasite control',
                    'Suspected Theileriosis & anemia',
                    'IBR & Respiratory conditions',
                    'Bovine TB, Brucellosis & HS suspicion',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-xs text-slate-900 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card p-5 border border-amber-300 bg-amber-50/90 shadow-sm rounded-3xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-950 flex items-center justify-center flex-shrink-0 font-black">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-950 mb-1">Screening Disclaimer</p>
                    <p className="text-xs text-slate-900 font-bold leading-relaxed">
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
