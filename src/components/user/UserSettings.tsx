import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Check, ChevronsUpDown, ImagePlus, Loader2, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { updateUsername, updateDashboardCustomization, approveDashboardCustomization } from '@/utils/api';
import { DashboardCustomization } from '@/utils/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CompanyInvitation } from './CompanyInvitation';
import { PendingInvitation } from './PendingInvitation';

const accentColors = [
  {
    label: "Slate",
    value: "slate",
  },
  {
    label: "Gray",
    value: "gray",
  },
  {
    label: "Zinc",
    value: "zinc",
  },
  {
    label: "Neutral",
    value: "neutral",
  },
  {
    label: "Stone",
    value: "stone",
  },
  {
    label: "Red",
    value: "red",
  },
  {
    label: "Orange",
    value: "orange",
  },
  {
    label: "Amber",
    value: "amber",
  },
  {
    label: "Yellow",
    value: "yellow",
  },
  {
    label: "Lime",
    value: "lime",
  },
  {
    label: "Green",
    value: "green",
  },
  {
    label: "Emerald",
    value: "emerald",
  },
  {
    label: "Teal",
    value: "teal",
  },
  {
    label: "Cyan",
    value: "cyan",
  },
  {
    label: "Sky",
    value: "sky",
  },
  {
    label: "Blue",
    value: "blue",
  },
  {
    label: "Indigo",
    value: "indigo",
  },
  {
    label: "Violet",
    value: "violet",
  },
  {
    label: "Purple",
    value: "purple",
  },
  {
    label: "Fuchsia",
    value: "fuchsia",
  },
  {
    label: "Pink",
    value: "pink",
  },
  {
    label: "Rose",
    value: "rose",
  },
]

export const UserSettings = () => {
  const { user, setUser } = useAuth();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [primaryColor, setPrimaryColor] = useState(user?.customization?.primaryColor || '#7E69AB');
  const [companyName, setCompanyName] = useState(user?.customization?.companyName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingBranding, setIsSubmittingBranding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(user?.customization?.primaryColor || "indigo")

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const updatedUser = await updateUsername(user!.id, newUsername);
      setUser(updatedUser);
      toast({
        title: "Success",
        description: "Username updated successfully",
      });
    } catch (error) {
      console.error('Username update error:', error);
      toast({
        title: "Error",
        description: `Failed to update username: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanyBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: "Error",
        description: "Company name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmittingBranding(true);
    try {
      const customization: DashboardCustomization = {
        primaryColor,
        companyName,
        approved: false
      };
      
      const updatedUser = await updateDashboardCustomization(user!.id, customization);
      setUser(updatedUser);
      toast({
        title: "Branding Submitted",
        description: "Your company branding has been submitted for approval",
      });
    } catch (error) {
      console.error('Company branding error:', error);
      toast({
        title: "Error",
        description: `Failed to submit company branding: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingBranding(false);
    }
  };

  const handlePrimaryColorChange = (color: string) => {
    setPrimaryColor(color);
  };

  const handleLogoUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Logo upload functionality is under development",
    });
  };

  const handleAdminApprovalRequest = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmAdminApproval = async () => {
    setIsDialogOpen(false);
    setIsSubmittingBranding(true);
    try {
      const updatedUser = await approveDashboardCustomization(user!.id);
      setUser(updatedUser);
      toast({
        title: "Branding Approved",
        description: "Your company branding has been approved",
      });
    } catch (error) {
      console.error('Admin approval error:', error);
      toast({
        title: "Error",
        description: `Failed to approve company branding: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingBranding(false);
    }
  };

  const handleCancelAdminApproval = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 space-y-8">
      <div className="flex items-center mb-4">
        <Link to="/dashboard">
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
      
      {user && <PendingInvitation currentUser={user} />}

      <Card className="glass-panel border-0 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-medium">Account Settings</CardTitle>
          <CardDescription>Manage your account settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 transition-apple"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Update Username'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Company Branding</h3>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of your dashboard
          </p>
        </div>
        
        {user && <CompanyInvitation currentUser={user} />}
      </div>

      <Card className="glass-panel border-0 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Customize Branding</CardTitle>
          <CardDescription>Customize the appearance of your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleCompanyBrandingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-white/50 dark:bg-black/10 border-0 subtle-ring-focus transition-apple"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Primary Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full",
                      !selectedColor && "text-muted-foreground"
                    )}
                  >
                    {selectedColor ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedColor }} />
                        <span>{selectedColor}</span>
                      </div>
                    ) : (
                      <span>Pick a color</span>
                    )}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandList>
                      <CommandInput placeholder="Search color..." />
                      <CommandEmpty>No color found.</CommandEmpty>
                      <CommandGroup>
                        {accentColors.map((color) => (
                          <CommandItem
                            key={color.value}
                            value={color.value}
                            onSelect={() => {
                              setSelectedColor(color.value)
                              handlePrimaryColorChange(color.value)
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }} />
                              <span>{color.label}</span>
                            </div>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedColor === color.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <CommandSeparator />
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo (Coming Soon)</Label>
              <Button variant="secondary" className="w-full" onClick={handleLogoUpload}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 transition-apple"
              disabled={isSubmittingBranding}
            >
              {isSubmittingBranding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Branding'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Your company branding will be reviewed by an administrator before it is applied.
          </p>
        </CardFooter>
      </Card>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Admin Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to request admin approval for your company branding?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAdminApproval}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAdminApproval}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
