import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-black" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-white">Chimertech</span>
            </div>
            <p className="text-sm text-grey-500 max-w-xs leading-relaxed">
              AI-powered cattle health intelligence. Analyse, detect and act — all from your farm.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-semibold text-grey-300 uppercase tracking-widest mb-4">Tools</h4>
            <ul className="space-y-2.5">
              {[['BCS Detection', '/bcs'], ['Disease Detection', '/disease'], ['Analysis History', '/history'], ['Products', '/products']].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-grey-500 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-grey-300 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[['Privacy Policy', '#'], ['Terms of Use', '#'], ['Disclaimer', '#']].map(([label, to]) => (
                <li key={label}>
                  <a href={to} className="text-sm text-grey-500 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-grey-600">© {new Date().getFullYear()} Chimertech. All rights reserved.</p>
          <p className="text-xs text-grey-700">
            AI-assisted screening only. Not a veterinary diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}
