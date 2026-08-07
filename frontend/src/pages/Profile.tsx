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
          <p className="text-4xl mb-4">👤</p>
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
          <h1 className="text-display font-black text-white">Profile</h1>
        </div>

        {/* Profile card */}
        <div className="glass-card p-8 mb-5 animate-fade-up">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-2xl font-black text-black flex-shrink-0">
              {initial}
            </div>
            <div>
              <h2 className="text-heading font-bold text-white">{name}</h2>
              <p className="text-sm text-grey-500">{user.email}</p>
              <p className="text-xs text-grey-700 mt-1">
                Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link to="/bcs" className="btn-secondary text-center text-xs py-2.5">
              New BCS Analysis
            </Link>
            <Link to="/disease" className="btn-secondary text-center text-xs py-2.5">
              New Disease Screening
            </Link>
          </div>
        </div>

        {/* Chimertech QR Profile Card */}
        <div className="glass-card p-6 mb-5 animate-fade-up border-emerald-500/30 bg-emerald-950/20" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md">
                <img src="/chimertech_logo.png" alt="Chimertech Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Chimertech QR Profile</h3>
                <p className="text-xs text-emerald-400 font-medium">Official Biometric Cattle QR Codes</p>
              </div>
            </div>
            <a
              href="https://chimertech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-900/40 px-3 py-1.5 rounded-lg border border-emerald-500/20"
            >
              <span>chimertech.com</span>
              <span>↗</span>
            </a>
          </div>
          <p className="text-xs text-grey-400 mb-4">
            All registered cattle generate scannable QR codes embedded exclusively with the official Chimertech logo.
          </p>
          <Link
            to="/farm"
            className="w-full btn-primary text-center text-xs py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none"
          >
            <span>📱</span> View & Share Cattle QR Codes
          </Link>
        </div>

        {/* Quick links */}
        <div className="glass-card p-6 mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
          <div className="space-y-1">
            {[
              ['🐄', 'My Farm & Cattle QR Codes', '/farm'],
              ['📊', 'Analysis History', '/history'],
              ['🛒', 'Products Catalogue', '/products'],
            ].map(([icon, label, to]) => (
              <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-all">
                <span>{icon}</span>
                <span className="text-sm text-grey-300">{label}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-grey-600 ml-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="glass-card p-6 border-red-500/10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-semibold text-white mb-1">Sign Out</h3>
          <p className="text-xs text-grey-500 mb-4">You will be returned to the home page.</p>
          <button
            onClick={async () => { setLoading(true); await signOut(); }}
            disabled={loading}
            className="btn-secondary text-xs py-2 px-4 text-red-400 border-red-500/20 hover:bg-red-500/[0.06]"
          >
            {loading ? 'Signing out…' : 'Sign out of Chimertech'}
          </button>
        </div>
      </div>
    </div>
  );
}
