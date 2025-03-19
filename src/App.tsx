
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/key-generator" element={<KeyGenerator />} />

        {/* Auth routes */}
        <Route path="/activate" element={<AppLayout><LicenseActivation /></AppLayout>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<AppLayout><DashboardContent /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><UserSettings /></AppLayout>} />
        <Route path="/chat/new" element={<AppLayout><ChatInterface /></AppLayout>} />
        <Route path="/chat/:chatId" element={<AppLayout><ChatInterface /></AppLayout>} />
        <Route path="/admin/*" element={<AppLayout><AdminPanel /></AppLayout>} />

        {/* Redirect and 404 */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
