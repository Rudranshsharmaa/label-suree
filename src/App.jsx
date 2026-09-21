import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScanProvider } from './context/ScanContext';
import { AppRoutes } from './routes/AppRoutes';
import { Navbar } from './components/layout/Navbar';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { Footer } from './components/layout/Footer';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScanProvider>
          <div className="min-h-screen flex flex-col bg-[#F5F3EA] text-[#17231C]">
            {/* Accessible Skip Link */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#123C2A] text-[#F5F3EA] font-bold rounded-xl shadow-lg"
            >
              Skip to main content
            </a>

            {/* Main Navigation Header */}
            <Navbar />

            {/* Main Content Viewport */}
            <main id="main-content" className="flex-1 pb-16 lg:pb-0">
              <AppRoutes />
            </main>

            {/* Mobile Bottom Navigation Bar */}
            <MobileNavigation />

            {/* Footer */}
            <Footer />
          </div>
        </ScanProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
