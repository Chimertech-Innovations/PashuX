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
import { getBCSProductRecommendations } from '@/utils/bcsProducts';
import { getDiseaseProductRecommendations } from '@/utils/diseaseProducts';

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

  const bcsRecInfo = bcsResult ? getBCSProductRecommendations(bcsResult.bcs_score, allProducts) : { products: [], guidance: '' };
  const bcsRecs = bcsRecInfo.products;
  const diseaseRecs = diseaseResult ? getDiseaseProductRecommendations(diseaseResult, allProducts) : [];
  const combinedRecs = Array.from(new Set([...bcsRecs, ...diseaseRecs]));

  return (
    <div className="min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-20 sm:pb-24 px-3 sm:px-6 max-w-full overflow-x-hidden bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Page Header with Realistic Banner Image */}
        <div className="glass-card p-6 sm:p-8 lg:p-10 bg-white border border-slate-200/90 rounded-3xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-6 lg:gap-8 transition-all duration-300 hover:border-slate-300">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="section-label text-emerald-700 font-extrabold tracking-widest uppercase text-[11px]">Real-Time Camera Scan</span>
              <span className="badge-green text-[10px] uppercase font-bold tracking-wider animate-pulse">Live 10s Auto-Shutoff</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">Live BCS & Disease Detection</h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed font-semibold">
              Turn on the camera stream to scan your cattle. Results for Body Condition Score (BCS) & Disease Screening appear directly below the live video container in real time!
            </p>
          </div>
          <div className="w-full md:w-64 lg:w-72 h-44 sm:h-48 rounded-2xl overflow-hidden border-2 border-emerald-300/80 shadow-lg shadow-emerald-500/10 flex-shrink-0 relative group">
            <img src="/live_banner.png" alt="Live Scanner AI" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        </div>

        {/* 1. TOP CONTAINER: Live Camera Stream */}
        <div className="space-y-4">
          <LiveCameraScanner
            onFile={handleLiveMediaCapture}
            onInstantSnapshot={handleLiveMediaCapture}
            disabled={isAnalyzing}
          />

          {isAnalyzing && (
            <div className="glass-card p-4 border-emerald-300 bg-emerald-50 flex items-center justify-between animate-pulse rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">ANALYZING LIVE CATTLE FEED</p>
                  <p className="text-[11px] text-slate-900 font-bold">Processing live snapshot frame through Chimertech Neural Vision models...</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-emerald-800">Please wait...</span>
            </div>
          )}

          {error && (
            <div className="glass-card p-4 border-rose-300 bg-rose-50 flex items-center gap-3 text-rose-900 text-xs font-bold rounded-2xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-rose-600 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="font-black flex-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="btn-ghost text-xs text-rose-700 hover:text-rose-900 font-black"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* 2. BOTTOM CONTAINER: Live Detailed Results */}
        {(bcsResult || diseaseResult || isAnalyzing) && (
          <div className="space-y-6 pt-4 border-t border-slate-200 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  Live Analysis Results
                  <span className="badge-green text-[10px] uppercase font-bold tracking-wider">Updated Live</span>
                </h2>
                <p className="text-xs text-slate-900 font-bold">Detailed AI assessment of your cattle / buffalo below the live video container</p>
              </div>

              {(bcsResult || diseaseResult) && (
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200 border border-slate-300">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      activeTab === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-900 hover:text-emerald-700'
                    }`}
                  >
                    All Results
                  </button>
                  <button
                    onClick={() => setActiveTab('bcs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      activeTab === 'bcs'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-900 hover:text-emerald-700'
                    }`}
                  >
                    BCS Score
                  </button>
                  <button
                    onClick={() => setActiveTab('disease')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      activeTab === 'disease'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-900 hover:text-emerald-700'
                    }`}
                  >
                    Disease Check
                  </button>
                </div>
              )}
            </div>

            {(bcsResult || diseaseResult) && (
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-300 p-4 rounded-3xl">
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Live Camera Health Scan Complete</h3>
                  <p className="text-xs text-slate-900 font-bold">Combined BCS and Disease report ready to download.</p>
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
                      recommendedProducts: combinedRecs.map(p => ({
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
            )}

            {isAnalyzing && !bcsResult && !diseaseResult && (
              <SkeletonCard />
            )}

            {(activeTab === 'all' || activeTab === 'bcs') && bcsResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Live Body Condition Scoring (BCS)
                  </h3>
                </div>
                <BCSResultCard result={bcsResult} />
              </div>
            )}

            {(activeTab === 'all' || activeTab === 'disease') && diseaseResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    Live Disease & Health Screening
                  </h3>
                </div>
                <DiseaseResultCard result={diseaseResult} />
              </div>
            )}

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

      </div>

      <ChatBot
        requestId={requestId || undefined}
        userId={user?.id}
        analysisType="combined"
        analysisContext={{ bcs: bcsResult, disease: diseaseResult }}
      />
    </div>
  );
}
