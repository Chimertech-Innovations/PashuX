import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4 text-left">
            <div className="flex items-center">
              <img
                src="/Pashuxlogo.png"
                alt="PashuX Logo"
                className="w-auto object-contain"
                style={{ height: '150px', maxHeight: '150px', width: 'auto' }}
              />
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed font-semibold">
              {t('footer_desc', 'BCS AI is an artificial intelligence based livestock assessment tool developed by Chimertech Private Limited.')}
            </p>
            
            {/* iHerd Mobile App Download Link */}
            <div className="pt-2">
              <a
                href={IHERD_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-300 text-slate-900 shadow-sm transition-all hover:border-slate-400 hover:shadow-md"
              >
                <img src="/iherd_logo.png" alt="iHerd Logo" className="w-9 h-9 rounded-xl object-contain bg-slate-50 p-1 border border-slate-200" />
                <div className="pr-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-700">{t('nav_download_app', 'DOWNLOAD IHERD APP')}</p>
                  <img src="/google_play_badge.png" alt="Get it on Google Play" className="h-6 w-auto object-contain mt-0.5" />
                </div>
              </a>
            </div>

            {/* Clean Simple Text Line without background or underline */}
            <div className="text-xs font-medium text-slate-600 pt-1">
              {t('footer_data_powered', 'Data is powered by openpashu | Developed by Chimertech Private Limited')}
            </div>
          </div>

          {/* Platform Modules */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
              {t('footer_modules', 'Platform Modules')}
            </h4>
            <ul className="space-y-2.5">
              {[
                [t('nav_farm', 'Farm Management'), '/farm'],
                [t('nav_muzzle_scan', 'Muzzle Scan'), '/muzzle-check'],
                [t('nav_bcs_detection', 'BCS Score Detection'), '/farm'],
                [t('nav_disease_detection', 'Disease Screening'), '/farm'],
                [t('nav_health_records', 'Analysis History'), '/farm'],
                [t('nav_products', 'Products Catalogue'), '/products'],
                [t('nav_ai_transparency', 'AI Transparency'), '/ai-transparency'],
                [t('nav_contact', 'Contact Us'), '/contact'],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-xs text-slate-600 hover:text-slate-950 font-medium transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
              {t('footer_legal', 'Legal & Standards')}
            </h4>
            <ul className="space-y-2.5">
              {[
                [t('nav_privacy', 'Privacy Policy'), '/privacy'],
                [t('nav_terms', 'Terms of Service'), '/terms'],
                [t('nav_disclaimer', 'Veterinary Disclaimer'), '/disclaimer'],
                [t('nav_icar_standards', 'ICAR Standards'), '/icar-standards'],
                [t('nav_data_consent', 'Data Consent Terms'), '/data-consent'],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-xs text-slate-600 hover:text-slate-950 font-medium transition-colors">{label}</Link>
                </li>
              ))}
              <li className="pt-1">
                <a href={IHERD_PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-600 font-medium hover:text-slate-950 transition-colors flex items-center gap-2">
                  <img src="/iherd_logo.png" alt="iHerd" className="w-4 h-4 rounded-md inline-block object-contain" />
                  iHerd Android App
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Simple Premium Footer Disclaimer */}
        <div className="border-t border-slate-200 pt-8 space-y-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <p>© 2026 Chimertech Private Limited. {t('footer_rights', 'All rights reserved.')}</p>
            <p className="text-slate-500">
              {t('footer_data_powered', 'Data is powered by openpashu | Developed by Chimertech Private Limited')}
            </p>
          </div>
          
          <p className="text-[11px] font-normal text-slate-500 text-center leading-relaxed max-w-4xl mx-auto pt-2">
            {t('footer_desc', 'BCS AI is an artificial intelligence based livestock assessment tool. The application provides decision-support information only and does not replace veterinary diagnosis or professional livestock management advice.')}
          </p>
        </div>
      </div>
    </footer>
  );
}
