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
      <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.05]" />

      <nav className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-black" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white group-hover:text-grey-100 transition-colors">
            Chimertech
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-white bg-white/[0.08]'
                    : 'text-grey-400 hover:text-white hover:bg-white/[0.04]'
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
