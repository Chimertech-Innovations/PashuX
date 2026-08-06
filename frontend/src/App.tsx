import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/utils/ScrollToTop';
import ConsentBanner from '@/components/ui/ConsentBanner';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import BCSDetection from '@/pages/BCSDetection';
import DiseaseDetection from '@/pages/DiseaseDetection';
import LiveDetection from '@/pages/LiveDetection';
import AnalysisHistory from '@/pages/AnalysisHistory';
import Products from '@/pages/Products';
import Profile from '@/pages/Profile';
import Admin from '@/pages/Admin';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import VeterinaryDisclaimer from '@/pages/VeterinaryDisclaimer';
import ICARStandards from '@/pages/ICARStandards';
import AITransparency from '@/pages/AITransparency';
import DataConsent from '@/pages/DataConsent';
import ContactUs from '@/pages/ContactUs';
import FarmManagement from '@/pages/FarmManagement';
import MuzzleCheck from '@/pages/MuzzleCheck';
import CattleDetail from '@/pages/CattleDetail';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <ConsentBanner />
        <div className="relative noise-overlay">
          <Navbar />
          <main>
            <Routes>
              <Route path="/"               element={<Landing />} />
              <Route path="/auth"           element={<Auth />} />
              <Route path="/admin"          element={<Admin />} />
              <Route path="/farm"           element={<FarmManagement />} />
              <Route path="/cattle/:id"     element={<CattleDetail />} />
              <Route path="/muzzle-check"   element={<MuzzleCheck />} />
              <Route path="/live"           element={<LiveDetection />} />
              <Route path="/bcs"            element={<BCSDetection />} />
              <Route path="/disease"        element={<DiseaseDetection />} />
              <Route path="/history"        element={<AnalysisHistory />} />
              <Route path="/products"       element={<Products />} />
              <Route path="/contact font-black" element={<ContactUs />} />
              <Route path="/contact"        element={<ContactUs />} />
              <Route path="/profile"         element={<Profile />} />
              <Route path="/privacy"        element={<PrivacyPolicy />} />
              <Route path="/terms"          element={<TermsOfService />} />
              <Route path="/disclaimer"     element={<VeterinaryDisclaimer />} />
              <Route path="/icar-standards" element={<ICARStandards />} />
              <Route path="/ai-transparency" element={<AITransparency />} />
              <Route path="/data-consent"    element={<DataConsent />} />

              {/* 404 fallback */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-8xl font-black text-grey-800 mb-4">404</p>
                    <p className="text-grey-400 mb-6">Page not found</p>
                    <a href="/" className="btn-primary">Go home</a>
                  </div>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
