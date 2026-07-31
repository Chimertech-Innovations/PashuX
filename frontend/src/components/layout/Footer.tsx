import { Link } from 'react-router-dom';

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

export default function Footer() {
  return (
    <footer className="border-t border-slate-300 bg-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-2xl bg-white border border-slate-300 shadow-sm">
                <img src="/chimertech_logo.png" alt="PashuX Logo" className="h-8 w-auto object-contain" />
              </div>
              <span className="font-black text-slate-900 text-2xl tracking-tight">PashuX</span>
            </div>
            <p className="text-xs text-slate-900 max-w-sm leading-relaxed font-bold">
              A modern, AI-powered platform for cattle body condition scoring and disease detection — built for farmers, veterinarians, and agri-businesses.
            </p>
            
            {/* iHerd Mobile App Download Card with White Background */}
            <div className="pt-2">
              <a
                href={IHERD_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-emerald-300 text-slate-900 shadow-md transition-all hover:border-emerald-500 hover:shadow-lg hover:scale-105"
              >
                <img src="/iherd_logo.png" alt="iHerd Logo" className="w-10 h-10 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200" />
                <div className="pr-2">
                  <p className="text-[10px] uppercase font-black tracking-wider text-emerald-800">DOWNLOAD IHERD APP</p>
                  <img src="/google_play_badge.png" alt="Get it on Google Play" className="h-6 w-auto object-contain mt-0.5" />
                </div>
              </a>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-black">
              <span></span> Data is powered by <a href="https://openpashu.com" target="_blank" rel="noopener noreferrer" className="font-black text-emerald-800 hover:text-emerald-950">openpashu</a> and developed by <span className="text-slate-900 font-black">Chimertech Pvt Ltd</span>
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
                  <Link to={to} className="text-xs text-slate-900 hover:text-emerald-700 font-black transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Mobile & Enterprise</h4>
            <ul className="space-y-2.5">
              <li>
                <a href={IHERD_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-900 font-black hover:text-emerald-700 transition-colors flex items-center gap-2">
                  <img src="/iherd_logo.png" alt="iHerd" className="w-4 h-4 rounded-md inline-block object-contain" />
                  iHerd Android App
                </a>
              </li>
              {[
                ['Privacy Policy', '#'],
                ['Terms of Service', '#'],
                ['Veterinary Disclaimer', '#'],
                ['ICAR Standards', '#']
              ].map(([label, to]) => (
                <li key={label}>
                  <a href={to} className="text-xs text-slate-900 hover:text-emerald-700 font-black transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black text-slate-900">
          <p>© {new Date().getFullYear()} Chimertech Pvt Ltd. All rights reserved.</p>
          <p className="text-slate-900">
            Data is powered by <a href="https://openpashu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-800 font-black hover:text-emerald-950">openpashu</a> | Developed by <span className="font-black text-slate-900">Chimertech Pvt Ltd</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
