
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Palette, Users, Link2, Copy, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

import { ProfileSettings } from './settings/ProfileSettings';
import { BrandingSettings } from './settings/BrandingSettings';
import { PendingInvitation } from './PendingInvitation';
import { CompanyInvitation } from './CompanyInvitation';

export const UserSettings = () => {
  const { user } = useAuth();
  const { userCompany, generateInviteLink } = useCompany();
  const [activeTab, setActiveTab] = useState('profile');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateInviteLink = async () => {
    if (!userCompany) return;
    
    setIsGeneratingLink(true);
    try {
      const link = await generateInviteLink(userCompany.id);
      setInviteLink(link);
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyInviteLink = () => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

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
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
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
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4 mt-4">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="team" className="space-y-4 mt-4">
          {user && userCompany && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Company Invite Link</CardTitle>
                <CardDescription>
                  Generate a link that others can use to join your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inviteLink ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={inviteLink} 
                      readOnly 
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={copyInviteLink}
                      className="flex-shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateInviteLink}
                    disabled={isGeneratingLink}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingLink ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    <span>Generate Invite Link</span>
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  This link will expire in 7 days. Anyone with this link can join your company.
                </p>
              </CardContent>
            </Card>
          )}
          {user && <CompanyInvitation currentUser={user} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};
