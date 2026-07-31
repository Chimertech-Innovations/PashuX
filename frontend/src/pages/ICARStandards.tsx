import { Link } from 'react-router-dom';

export default function ICARStandards() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            ICAR Standards & Livestock Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            International Principles for Livestock Recording, Identification & Evaluation
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed font-normal">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              1. Purpose
            </h2>
            <p>
              The application follows internationally recognized livestock evaluation principles established for livestock identification, performance recording, and structured data management.
            </p>
          </section>

          {/* Core Modules */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Recommended ICAR Alignment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Body Condition Scoring</h3>
                <p className="text-xs text-slate-600">The application follows recognized livestock assessment principles:</p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                  <li>Visual evaluation of body fat reserves</li>
                  <li>Consistent scoring methodology</li>
                  <li>Animal welfare-focused monitoring</li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Data Recording</h3>
                <p className="text-xs text-slate-600">The system supports structured electronic exchange standards:</p>
                <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                  <li>Animal identification</li>
                  <li>Historical BCS tracking</li>
                  <li>Farm-level records</li>
                  <li>Digital livestock management</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Scientific Reference */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              3. Scientific Reference
            </h2>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
              <blockquote className="italic font-semibold text-slate-900 mb-2">
                "BCS estimation follows established dairy cattle body condition scoring methodologies used in livestock management research."
              </blockquote>
            </div>
          </section>

          {/* AI + ICAR Alignment */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              4. AI + ICAR Alignment
            </h2>
            <p>The application combines:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-xs text-slate-900">Traditional Livestock Evaluation</h4>
                <p className="text-[11px] text-slate-500">Visual body fat benchmarks</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-xs text-slate-900">Artificial Intelligence</h4>
                <p className="text-[11px] text-slate-500">Frame extraction algorithms</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-xs text-slate-900">Digital Farm Records</h4>
                <p className="text-[11px] text-slate-500">Cloud history tracking</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm text-center">
              To Provide: Faster Assessment • Consistent Scoring • Long-Term Monitoring
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
