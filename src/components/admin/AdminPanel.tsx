
import { useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { CompanyManagement } from './CompanyManagement';
import { CompanyCreator } from './CompanyCreator';
import { CompanyChat } from './CompanyChat';
import { UserManagement } from './UserManagement';
import { LicenseManager } from './LicenseManager';
import { SystemSettings } from './SystemSettings';
import { LoginLogs } from './LoginLogs';
import { LicenseRequests } from './LicenseRequests';
import { BrandingApproval } from './BrandingApproval';
import { useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Building, 
  MessageCircle, 
  Shield, 
  Settings, 
  Key, 
  Clock, 
  Palette,
  FileText
} from 'lucide-react';

// Create a wrapper component that gets parameters from URL
const CompanyChatWrapper = () => {
  const { companyId } = useParams();
  
  // We need to handle the case when companyId is undefined
  if (!companyId) {
    return <div className="p-4">Company ID is required</div>;
  }
  
  return <CompanyChat companyId={companyId} companyName="Company Chat" />;
};

export const AdminPanel = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <NavLink 
            to="/admin/companies" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Building size={18} />
            <span className="hidden md:inline">Companies</span>
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Users size={18} />
            <span className="hidden md:inline">Users</span>
          </NavLink>
          
          <NavLink 
            to="/admin/company/new" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Building size={18} />
            <span className="hidden md:inline">Create Company</span>
          </NavLink>

          <NavLink 
            to="/admin/licenses" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Key size={18} />
            <span className="hidden md:inline">Licenses</span>
          </NavLink>

          <NavLink 
            to="/admin/license-requests" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <FileText size={18} />
            <span className="hidden md:inline">License Requests</span>
          </NavLink>

          <NavLink 
            to="/admin/login-logs" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Clock size={18} />
            <span className="hidden md:inline">Login Logs</span>
          </NavLink>

          <NavLink 
            to="/admin/branding-approval" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Palette size={18} />
            <span className="hidden md:inline">Branding</span>
          </NavLink>

          <NavLink 
            to="/admin/settings" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              }`
            }
          >
            <Settings size={18} />
            <span className="hidden md:inline">Settings</span>
          </NavLink>
        </div>
      </Card>

      <Routes>
        <Route path="/" element={<CompanyManagement />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="company/new" element={<CompanyCreator />} />
        <Route path="company/chat/:companyId" element={<CompanyChatWrapper />} />
        <Route path="licenses" element={<LicenseManager />} />
        <Route path="login-logs" element={<LoginLogs />} />
        <Route path="license-requests" element={<LicenseRequests />} />
        <Route path="branding-approval" element={<BrandingApproval />} />
        <Route path="settings" element={<SystemSettings />} />
      </Routes>
    </div>
  );
};
