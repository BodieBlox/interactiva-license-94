import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  LucideIcon, 
  Shield, 
  Users, 
  MessageSquare, 
  Key, 
  Rotate3D, 
  LayoutDashboard, 
  Building,
  ArrowUp,
  Activity,
  UserCheck
} from 'lucide-react';
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
import { CompanyManagementPanel } from './company/CompanyManagementPanel';
import { UpgradeRequests } from './UpgradeRequests';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SystemSettings } from './SystemSettings';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  staffAccess?: boolean;
}

const queryClient = new QueryClient();

export const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/admin') return '';
    const section = path.split('/admin/')[1];
    return section || '';
  };
  
  const [activeSection, setActiveSection] = useState<string>(getActiveSection());
  
  useEffect(() => {
    setActiveSection(getActiveSection());
  }, [location]);

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-red-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access the admin panel.</p>
        <Button 
          onClick={() => navigate('/dashboard')}
          className="animate-scale-in"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, staffAccess: true },
    { label: 'Users', path: '/admin/users', icon: Users, staffAccess: true },
    { label: 'Companies', path: '/admin/companies', icon: Building, staffAccess: true },
    { label: 'License Requests', path: '/admin/license-requests', icon: Rotate3D, staffAccess: false },
    { label: 'Upgrade Requests', path: '/admin/upgrade-requests', icon: ArrowUp, staffAccess: false },
    { label: 'Chats', path: '/admin/chats', icon: MessageSquare, staffAccess: true },
    { label: 'License Generator', path: '/admin/license-generator', icon: Key, staffAccess: false },
    { label: 'Manage Licenses', path: '/admin/manage-licenses', icon: Key, staffAccess: true },
    { label: 'Login Logs', path: '/admin/login-logs', icon: Activity, staffAccess: false },
    { label: 'Branding Approval', path: '/admin/branding-approval', icon: Shield, staffAccess: false },
    { label: 'Create User', path: '/admin/create-user', icon: UserCheck, staffAccess: true },
    { label: 'Assign License', path: '/admin/assign-license', icon: Key, staffAccess: false },
    { label: 'System Settings', path: '/admin/system-settings', icon: Shield, staffAccess: false },
  ];

  const filteredNavItems = navItems.filter(item => isAdmin || item.staffAccess);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-medium bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent animate-fade-in">
            {isAdmin ? 'LicenseAI Admin' : 'LicenseAI Staff Portal'}
          </h1>
          <p className="text-muted-foreground animate-fade-in" style={{animationDelay: "0.1s"}}>
            {isAdmin 
              ? "Manage users, licenses, and system settings" 
              : "View and manage users, companies, and licenses"}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className={`${isMobile ? 'flex flex-row overflow-x-auto pb-4 -mx-4 px-4' : 'w-64 min-w-64 space-y-2'}`}>
          {filteredNavItems.map((item, index) => (
            <Button
              key={item.path}
              variant={activeSection === (item.path.split('/admin/')[1] || '') ? 'default' : 'ghost'}
              className={`
                ${isMobile 
                  ? 'flex-shrink-0 mr-2 px-3 h-10' 
                  : 'w-full justify-start mb-1 overflow-hidden'
                }
                ${activeSection === (item.path.split('/admin/')[1] || '')
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'hover:bg-muted transition-colors'
                }
                transition-all duration-300 animate-fade-in
              `}
              style={{animationDelay: `${index * 0.05}s`}}
              onClick={() => handleNavigation(item.path)}
            >
              <item.icon className={`${isMobile ? 'mr-0' : 'mr-2'} h-4 w-4`} />
              {!isMobile && <span className="truncate">{item.label}</span>}
            </Button>
          ))}
        </div>

        <div className="flex-1 bg-card rounded-lg border shadow-sm p-4 md:p-6 transition-all duration-300 hover:shadow-md animate-fade-in">
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/users" element={<UserManagement />} />
              {(isAdmin || isStaff) && <Route path="/companies" element={<CompanyManagementPanel />} />}
              {isAdmin && <Route path="/license-requests" element={<LicenseRequests />} />}
              {isAdmin && <Route path="/upgrade-requests" element={<UpgradeRequests />} />}
              {(isAdmin || isStaff) && <Route path="/chats" element={<ChatViewer />} />}
              {isAdmin && <Route path="/license-generator" element={<LicenseGenerator />} />}
              {(isAdmin || isStaff) && <Route path="/manage-licenses" element={<LicenseManager />} />}
              {isAdmin && <Route path="/login-logs" element={<LoginLogs />} />}
              {isAdmin && <Route path="/branding-approval" element={<BrandingApproval />} />}
              {(isAdmin || isStaff) && <Route path="/create-user" element={<UserCreator />} />}
              {isAdmin && <Route path="/assign-license" element={<ManualLicenseAssignment />} />}
              {isAdmin && <Route path="/system-settings" element={<SystemSettings />} />}
              {(!isAdmin && isStaff) && <Route path="*" element={<StaffAccessDenied />} />}
            </Routes>
          </QueryClientProvider>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-medium mb-2 flex items-center gap-2">
        {isAdmin ? (
          <><Shield className="h-5 w-5 text-primary" /> Admin Dashboard</>
        ) : (
          <><UserCheck className="h-5 w-5 text-blue-500" /> Staff Dashboard</>
        )}
      </h2>
      <p className="text-muted-foreground mb-6">
        {isAdmin 
          ? "Welcome to the LicenseAI admin panel. Use the navigation to manage the system."
          : "Welcome to the staff portal. You have access to view and manage users, companies, and licenses."}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-scale-in"
          style={{animationDelay: "0.1s"}}
          onClick={() => navigate('/admin/users')}
        >
          <Users className="h-8 w-8 text-primary" />
          <span>Manage Users</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-scale-in"
          style={{animationDelay: "0.2s"}}
          onClick={() => navigate('/admin/companies')}
        >
          <Building className="h-8 w-8 text-primary" />
          <span>Manage Companies</span>
        </Button>
        
        {isAdmin && (
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-300 animate-scale-in"
            style={{animationDelay: "0.3s"}}
            onClick={() => navigate('/admin/license-requests')}
          >
            <Rotate3D className="h-8 w-8 text-amber-500" />
            <span>License Requests</span>
          </Button>
        )}
        
        {isAdmin && (
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 animate-scale-in"
            style={{animationDelay: "0.4s"}}
            onClick={() => navigate('/admin/upgrade-requests')}
          >
            <ArrowUp className="h-8 w-8 text-purple-500" />
            <span>Upgrade Requests</span>
          </Button>
        )}
        
        {isAdmin && (
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all duration-300 animate-scale-in"
            style={{animationDelay: "0.5s"}}
            onClick={() => navigate('/admin/license-generator')}
          >
            <Key className="h-8 w-8 text-purple-500" />
            <span>Generate Licenses</span>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5 transition-all duration-300 animate-scale-in"
          style={{animationDelay: "0.6s"}}
          onClick={() => navigate('/admin/chats')}
        >
          <MessageSquare className="h-8 w-8 text-green-500" />
          <span>View Chat History</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 animate-scale-in"
          style={{animationDelay: "0.7s"}}
          onClick={() => navigate('/admin/manage-licenses')}
        >
          <Key className="h-8 w-8 text-blue-500" />
          <span>Manage Licenses</span>
        </Button>

        {(isAdmin || isStaff) && (
          <Button 
            variant="outline" 
            className="h-auto py-6 flex flex-col items-center justify-center gap-3 text-lg border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300 animate-scale-in"
            style={{animationDelay: "0.8s"}}
            onClick={() => navigate('/admin/create-user')}
          >
            <UserCheck className="h-8 w-8 text-blue-500" />
            <span>Create User</span>
          </Button>
        )}
      </div>
    </div>
  );
};

const StaffAccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <Shield className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-medium mb-2">Access Restricted</h2>
      <p className="text-muted-foreground mb-4">
        This section is only available to administrators.
      </p>
      <p className="text-sm text-muted-foreground">
        Staff members have limited access to certain admin features.
      </p>
    </div>
  );
};
