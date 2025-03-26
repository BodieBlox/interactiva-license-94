
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { AppLayout } from './components/layout/AppLayout';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoginForm } from './components/auth/LoginForm';
import { LicenseActivation } from './components/auth/LicenseActivation';
import { DashboardContent } from './components/dashboard/Dashboard';
import { ChatInterface } from './components/dashboard/ChatInterface';
import { UserSettings } from './components/user/UserSettings';
import CompanyGeneratorPage from './pages/CompanyGenerator';
import CompanyManagementPage from './pages/CompanyManagement';
import Index from './pages/Index';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyJoinPage } from './components/user/CompanyJoinPage';
import { ThemeProvider } from "next-themes";

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<Register />} />

              {/* App layout wrapper for authenticated routes */}
              <Route element={<AppLayout />}>
                {/* Auth routes */}
                <Route path="/activate" element={<LicenseActivation />} />
                <Route path="/join-company/:inviteCode" element={<CompanyJoinPage />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<DashboardContent />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/chat/new" element={<div className="w-full"><ChatInterface /></div>} />
                <Route path="/chat/:chatId" element={<div className="w-full"><ChatInterface /></div>} />
                
                {/* Admin routes */}
                <Route path="/admin/*" element={<AdminPanel />} />
                <Route path="/admin/companies" element={<CompanyManagementPage />} />
                <Route path="/admin/company/new" element={<CompanyGeneratorPage />} />
              </Route>

              {/* Redirect and 404 */}
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
