import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './app/store'
import "./index.css"
import "leaflet/dist/leaflet.css"

// Importing Pages
import Dashboard from './pages/dashboard/Dashboard'
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import ForgotPassword from './pages/forgot-password/ForgotPassword'
import ResetPassword from './pages/reset-password/ResetPassword'
import ResetPasswordEmailSentSuccessFully from './pages/forgot-password/ResetPasswordEmailSentSuccessFully'
import VerifyEmail from './pages/verify-email/VerifyEmail'
import GuestRoute from './layouts/GuestRoute'
import AdminRoute from './layouts/AdminRoute'
import ProtectedRoute from './layouts/ProtectedRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AppLayout from './layouts/AppLayout'
import Home from './pages/home/Home'
import ReportIncident from './pages/report/ReportIncident'
import { ThemeProvider } from './components/theme-provider'
import { LanguageProvider } from './context/LanguageContext'

const router = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<AppLayout/>}>
    {/* Protected Citizen Portal - Sign-In Required */}
    <Route element={<ProtectedRoute />}>
      <Route index element={<Home />} />
      <Route path="/report" element={<ReportIncident />} />
    </Route>

    {/* Verification Route */}
    <Route path="/verify-email" element={<VerifyEmail />} />
    
    {/* Citizen Guest Auth Routes */}
    <Route path="/" element={<GuestRoute />}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/reset-password-email-sent" element={<ResetPasswordEmailSentSuccessFully />} />
    </Route>

    {/* Dedicated Department Authority & Admin Auth Route */}
    <Route path="/admin/login" element={<AdminLogin />} />

    {/* Dedicated Department Authority Console (Restricted to Admin / Officers) */}
    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Route>
  </Route>
))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider defaultTheme='light' storageKey='ui-theme'>
        <LanguageProvider>
          <RouterProvider router={router} />
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);

// Automatically unregister stale PWA service workers and purge caches to avoid white-screen
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});

  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch(() => {});
  }
}
