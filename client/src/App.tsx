import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/ThemeProvider';
import { TrackingScripts } from '@/components/TrackingScripts';
import PrivateRoute from '@/components/PrivateRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CategoryProvider } from '@/context/CategoryContext';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Import Pages with lazy loading for better performance
import { lazy } from 'react';
const Home = lazy(() => import('@/pages/Home'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Import Legal Pages with lazy loading
const FaqPage = lazy(() => import('@/pages/legal/FaqPage'));
const HowToShopPage = lazy(() => import('@/pages/legal/HowToShopPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/legal/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('@/pages/legal/TermsAndConditionsPage'));

const queryClient = new QueryClient();

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald" />
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider storageKey="vite-ui-theme">
            <CategoryProvider>
              <TrackingScripts />
              <Suspense fallback={<LoadingFallback />}>
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
                        <PrivateRoute requiredRole="admin">
                          <AdminDashboard />
                        </PrivateRoute>
                      }
                    />

                    {/* Not Found Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              <Toaster />
            </CategoryProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;