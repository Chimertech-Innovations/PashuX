import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import BCSDetection from '@/pages/BCSDetection';
import DiseaseDetection from '@/pages/DiseaseDetection';
import LiveDetection from '@/pages/LiveDetection';
import AnalysisHistory from '@/pages/AnalysisHistory';
import Products from '@/pages/Products';
import Profile from '@/pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative noise-overlay">
          <Navbar />
          <main>
            <Routes>
              <Route path="/"        element={<Landing />} />
              <Route path="/auth"    element={<Auth />} />
              <Route path="/live"    element={<LiveDetection />} />
              <Route path="/bcs"     element={<BCSDetection />} />
              <Route path="/disease" element={<DiseaseDetection />} />
              <Route path="/history" element={<AnalysisHistory />} />
              <Route path="/products" element={<Products />} />
              <Route path="/profile"  element={<Profile />} />

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
