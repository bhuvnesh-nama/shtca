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
import AdminLogin from './pages/admin/AdminLogin'
import AppLayout from './layouts/AppLayout'
import Home from './pages/home/Home'
import ReportIncident from './pages/report/ReportIncident'
import { ThemeProvider } from './components/theme-provider'
import { LanguageProvider } from './context/LanguageContext'

const router = createBrowserRouter(createRoutesFromElements(
  <Route path="/" element={<AppLayout/>}>
    {/* Public Citizen Portal */}
    <Route>
      <Route index element={<Home />} />
      <Route path="/report" element={<ReportIncident />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Route>
    
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

// Register PWA service worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed:', err);
    });
  });
}
