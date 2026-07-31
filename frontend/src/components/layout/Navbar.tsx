import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
  { to: '/live',       label: 'Live 10s Scan', isLive: true },
  { to: '/bcs',        label: 'BCS Detection' },
  { to: '/disease',    label: 'Disease Detection' },
  { to: '/history',    label: 'History' },
  { to: '/products',   label: 'Products' },
];

const SUBMENU_ITEMS = [
  { to: '/ai-transparency', label: 'AI Transparency & Architecture' },
  { to: '/icar-standards',  label: 'ICAR Standards & BCS Scale' },
  { to: '/disclaimer',      label: 'Veterinary Disclaimer' },
  { to: '/data-consent',    label: 'Data Consent & Terms' },
  { to: '/privacy',         label: 'Privacy Policy' },
  { to: '/terms',           label: 'Terms of Service' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      {/* Top Announcement Banner */}
      <div className="bg-[#0f172a] text-white py-1.5 px-3 text-center text-[10px] sm:text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 border-b border-slate-800 flex-wrap">
        <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase flex-shrink-0">PashuX AI</span>
        <span className="truncate max-w-[240px] sm:max-w-none">Cattle Health Intelligence & 10s Video BCS Scanner</span>
        <Link to="/live" className="underline hover:text-emerald-300 font-black ml-0.5 flex-shrink-0">Try Scan →</Link>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - PashuX */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3.5 group flex-shrink-0">
          <div className="p-1 sm:p-1.5 rounded-2xl bg-white border-2 border-emerald-200/80 shadow-sm group-hover:border-emerald-400 group-hover:shadow-md transition-all">
            <img
              src="/chimertech_logo.png"
              alt="PashuX Logo"
              className="h-7 sm:h-9 w-auto object-contain"
            />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
            PashuX
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          {NAV_LINKS.map(({ to, label, isLive }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? 'text-emerald-950 bg-emerald-100/90 border border-emerald-300 shadow-xs'
                    : 'text-slate-800 hover:text-emerald-700 hover:bg-slate-100/80 hover:shadow-xs'
                }`}
              >
                {isLive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm" />}
                {label}
              </Link>
            );
          })}

          {/* Desktop Interactive Submenu: About & Standards */}
          <div
            className="relative"
            onMouseEnter={() => setSubmenuOpen(true)}
            onMouseLeave={() => setSubmenuOpen(false)}
          >
            <button
              onClick={() => setSubmenuOpen(o => !o)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                submenuOpen || SUBMENU_ITEMS.some(i => pathname === i.to)
                  ? 'text-emerald-900 bg-emerald-50 border border-emerald-200/80 shadow-xs'
                  : 'text-slate-800 hover:text-emerald-700 hover:bg-slate-100/80'
              }`}
            >
              <span>About & Standards</span>
              <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${submenuOpen ? 'rotate-180 text-emerald-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {submenuOpen && (
              <div className="absolute top-full left-0 w-64 pt-2 animate-fade-in z-50">
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 shadow-2xl shadow-slate-900/15 space-y-1">
                  {SUBMENU_ITEMS.map((item) => {
                    const isCurrent = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSubmenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all duration-150 ${
                          isCurrent
                            ? 'text-emerald-950 bg-emerald-100/90 font-black'
                            : 'text-slate-800 hover:bg-slate-100/90 hover:text-emerald-800 hover:translate-x-1'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: iHerd Mobile App Download + Auth */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href={IHERD_PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-white border-2 border-emerald-300 text-slate-900 shadow-sm hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md transition-all flex items-center gap-2 group hover:scale-[1.02]"
          >
            <img src="/iherd_logo.png" alt="iHerd Logo" className="w-4 h-4 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200" />
            <span>Download iHerd App</span>
          </a>

          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-2 rounded-xl text-xs font-black bg-purple-700 text-white shadow-md hover:bg-purple-800 transition-all"
            >
              ⚡ Admin
            </Link>
          )}

          {user ? (
            <>
              <Link to="/profile" className="btn-ghost text-xs font-black text-slate-900 hover:text-emerald-700 px-2 py-1">
                {user.email?.split('@')[0]}
              </Link>
              <button onClick={() => signOut()} className="btn-secondary py-1.5 px-3 text-xs font-black border-slate-300 text-slate-900">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-secondary py-1.5 px-3.5 text-xs font-black border-slate-300 text-slate-900 hover:border-emerald-500">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="lg:hidden btn-ghost p-2 text-slate-900 rounded-xl hover:bg-slate-100"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-slate-900 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-slate-900 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-slate-900 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-2 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
          {NAV_LINKS.map(({ to, label, isLive }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all ${
                pathname === to ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isLive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              <span>{label}</span>
            </Link>
          ))}

          {/* Submenu details for mobile */}
          <div className="pt-2 pb-1 border-t border-slate-200 space-y-1">
            <p className="px-4 text-[10px] uppercase font-black tracking-widest text-slate-400">About & Standards</p>
            {SUBMENU_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 rounded-xl text-xs font-black text-slate-800 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black bg-purple-100 text-purple-950 border border-purple-300"
            >
              <span>⚡ Admin Panel</span>
            </Link>
          )}

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <a
              href={IHERD_PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl text-xs font-black bg-white border-2 border-emerald-300 text-slate-900 text-center shadow-sm flex items-center justify-center gap-2.5 hover:border-emerald-500"
            >
              <img src="/iherd_logo.png" alt="iHerd Logo" className="w-5 h-5 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200" />
              <span>Download iHerd Mobile App</span>
            </a>
            {user ? (
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="btn-secondary text-xs font-black text-slate-900 w-full py-2.5">
                Sign out ({user.email?.split('@')[0]})
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-secondary text-xs text-center font-black text-slate-900 py-2.5">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
