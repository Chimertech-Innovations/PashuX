import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-extrabold text-slate-900 text-base">Chimertech AI</span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed font-medium">
              A modern, AI-powered platform for cattle body condition scoring and disease detection — built for farmers, veterinarians, and agri-businesses.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
              <span>🌿</span> Data is powered by <a href="https://openpashu.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-900">openpashu.com</a> and developed by <span className="text-slate-900 font-black">Chimertech Pvt Ltd</span>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Platform Modules</h4>
            <ul className="space-y-2.5">
              {[
                ['Live 10s Scanner', '/live'],
                ['BCS Score Detection', '/bcs'],
                ['Disease Screening', '/disease'],
                ['Analysis History', '/history'],
                ['Products Catalogue', '/products']
              ].map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-600 hover:text-emerald-600 font-bold transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Enterprise</h4>
            <ul className="space-y-2.5">
              {[
                ['Privacy Policy', '#'],
                ['Terms of Service', '#'],
                ['Veterinary Disclaimer', '#'],
                ['ICAR Standards', '#']
              ].map(([label, to]) => (
                <li key={label}>
                  <a href={to} className="text-sm text-slate-600 hover:text-emerald-600 font-bold transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} Chimertech Pvt Ltd. All rights reserved.</p>
          <p className="text-slate-600">
            Data is powered by <a href="https://openpashu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">openpashu.com</a> | Developed by <span className="font-bold text-slate-900">Chimertech Pvt Ltd</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
