import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Last Updated: July 31, 2026 | Developed by Chimertech Private Limited
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed font-normal">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              1. Purpose of Privacy Policy
            </h2>
            <p>
              This Privacy Policy explains how the PashuX AI application (developed by Chimertech Private Limited) collects, stores, processes, and protects user data and cattle health records. We are committed to maintaining data privacy standards for dairy farmers, livestock owners, veterinarians, and enterprise agricultural partners.
            </p>
          </section>

          {/* Data Collected Grid */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Data We Collect
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
              {/* User Data */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">User Data</h3>
                <ul className="text-xs text-slate-600 font-normal space-y-1.5 list-disc pl-4">
                  <li>Full Name</li>
                  <li>Email address & mobile number</li>
                  <li>Farm details & organization info</li>
                  <li>Location telemetry (optional)</li>
                  <li>Login credentials</li>
                </ul>
              </div>

              {/* Animal Data */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Animal Data</h3>
                <ul className="text-xs text-slate-600 font-normal space-y-1.5 list-disc pl-4">
                  <li>Cattle images uploaded by users</li>
                  <li>Videos uploaded for analysis</li>
                  <li>Animal identification details & ear tags</li>
                  <li>Breed information</li>
                  <li>Age & lactation stage</li>
                  <li>Body Condition Score (BCS) history</li>
                </ul>
              </div>

              {/* Technical Data */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Technical Data</h3>
                <ul className="text-xs text-slate-600 font-normal space-y-1.5 list-disc pl-4">
                  <li>Device information & OS</li>
                  <li>Browser information & user-agent</li>
                  <li>IP address & network status</li>
                  <li>Usage analytics</li>
                  <li>Application performance logs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How Data Is Used */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              3. How Data Is Used
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">AI Analysis & Insights</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Processing cattle images and video clips to estimate Body Condition Scores (BCS 1.0 to 5.0), detect potential early health risks, and generate animal health recommendations.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm">Model Improvement</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Uploaded images may be used for dataset expansion, AI model training, and accuracy improvement. Before using any data for research, personally identifiable information is removed to maintain user privacy.
                </p>
              </div>
            </div>
          </section>

          {/* Data Security & Sharing */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              4. Data Security & Data Sharing
            </h2>
            <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
              <h3 className="font-bold text-sm text-slate-100">Data Security Standards</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We implement secure cloud storage, encrypted data transmission, and controlled access to animal records.
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs font-medium text-slate-300">
                User data is not sold. Data may only be shared with user permission, for veterinary consultation, for research improvement after anonymization, or when legally required.
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              5. User Rights
            </h2>
            <p>Users have full rights to manage their account and data records:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-100 font-semibold text-xs text-slate-800">Request Data</div>
              <div className="p-3 rounded-lg bg-slate-100 font-semibold text-xs text-slate-800">Delete Images</div>
              <div className="p-3 rounded-lg bg-slate-100 font-semibold text-xs text-slate-800">Remove Account Info</div>
              <div className="p-3 rounded-lg bg-slate-100 font-semibold text-xs text-slate-800">Withdraw Consent</div>
            </div>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 font-medium">
              For any privacy inquiries or to exercise your rights, contact us at <span className="font-semibold text-slate-800">research@chimertech.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
