import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// LandingPage is directly imported for zero initial CLS on home route
import { LandingPage } from '../pages/LandingPage';

// All other application routes are lazy-loaded on-demand
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));

const DashboardPage = lazy(() => import('../pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ScannerPage = lazy(() => import('../pages/ScannerPage').then(m => ({ default: m.ScannerPage })));
const CompliancePage = lazy(() => import('../pages/CompliancePage').then(m => ({ default: m.CompliancePage })));
const HealthAnalysisPage = lazy(() => import('../pages/HealthAnalysisPage').then(m => ({ default: m.HealthAnalysisPage })));
const HistoryPage = lazy(() => import('../pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ReportPage = lazy(() => import('../pages/ReportPage').then(m => ({ default: m.ReportPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="w-8 h-8 rounded-full border-3 border-[#123C2A]/20 border-t-[#123C2A] animate-spin" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Home Route (Zero CLS) */}
      <Route path="/" element={<LandingPage />} />

      {/* Lazy-Loaded Public Routes */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/signup"
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <SignupPage />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />

      {/* Lazy-Loaded Protected Authenticated Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <ScannerPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/compliance-analysis"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <CompliancePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/health-analysis"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <HealthAnalysisPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <HistoryPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <ReportPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Suspense fallback={<RouteLoadingFallback />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
