
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Palette, Users, Globe, BookOpen, Bell } from 'lucide-react';

import { ProfileSettings } from './settings/ProfileSettings';
import { BrandingSettings } from './settings/BrandingSettings';
import { PendingInvitation } from './PendingInvitation';
import { CompanyInvitation } from './CompanyInvitation';
import { LocalizationSettings } from '@/components/admin/LocalizationSettings';
import { CompanyOnboarding } from '@/components/admin/CompanyOnboarding';

export const UserSettings = () => {
  const { user } = useAuth();
  const { userCompany } = useCompany();
  const [activeTab, setActiveTab] = useState('profile');
  const isCompanyAdmin = user?.isCompanyAdmin || user?.companyRole === 'admin';

  return (
    <div className="container max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
      
      {user && <PendingInvitation currentUser={user} />}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden md:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Team</span>
          </TabsTrigger>
          {isCompanyAdmin && (
            <>
              <TabsTrigger value="onboarding" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden md:inline">Onboarding</span>
              </TabsTrigger>
              <TabsTrigger value="localization" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden md:inline">Language</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4 mt-4">
          {user && <CompanyInvitation currentUser={user} />}
        </TabsContent>

        {isCompanyAdmin && (
          <>
            <TabsContent value="onboarding" className="space-y-4 mt-4">
              <CompanyOnboarding />
            </TabsContent>
            
            <TabsContent value="localization" className="space-y-4 mt-4">
              <LocalizationSettings />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};
