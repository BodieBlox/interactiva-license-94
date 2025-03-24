
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
import KeyGenerator from './pages/KeyGenerator';
import Index from './pages/Index';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyJoinPage } from './components/user/CompanyJoinPage';

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<Register />} />
            <Route path="/key-generator" element={<KeyGenerator />} />

            {/* Auth routes */}
            <Route path="/activate" element={<AppLayout><LicenseActivation /></AppLayout>} />
            <Route path="/join-company/:inviteCode" element={<AppLayout><CompanyJoinPage /></AppLayout>} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<AppLayout><DashboardContent /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><UserSettings /></AppLayout>} />
            <Route path="/chat/new" element={<AppLayout><div className="w-full"><ChatInterface /></div></AppLayout>} />
            <Route path="/chat/:chatId" element={<AppLayout><div className="w-full"><ChatInterface /></div></AppLayout>} />
            <Route path="/admin/*" element={<AppLayout><AdminPanel /></AppLayout>} />

            {/* Redirect and 404 */}
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
