import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Pristine White Backdrop */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm" />

      <nav className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
              Chimertech
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          {NAV_LINKS.map(({ to, label, isLive }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 flex items-center gap-1.5 ${
                  active
                    ? 'text-emerald-800 bg-emerald-50 border border-emerald-200/80 shadow-sm'
                    : 'text-slate-800 hover:text-emerald-700 hover:bg-slate-50'
                }`}
              >
                {isLive && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Auth Actions Area */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="btn-ghost text-xs font-black text-slate-800">
                {user.email?.split('@')[0]}
              </Link>
              <button onClick={() => signOut()} className="btn-secondary py-2 px-4 text-xs font-black">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost text-xs font-black text-slate-800 hover:text-emerald-700">Sign in</Link>
              <Link to="/auth?mode=signup" className="btn-primary py-2.5 px-5 text-xs font-black shadow-md shadow-emerald-500/20">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="md:hidden btn-ghost p-2 text-slate-900"
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
        <div className="md:hidden relative bg-white border-b border-slate-200 px-6 py-4 space-y-1 shadow-xl animate-fade-in">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-black transition-all ${
                pathname === to ? 'text-emerald-800 bg-emerald-50 border border-emerald-200' : 'text-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-200 flex gap-3">
            {user ? (
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="btn-secondary text-xs flex-1 font-black">
                Sign out
              </button>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-secondary text-xs flex-1 text-center font-black">Sign in</Link>
                <Link to="/auth?mode=signup" onClick={() => setMenuOpen(false)} className="btn-primary text-xs flex-1 text-center font-black">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
