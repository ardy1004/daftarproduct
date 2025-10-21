import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/ThemeProvider';
import { TrackingScripts } from '@/components/TrackingScripts';
import PrivateRoute from '@/components/PrivateRoute';
import { CategoryProvider } from '@/context/CategoryContext';

// Import Pages
import Home from '@/pages/Home';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import NotFound from '@/pages/not-found';

// Import Legal Pages
import FaqPage from '@/pages/legal/FaqPage';
import HowToShopPage from '@/pages/legal/HowToShopPage';
import PrivacyPolicyPage from '@/pages/legal/PrivacyPolicyPage';
import TermsAndConditionsPage from '@/pages/legal/TermsAndConditionsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <CategoryProvider>
            <TrackingScripts />
            <Routes>
                {/* Public Routes */}
                <Route path="/:category" element={<Home />} />
                <Route path="/:category/:subcategory" element={<Home />} />
                <Route path="/" element={<Home />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Legal Pages */}
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/how-to-shop" element={<HowToShopPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />

                {/* Private Admin Routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <PrivateRoute>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />

                {/* Not Found Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            <Toaster />
          </CategoryProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;