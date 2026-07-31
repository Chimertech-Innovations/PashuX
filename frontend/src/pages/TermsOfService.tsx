import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Effective Date: July 31, 2026 | Developed by Chimertech Private Limited
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed font-normal">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              1. Purpose of Terms
            </h2>
            <p>
              These Terms of Service define the rules and conditions for using the BCS AI application, camera scanning tools, and decision-support services provided by Chimertech Private Limited.
            </p>
          </section>

          {/* Application Usage */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              2. Application Usage
            </h2>
            <p>
              The platform provides AI-based cattle body condition scoring, image-based analysis, and decision support information. By using the platform, users agree that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 font-normal">
              <li>Uploaded images belong to them or they have permission to use them.</li>
              <li>They will provide correct animal information.</li>
              <li>They will not misuse the platform or disrupt cloud infrastructure.</li>
            </ul>
          </section>

          {/* AI Service Limitation */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              3. AI Service Limitation
            </h2>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-300 space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-slate-900 italic">
                "The AI-generated BCS score is an assistive prediction and should not replace professional veterinary examination."
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                The output is designed purely as a decision-support tool and does not constitute a final medical diagnosis.
              </p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              4. Prohibited Activities
            </h2>
            <p>Users should not:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">Upload unrelated images</div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">Attempt reverse engineering</div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">Abuse the API endpoints</div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">Upload harmful files</div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">Misrepresent AI results as certified clinical diagnoses</div>
            </div>
          </section>

          {/* Service Availability */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              5. Service Availability
            </h2>
            <p>
              Service availability depends on internet and cloud infrastructure. Temporary downtime may occur due to scheduled maintenance. Continuous improvement may change platform features over time.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 font-medium">
              Questions regarding these terms can be sent to <span className="font-semibold text-slate-800"> sales@chimertech.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
