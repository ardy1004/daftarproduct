import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';

// Lazy load page components
const Home = lazy(() => import('@/pages/Home'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminLogin = lazy(() => import('@/pages/AdminLogin'));
const NotFound = lazy(() => import('@/pages/not-found'));

import PrivateRoute from '@/components/PrivateRoute';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { TrackingScripts } from '@/components/TrackingScripts';

// Loading spinner component for Suspense fallback
const FullPageSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TrackingScripts />
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
