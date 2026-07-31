import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DataConsent() {
  const [agreed, setAgreed] = useState(true);
  const [optInTraining, setOptInTraining] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Data Consent Terms
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Permissions and consent options prior to image upload and AI analysis
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed font-normal">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              1. Image Upload Confirmation
            </h2>
            <p>
              Before image upload or video scanning, users confirm that they have permission to process images of the animal and understand that AI-generated BCS is an estimated assessment.
            </p>
          </section>

          {/* Consent Checkbox Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Consent Options
            </h2>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <label className="flex items-start gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-slate-800 rounded cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                    I confirm that I have permission to upload this animal image and understand that AI-generated BCS is an estimated assessment.
                  </span>
                  <p className="text-xs text-slate-500 font-normal">
                    Mandatory for scanning. Ensures compliance with farm ownership and AI advisory terms.
                  </p>
                </div>
              </label>

              <div className="border-t border-slate-200 pt-4">
                <label className="flex items-start gap-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInTraining}
                    onChange={(e) => setOptInTraining(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-slate-800 rounded cursor-pointer"
                  />
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                      Allow anonymized cattle frames for AI model accuracy training (Optional)
                    </span>
                    <p className="text-xs text-slate-500 font-normal">
                      Helps improve BCS precision for indigenous cattle breeds. Personally identifiable information is removed.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-500 font-medium">
              You can adjust consent settings in your <Link to="/profile" className="text-slate-900 font-semibold underline">Account Profile</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
