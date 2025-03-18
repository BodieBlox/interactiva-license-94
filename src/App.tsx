
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginForm } from "./components/auth/LoginForm";
import { LicenseActivation } from "./components/auth/LicenseActivation";
import { DashboardContent } from "./components/dashboard/Dashboard";
import { ChatInterface } from "./components/dashboard/ChatInterface";
import { LicenseGenerator } from "./components/admin/LicenseGenerator";
import { UserManagement } from "./components/admin/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/activate" element={<LicenseActivation />} />
            <Route path="/dashboard" element={<DashboardContent />} />
            <Route path="/chat/:chatId" element={<ChatInterface chatId="new" />} />
            <Route path="/admin" element={<UserManagement />} />
            <Route path="/admin/licenses" element={<LicenseGenerator />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
