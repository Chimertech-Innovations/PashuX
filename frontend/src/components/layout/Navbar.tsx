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

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Pristine Backdrop */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm" />

      <nav className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo - PashuX */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="p-1.5 rounded-2xl bg-white border-2 border-emerald-200/80 shadow-sm group-hover:border-emerald-400 group-hover:shadow-md transition-all">
            <img
              src="/chimertech_logo.png"
              alt="PashuX Logo"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              PashuX
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-1.5">
          {NAV_LINKS.map(({ to, label, isLive }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? 'text-emerald-950 bg-emerald-100/90 border border-emerald-300 shadow-sm'
                    : 'text-slate-900 hover:text-emerald-700 hover:bg-slate-100'
                }`}
              >
                {isLive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right Actions: iHerd Mobile App Download (White BG) + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={IHERD_PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-black bg-white border-2 border-emerald-300 text-slate-900 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-2 group hover:scale-105"
          >
            <img src="/iherd_logo.png" alt="iHerd Logo" className="w-5 h-5 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200" />
            <span>Download iHerd App</span>
          </a>

          {isAdmin && (
            <Link
              to="/admin"
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-purple-700 text-white shadow-md hover:bg-purple-800 transition-all"
            >
              ⚡ Admin
            </Link>
          )}

          {user ? (
            <>
              <Link to="/profile" className="btn-ghost text-xs font-black text-slate-900 hover:text-emerald-700">
                {user.email?.split('@')[0]}
              </Link>
              <button onClick={() => signOut()} className="btn-secondary py-2 px-4 text-xs font-black border-slate-300 text-slate-900">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-secondary py-2 px-4 text-xs font-black border-slate-300 text-slate-900 hover:border-emerald-500">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="lg:hidden btn-ghost p-2 text-slate-900"
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
        <div className="lg:hidden relative bg-white border-b border-slate-200 px-6 py-4 space-y-2 shadow-2xl animate-fade-in">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-black transition-all ${
                pathname === to ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </Link>
          ))}
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
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="btn-secondary text-xs font-black text-slate-900">
                Sign out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-secondary text-xs text-center font-black text-slate-900">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
