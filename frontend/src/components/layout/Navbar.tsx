import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { BackendStatusModal } from '@/components/ui/BackendStatusModal';

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [backendModalOpen, setBackendModalOpen] = useState(false);

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  const AI_MODULES = [
    { to: '/farm', label: t('nav_farm', 'Farm Management'), desc: t('module_farm_desc', 'Register cattle with AI Muzzle Scan') },
    { to: '/muzzle-check', label: t('nav_muzzle_scan', 'Muzzle Identity Check'), desc: t('module_muzzle_desc', 'Identify cattle by muzzle pattern') },
    { to: '/farm', label: t('nav_bcs_detection', 'BCS Score Detection'), desc: t('accordion_bcs_title', 'Body condition score AI analysis') },
    { to: '/farm', label: t('nav_disease_detection', 'Disease Detection'), desc: t('accordion_disease_title', 'Visible cattle health screening') },
    { to: '/history', label: t('nav_health_records', 'Cattle Health Records'), desc: t('farm_subtitle', 'Past diagnostic reports & scans') },
  ];

  const SUBMENU_ITEMS = [
    { to: '/ai-transparency', label: t('nav_ai_transparency', 'AI Transparency & Architecture') },
    { to: '/icar-standards',  label: t('nav_icar_standards', 'ICAR Standards & BCS Scale') },
    { to: '/disclaimer',      label: t('nav_disclaimer', 'Veterinary Disclaimer') },
    { to: '/data-consent',    label: t('nav_data_consent', 'Data Consent & Terms') },
    { to: '/privacy',         label: t('nav_privacy', 'Privacy Policy') },
    { to: '/terms',           label: t('nav_terms', 'Terms of Service') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      {/* Top Announcement Banner (Hidden on Mobile) */}
      <div className="hidden sm:flex bg-[#0f172a] text-white py-1.5 px-3 text-center text-[10px] sm:text-xs font-bold tracking-wide items-center justify-center gap-1.5 sm:gap-2 border-b border-slate-800 flex-wrap">
        <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase flex-shrink-0">
          {t('announcement_badge', 'PashuX AI')}
        </span>
        <span className="truncate max-w-[340px] sm:max-w-none">
          {t('announcement_text', 'Cattle Health Intelligence & Biometric AI Muzzle Scanner')}
        </span>
        <Link to="/muzzle-check" className="underline hover:text-emerald-300 font-black ml-0.5 flex-shrink-0">
          {t('announcement_cta', 'Try Muzzle Scan →')}
        </Link>
      </div>

      <nav className="max-w-7xl mx-auto px-3 sm:px-5 min-h-[64px] sm:min-h-[72px] py-1.5 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center group flex-shrink-0 mr-2 sm:mr-3">
          <img
            src="/Pashuxlogo.png"
            alt="PashuX Logo"
            className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Desktop Nav - unified responsive navigation */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
          {/* Home */}
          <Link
            to="/"
            className={`px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl ${
              pathname === '/'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_home', 'Home')}
          </Link>

          <Link
            to="/farm"
            className={`px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl ${
              pathname === '/farm'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_farm', 'Farm')}
          </Link>

          <Link
            to="/muzzle-check"
            className={`px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl ${
              pathname === '/muzzle-check'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_muzzle_scan', 'Muzzle Scan')}
          </Link>

          {/* AI Detection Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setAiDropdownOpen(true)}
            onMouseLeave={() => setAiDropdownOpen(false)}
          >
            <button
              onClick={() => setAiDropdownOpen(o => !o)}
              className={`px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl flex items-center gap-1 ${
                aiDropdownOpen || AI_MODULES.some(i => pathname === i.to)
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <span>{t('nav_ai_modules', 'AI')}</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${aiDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {aiDropdownOpen && (
              <div className="absolute top-full left-0 w-56 pt-2 animate-fade-in z-50">
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 shadow-2xl shadow-slate-900/15 space-y-1">
                  {AI_MODULES.map((item) => {
                    const isCurrent = pathname === item.to;
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setAiDropdownOpen(false)}
                        className={`block px-3 py-2 rounded-xl transition-all duration-150 ${
                          isCurrent ? 'bg-emerald-50 text-emerald-700 font-black' : 'hover:bg-slate-50 text-slate-800 hover:text-emerald-700'
                        }`}
                      >
                        <div className="text-xs font-black">{item.label}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">{item.desc}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/products"
            className={`px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl ${
              pathname === '/products'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_products', 'Products')}
          </Link>

          <Link
            to="/history"
            className={`hidden xl:inline-flex px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl ${
              pathname === '/history'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_health_records', 'Records')}
          </Link>

          {/* About & Standards Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setSubmenuOpen(true)}
            onMouseLeave={() => setSubmenuOpen(false)}
          >
            <button
              onClick={() => setSubmenuOpen(o => !o)}
              className={`px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl flex items-center gap-1 ${
                submenuOpen || SUBMENU_ITEMS.some(i => pathname === i.to)
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
              }`}
            >
              <span>{t('nav_about_standards', 'About')}</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${submenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {submenuOpen && (
              <div className="absolute top-full left-0 w-60 pt-2 animate-fade-in z-50">
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-2 shadow-2xl shadow-slate-900/15 space-y-1">
                  {SUBMENU_ITEMS.map((item) => {
                    const isCurrent = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSubmenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 font-black'
                            : 'text-slate-800 font-bold hover:bg-slate-50 hover:text-emerald-700'
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

          <Link
            to="/contact"
            className={`hidden xl:inline-flex px-2.5 py-1.5 text-xs font-black transition-colors duration-150 whitespace-nowrap rounded-xl ${
              pathname === '/contact'
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_contact', 'Contact')}
          </Link>
        </div>

        {/* Right Actions: Language Switcher + iHerd App Download (Icon Only) + Profile Avatar */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white text-slate-800 text-xs font-bold transition-all shadow-xs"
              title={t('lang_select', 'Language')}
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span className="font-black text-slate-900">{currentLangObj.nativeName}</span>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 space-y-1 animate-fade-in"
                onMouseLeave={() => setLangDropdownOpen(false)}
              >
                {languages.slice(0, 3).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      language === lang.code
                        ? 'bg-emerald-50 text-emerald-800 font-black'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-emerald-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </span>
                    {language === lang.code && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download iHerd App — Icon Only */}
          <a
            href={IHERD_PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-center group flex-shrink-0 shadow-xs hover:shadow-sm"
            title={t('nav_download_app', 'Download iHerd App')}
            aria-label="Download iHerd App"
          >
            <img src="/iherd_logo.png" alt="iHerd App" className="w-5 h-5 rounded-md object-contain group-hover:scale-110 transition-transform" />
          </a>

          {/* User Profile — Simple Avatar & Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(o => !o)}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black text-xs transition-all shadow-sm shadow-emerald-600/20 hover:scale-105 active:scale-95"
                title={user.user_metadata?.full_name || user.email || 'Profile'}
                aria-label="User Profile"
              >
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 animate-fade-in"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User')}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span>{t('nav_profile', 'Profile')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (window.confirm(t('nav_signout_confirm', 'Are you sure you want to sign out?'))) signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>{t('nav_signout', 'Sign out')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn-secondary py-1.5 px-3.5 text-xs font-black border-slate-300 text-slate-900 hover:border-emerald-500 whitespace-nowrap rounded-xl">
              {t('nav_signin', 'Sign in')}
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="lg:hidden btn-ghost p-2 text-slate-900 rounded-xl hover:bg-slate-100 flex-shrink-0"
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
        <div className="lg:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-2.5 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
          {/* Mobile Language Switcher */}
          <div className="pb-2 border-b border-slate-200">
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 px-1">
              {t('lang_select', 'Select Language')}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {languages.slice(0, 3).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all ${
                    language === lang.code
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span className="text-sm">{lang.flag}</span>
                  <span className="truncate">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              pathname === '/' ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('nav_home', 'Home')}
          </Link>

          <Link
            to="/farm"
            onClick={() => setMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              pathname === '/farm' ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('nav_farm', 'Farm Management')}
          </Link>

          <Link
            to="/muzzle-check"
            onClick={() => setMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              pathname === '/muzzle-check' ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('nav_muzzle_scan', 'Muzzle Scan')}
          </Link>

          {/* AI Modules Mobile Submenu */}
          <div className="pt-2 pb-1 border-t border-slate-200 space-y-1">
            <p className="px-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
              {t('nav_ai_modules', 'AI Detection Modules')}
            </p>
            {AI_MODULES.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2 rounded-xl text-xs font-black ${
                  pathname === item.to ? 'text-emerald-950 bg-emerald-100' : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              pathname === '/products' ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('nav_products', 'Products')}
          </Link>

          {/* About & Standards Submenu for Mobile */}
          <div className="pt-2 pb-1 border-t border-slate-200 space-y-1">
            <p className="px-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
              {t('nav_about_standards', 'About & Standards')}
            </p>
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

          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className={`block px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              pathname === '/contact' ? 'text-emerald-950 bg-emerald-100 border border-emerald-300' : 'text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t('nav_contact', 'Contact Us')}
          </Link>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <a
              href={IHERD_PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl text-xs font-black bg-white border-2 border-emerald-300 text-slate-900 text-center shadow-sm flex items-center justify-center gap-2.5 hover:border-emerald-500"
            >
              <img src="/iherd_logo.png" alt="iHerd Logo" className="w-5 h-5 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200" />
              <span>{t('nav_download_app', 'Download iHerd App')}</span>
            </a>
            {user ? (
              <button onClick={() => { if (window.confirm(t('nav_signout_confirm', 'Are you sure you want to sign out?'))) { signOut(); setMenuOpen(false); } }} className="btn-secondary text-xs font-black text-slate-900 w-full py-2.5">
                {t('nav_signout', 'Sign out')} ({user.user_metadata?.full_name || (user.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'User')})
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-secondary text-xs text-center font-black text-slate-900 py-2.5">
                {t('nav_signin', 'Sign in')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
