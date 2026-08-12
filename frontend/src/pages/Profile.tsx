import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-6 flex items-center justify-center">
        <div className="text-center glass-card p-12 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/10 text-slate-300 mx-auto flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-heading-xl font-bold text-white mb-3">Not signed in</h2>
          <p className="text-grey-500 text-sm mb-6">Sign in to manage your profile and view analysis history.</p>
          <Link to="/auth" className="btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 animate-fade-up">
          <p className="section-label mb-3">Account</p>
          <h1 className="text-4xl font-black text-slate-900">Profile</h1>
        </div>

        {/* Profile card */}
        <div className="glass-card p-8 mb-5 animate-fade-up">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{name}</h2>
              <p className="text-sm text-slate-600 font-semibold">{user.email}</p>
              <p className="text-xs text-slate-400 font-bold mt-1">
                Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link to="/farm" className="btn-secondary text-center text-xs py-2.5">
              New BCS Analysis
            </Link>
            <Link to="/farm" className="btn-secondary text-center text-xs py-2.5">
              New Disease Screening
            </Link>
          </div>
        </div>

        {/* Chimertech QR Profile Card */}
        <div className="glass-card p-6 mb-5 animate-fade-up border-emerald-200 bg-emerald-50/30" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-100">
                <img src="/chimertech_logo.png" alt="Chimertech Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Chimertech QR Profile</h3>
                <p className="text-xs text-emerald-600 font-bold">Official Biometric Cattle QR Codes</p>
              </div>
            </div>
            <a
              href="https://chimertech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
            >
              <span>chimertech.com</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-slate-500 font-bold mb-4">
            All registered cattle generate scannable QR codes embedded exclusively with the official Chimertech logo.
          </p>
          <Link
            to="/farm"
            className="w-full btn-primary text-center text-xs py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 00-1-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>View & Share Cattle QR Codes</span>
          </Link>
        </div>

        {/* Quick links */}
        <div className="glass-card p-6 mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-black text-slate-900 mb-4">Quick Links</h3>
          <div className="space-y-1">
            {[
              {
                label: 'My Farm & Cattle QR Codes',
                to: '/farm',
                icon: (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )
              },
              {
                label: 'Analysis History',
                to: '/history',
                icon: (
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h-2m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                label: 'Products Catalogue',
                to: '/products',
                icon: (
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )
              },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all">
                {item.icon}
                <span className="text-sm text-slate-700 font-bold">{item.label}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-slate-400 ml-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass-card p-6 border-red-200 bg-red-50/10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-black text-slate-900 mb-1">Sign Out</h3>
          <p className="text-xs text-slate-500 font-bold mb-4">You will be returned to the home page.</p>
          <button
            onClick={async () => { setLoading(true); await signOut(); }}
            disabled={loading}
            className="btn-secondary text-xs py-2.5 px-4 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors font-bold"
          >
            {loading ? 'Signing out…' : 'Sign out of Chimertech'}
          </button>
        </div>
      </div>
    </div>
  );
}
