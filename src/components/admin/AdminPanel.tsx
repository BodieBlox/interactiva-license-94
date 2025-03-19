
import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LucideIcon, Shield, Users, MessageSquare, Key, Rotate3D, LayoutDashboard } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { LoginLogs } from './LoginLogs';
import { ChatViewer } from './ChatViewer';
import { LicenseGenerator } from './LicenseGenerator';
import { LicenseRequests } from './LicenseRequests';
import { BrandingApproval } from './BrandingApproval';
import { UserCreator } from './UserCreator';
import { ManualLicenseAssignment } from './ManualLicenseAssignment';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>(window.location.pathname.split('/admin/')[1] || 'dashboard');
  const isMobile = useIsMobile();

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
    { label: 'Dashboard', path: '/admin/', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'License Requests', path: '/admin/license-requests', icon: Rotate3D },
    { label: 'Chats', path: '/admin/chats', icon: MessageSquare },
    { label: 'License Generator', path: '/admin/license-generator', icon: Key },
    { label: 'Login Logs', path: '/admin/login-logs', icon: Users },
    { label: 'Branding Approval', path: '/admin/branding-approval', icon: Users },
    { label: 'Create User', path: '/admin/create-user', icon: Users },
    { label: 'Assign License', path: '/admin/assign-license', icon: Key },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setActiveSection(path.split('/admin/')[1] || 'dashboard');
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
              variant={activeSection === (item.path.split('/admin/')[1] || 'dashboard') ? 'default' : 'ghost'}
              className={`
                ${isMobile 
                  ? 'flex-shrink-0 mr-2 px-3 h-10' 
                  : 'w-full justify-start mb-1'
                }
                ${activeSection === (item.path.split('/admin/')[1] || 'dashboard')
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
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/license-requests" element={<LicenseRequests />} />
            <Route path="/chats" element={<ChatViewer />} />
            <Route path="/license-generator" element={<LicenseGenerator />} />
            <Route path="/login-logs" element={<LoginLogs />} />
            <Route path="/branding-approval" element={<BrandingApproval />} />
            <Route path="/create-user" element={<UserCreator />} />
            <Route path="/assign-license" element={<ManualLicenseAssignment />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Simple Admin Dashboard component
const AdminDashboard = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-medium mb-4">Admin Dashboard</h2>
      <p className="text-muted-foreground mb-6">Welcome to the admin panel. Use the navigation to manage the system.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-blue-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
          onClick={() => window.location.href = '/admin/users'}
        >
          <Users className="h-8 w-8 text-blue-500" />
          <span>Manage Users</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-amber-200 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/10"
          onClick={() => window.location.href = '/admin/license-requests'}
        >
          <Rotate3D className="h-8 w-8 text-amber-500" />
          <span>License Requests</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-purple-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10"
          onClick={() => window.location.href = '/admin/license-generator'}
        >
          <Key className="h-8 w-8 text-purple-500" />
          <span>Generate Licenses</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10"
          onClick={() => window.location.href = '/admin/chats'}
        >
          <MessageSquare className="h-8 w-8 text-green-500" />
          <span>View Chat History</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={() => window.location.href = '/admin/login-logs'}
        >
          <Users className="h-8 w-8 text-red-500" />
          <span>Login Logs</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
          onClick={() => window.location.href = '/admin/assign-license'}
        >
          <Key className="h-8 w-8 text-indigo-500" />
          <span>Assign License</span>
        </Button>
      </div>
    </div>
  );
};
