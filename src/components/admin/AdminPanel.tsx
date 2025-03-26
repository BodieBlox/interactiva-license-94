
import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { CompanyManagement } from './CompanyManagement';
import { CompanyCreator } from './CompanyCreator';
import { CompanyChat } from './CompanyChat';
import { UserManagement } from './UserManagement';
import { useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Users, Building, MessageCircle, Shield } from 'lucide-react';

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
        </div>
      </Card>

      <Routes>
        <Route path="/" element={<CompanyManagement />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="company/new" element={<CompanyCreator />} />
        <Route path="company/chat/:companyId" element={<CompanyChatWrapper />} />
      </Routes>
    </div>
  );
};
