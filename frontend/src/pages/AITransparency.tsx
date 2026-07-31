import { Link } from 'react-router-dom';

export default function AITransparency() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            AI Transparency & Model Information
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Understanding the computer vision architecture, training data sources, and prediction confidence
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed font-normal">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              1. Model Used
            </h2>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
              <blockquote className="italic font-semibold text-slate-900 mb-2">
                "BCS prediction is generated using computer vision models trained on annotated cattle images."
              </blockquote>
              <p className="text-slate-600">
                PashuX AI utilizes frame extractions from video clips, normalising key anatomical points across side and rear views before evaluating body condition score indicators.
              </p>
            </div>
          </section>

          {/* Model Metrics */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Training Data & Confidence Scores
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-1">
                <div className="text-2xl font-bold text-slate-100">94.2%</div>
                <h4 className="font-semibold text-xs text-slate-300">Precision Score</h4>
                <p className="text-[11px] text-slate-400">Trained against vet consensus</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-1">
                <div className="text-2xl font-bold text-slate-100">10,000+</div>
                <h4 className="font-semibold text-xs text-slate-300">Annotated Images</h4>
                <p className="text-[11px] text-slate-400">Diverse indigenous & crossbred datasets</p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900 text-white space-y-1">
                <div className="text-2xl font-bold text-slate-100">&lt; 1.8s</div>
                <h4 className="font-semibold text-xs text-slate-300">Inference Speed</h4>
                <p className="text-[11px] text-slate-400">Real-time prediction output</p>
              </div>
            </div>
          </section>

          {/* Limitations */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              3. Limitations
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 font-normal">
              <li>Low light or heavy shadows in the barn can decrease prediction accuracy.</li>
              <li>Heavy coat mud or dirt obscuring anatomical key points requires cleaning prior to scan.</li>
              <li>Unusual posture or motion during video capture can impact scoring precision.</li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 font-medium">
              Try our <Link to="/live" className="text-slate-900 font-semibold underline">Live 10s Scanner</Link> to analyze real-time scores.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
