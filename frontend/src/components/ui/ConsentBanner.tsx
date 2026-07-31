import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'pashux_privacy_consent_decision';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-2xl z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-2xl text-slate-700 space-y-4 text-left font-sans">
        <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
          This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website and allow us to remember you. We use this information in order to improve and customize your browsing experience and for analytics and metrics about our visitors both on this website and other media. To find out more about the cookies we use, see our{' '}
          <Link to="/privacy" onClick={() => setVisible(false)} className="text-slate-800 font-medium underline hover:text-slate-950">
            Privacy Policy
          </Link>.
        </p>

        <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
          If you decline, your information won't be tracked when you visit this website. A single cookie will be used in your browser to remember your preference not to be tracked.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-4 sm:gap-6">
          <Link
            to="/data-consent"
            onClick={() => setVisible(false)}
            className="text-xs sm:text-sm font-semibold text-[#3b5166] underline hover:text-slate-900 transition-colors"
          >
            Cookies settings
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleChoice('accepted')}
              className="px-7 py-2.5 rounded-full bg-[#3b5166] hover:bg-[#2b3c4c] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
            >
              Accept
            </button>
            <button
              onClick={() => handleChoice('declined')}
              className="px-7 py-2.5 rounded-full bg-[#3b5166] hover:bg-[#2b3c4c] text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
