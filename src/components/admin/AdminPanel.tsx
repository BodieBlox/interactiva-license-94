
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LucideIcon, Shield, Users, MessageSquare, Key, Rotate3D, LayoutDashboard, Building } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { LoginLogs } from './LoginLogs';
import { ChatViewer } from './ChatViewer';
import LicenseGenerator from './LicenseGenerator';
import { LicenseRequests } from './LicenseRequests';
import { BrandingApproval } from './BrandingApproval';
import { UserCreator } from './UserCreator';
import ManualLicenseAssignment from './ManualLicenseAssignment';
import { useIsMobile } from '@/hooks/use-mobile';
import LicenseManager from './LicenseManager';
import CompaniesManagement from './CompaniesManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

// Create a QueryClient instance
const queryClient = new QueryClient();

export const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Get the active section from the current path
  const getActiveSection = () => {
    const path = location.pathname;
    const section = path.split('/admin/')[1] || '';
    return section;
  };
  
  const [activeSection, setActiveSection] = useState<string>(getActiveSection());
  
  // Update activeSection when location changes
  useEffect(() => {
    setActiveSection(getActiveSection());
  }, [location]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access the admin panel.</p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Companies', path: '/admin/companies', icon: Building },
    { label: 'License Requests', path: '/admin/license-requests', icon: Rotate3D },
    { label: 'Chats', path: '/admin/chats', icon: MessageSquare },
    { label: 'License Generator', path: '/admin/license-generator', icon: Key },
    { label: 'Manage Licenses', path: '/admin/manage-licenses', icon: Key },
    { label: 'Login Logs', path: '/admin/login-logs', icon: Users },
    { label: 'Branding Approval', path: '/admin/branding-approval', icon: Users },
    { label: 'Create User', path: '/admin/create-user', icon: Users },
    { label: 'Assign License', path: '/admin/assign-license', icon: Key },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-medium">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, licenses, and system settings</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className={`${isMobile ? 'flex flex-row overflow-x-auto pb-4 -mx-4 px-4' : 'w-64 min-w-64 space-y-2'}`}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={activeSection === (item.path.split('/admin/')[1] || '') ? 'default' : 'ghost'}
              className={`
                ${isMobile 
                  ? 'flex-shrink-0 mr-2 px-3 h-10' 
                  : 'w-full justify-start mb-1'
                }
                ${activeSection === (item.path.split('/admin/')[1] || '')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
                }
              `}
              onClick={() => handleNavigation(item.path)}
            >
              <item.icon className={`${isMobile ? 'mr-0' : 'mr-2'} h-4 w-4`} />
              {!isMobile && <span>{item.label}</span>}
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white dark:bg-gray-950 rounded-lg border shadow-sm p-4 md:p-6">
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/companies" element={<CompaniesManagement />} />
              <Route path="/license-requests" element={<LicenseRequests />} />
              <Route path="/chats" element={<ChatViewer />} />
              <Route path="/license-generator" element={<LicenseGenerator />} />
              <Route path="/manage-licenses" element={<LicenseManager />} />
              <Route path="/login-logs" element={<LoginLogs />} />
              <Route path="/branding-approval" element={<BrandingApproval />} />
              <Route path="/create-user" element={<UserCreator />} />
              <Route path="/assign-license" element={<ManualLicenseAssignment />} />
            </Routes>
          </QueryClientProvider>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-medium mb-4">Admin Dashboard</h2>
      <p className="text-muted-foreground mb-6">Welcome to the admin panel. Use the navigation to manage the system.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
          onClick={() => navigate('/admin/users')}
        >
          <Users className="h-8 w-8 text-blue-500" />
          <span>Manage Users</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-amber-200 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10"
          onClick={() => navigate('/admin/license-requests')}
        >
          <Rotate3D className="h-8 w-8 text-amber-500" />
          <span>License Requests</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10"
          onClick={() => navigate('/admin/license-generator')}
        >
          <Key className="h-8 w-8 text-purple-500" />
          <span>Generate Licenses</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10"
          onClick={() => navigate('/admin/chats')}
        >
          <MessageSquare className="h-8 w-8 text-green-500" />
          <span>View Chat History</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={() => navigate('/admin/login-logs')}
        >
          <Users className="h-8 w-8 text-red-500" />
          <span>Login Logs</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
          onClick={() => navigate('/admin/companies')}
        >
          <Building className="h-8 w-8 text-indigo-500" />
          <span>Manage Companies</span>
        </Button>
      </div>
    </div>
  );
};
