import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const NAV_LINKS = [
  { to: '/',           label: 'Home' },
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#07080a]/80 backdrop-blur-2xl border-b border-white/[0.08]" />

      <nav className="relative max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_16px_rgba(34,197,94,0.4)] group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-black" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              Chimertech
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06] backdrop-blur-md">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'text-white bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                    : 'text-grey-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Auth area */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="btn-ghost text-xs">
                {user.email?.split('@')[0]}
              </Link>
              <button onClick={() => signOut()} className="btn-secondary py-1.5 px-3 text-xs">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost text-xs">Sign in</Link>
              <Link to="/auth?mode=signup" className="btn-primary py-2 px-4 text-xs">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`block h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block h-0.5 bg-white/70 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-white/70 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
          </div>
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden relative bg-[#0f0f0f] border-b border-white/[0.05] px-6 py-4 space-y-1 animate-fade-in">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === to ? 'text-white bg-white/[0.08]' : 'text-grey-400'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/[0.05] flex gap-3">
            {user ? (
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="btn-secondary text-xs flex-1">
                Sign out
              </button>
            ) : (
              <>
                <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-secondary text-xs flex-1 text-center">Sign in</Link>
                <Link to="/auth?mode=signup" onClick={() => setMenuOpen(false)} className="btn-primary text-xs flex-1 text-center">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
