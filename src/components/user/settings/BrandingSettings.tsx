
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, ImagePlus, Loader2, Palette, Building, AlertTriangle, CheckCircle2, Lock, Key } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { updateDashboardCustomization, approveDashboardCustomization } from '@/utils/api';
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

import { colorOptions } from './colorOptions';

export const BrandingSettings = () => {
  const { user, setUser } = useAuth();
  const [companyName, setCompanyName] = useState(user?.customization?.companyName || '');
  const [selectedColor, setSelectedColor] = useState(user?.customization?.primaryColor || "indigo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isApproved = user?.customization?.approved;
  const isPendingApproval = user?.customization?.companyName && !isApproved;
  const isEnterpriseLicense = user?.licenseType === 'enterprise';
  const isAdmin = user?.role === 'admin';
  const isCompanyAdmin = user?.isCompanyAdmin;
  const isPartOfCompany = user?.customization?.isCompanyMember || (user?.customization?.companyName && user?.customization?.approved && !user?.isCompanyAdmin);

  // Updated condition: User can access branding if they have enterprise license OR are an admin OR are the company admin
  const canAccessBranding = isEnterpriseLicense || isAdmin || isCompanyAdmin;
  
  // Only company admins or regular admins can edit company branding
  const canEditBranding = (isEnterpriseLicense && isCompanyAdmin) || isAdmin;

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
    
    if (!canAccessBranding) {
      toast({
        title: "Enterprise License Required",
        description: "Company branding features require an enterprise license",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const customization: DashboardCustomization = {
        primaryColor: selectedColor,
        companyName,
        approved: false,
        isCompanyMember: false
      };
      
      const updatedUser = await updateDashboardCustomization(user!.id, customization);
      setUser(updatedUser);
      
      // If user is admin, auto-approve and set as company admin
      if (isAdmin) {
        const approvedUser = await approveDashboardCustomization(user!.id);
        setUser({
          ...approvedUser,
          isCompanyAdmin: true
        });
        toast({
          title: "Branding Approved",
          description: "Your company branding has been auto-approved (admin privileges)",
        });
      } else {
        toast({
          title: "Branding Submitted",
          description: "Your company branding has been submitted for approval",
        });
      }
    } catch (error) {
      console.error('Company branding error:', error);
      toast({
        title: "Error",
        description: `Failed to submit company branding: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // For admins only - handle self-approval
  const handleAdminApprovalRequest = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmAdminApproval = async () => {
    setIsDialogOpen(false);
    setIsSubmitting(true);
    try {
      const updatedUser = await approveDashboardCustomization(user!.id);
      setUser({
        ...updatedUser,
        isCompanyAdmin: true
      });
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
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Logo upload functionality is under development",
    });
  };

  // Show current license key and type first
  if (user?.licenseKey) {
    return (
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Key className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-blue-800 dark:text-blue-400 font-medium">
                Your License: <span className="font-mono">{user.licenseKey}</span>
              </p>
              <p className="text-sm text-blue-700/80 dark:text-blue-500/80">
                Type: {user.licenseType || 'Standard'} · Status: {user.licenseActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </CardContent>
        </Card>
      
        {/* Status Cards */}
        {isPendingApproval && (
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <p className="text-amber-800 dark:text-amber-400 text-sm">
                Your branding changes are pending admin approval
              </p>
            </CardContent>
          </Card>
        )}
        
        {isApproved && (
          <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
              <p className="text-green-800 dark:text-green-400 text-sm">
                Your company branding is approved and active
              </p>
            </CardContent>
          </Card>
        )}

        {/* Check permissions for accessing branding features */}
        {!canAccessBranding && !isPartOfCompany && (
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                Enterprise Feature
              </CardTitle>
              <CardDescription className="text-amber-700">
                Company branding requires an enterprise license
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 text-center">
              <Building className="h-16 w-16 text-amber-400/30 mb-4" />
              <p className="max-w-md mb-2 text-amber-800 dark:text-amber-400">
                Company branding allows you to customize the appearance of your dashboard with your company colors and logo.
              </p>
              <p className="text-sm text-amber-700/80 dark:text-amber-500/80">
                Please upgrade to an enterprise license or contact your administrator to access this feature.
              </p>
            </CardContent>
          </Card>
        )}

        {isPartOfCompany && !canEditBranding && (
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Company Managed
              </CardTitle>
              <CardDescription className="text-blue-700">
                Your branding is managed by your company administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 mb-4 w-full max-w-md">
                <p className="text-blue-800 dark:text-blue-400 font-medium">
                  Company: {user?.customization?.companyName}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: colorOptions.find(c => c.value === user?.customization?.primaryColor)?.color || user?.customization?.primaryColor }} />
                  <span className="text-sm text-blue-700 dark:text-blue-500">
                    {colorOptions.find(c => c.value === user?.customization?.primaryColor)?.label || user?.customization?.primaryColor}
                  </span>
                </div>
              </div>
              <p className="text-sm text-blue-700/80 dark:text-blue-500/80 max-w-md">
                Your dashboard branding is managed by your company administrator. You cannot modify these settings yourself.
              </p>
            </CardContent>
          </Card>
        )}

        {canAccessBranding && canEditBranding && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Branding
              </CardTitle>
              <CardDescription>
                Customize the appearance of your dashboard with your company's branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanyBrandingSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-white/50 dark:bg-black/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex items-center justify-between w-full",
                          !selectedColor && "text-muted-foreground"
                        )}
                      >
                        {selectedColor ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-4 w-4 rounded-full" 
                              style={{ 
                                backgroundColor: colorOptions.find(c => c.value === selectedColor)?.color || selectedColor 
                              }} 
                            />
                            <span>{colorOptions.find(c => c.value === selectedColor)?.label || selectedColor}</span>
                          </div>
                        ) : (
                          <span>Select a color</span>
                        )}
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search color..." />
                        <CommandList>
                          <CommandEmpty>No color found.</CommandEmpty>
                          <CommandGroup>
                            {colorOptions.map((color) => (
                              <CommandItem
                                key={color.value}
                                value={color.value}
                                onSelect={() => {
                                  setSelectedColor(color.value);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="h-4 w-4 rounded-full" 
                                    style={{ backgroundColor: color.color }} 
                                  />
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
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleLogoUpload}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload Logo (Coming Soon)
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting || !companyName.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Palette className="mr-2 h-4 w-4" />
                      <span>Submit Branding</span>
                    </>
                  )}
                </Button>
                
                {isPendingApproval && isAdmin && (
                  <Button 
                    type="button" 
                    onClick={handleAdminApprovalRequest}
                    className="w-full mt-2"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Self-Approve (Admin)
                  </Button>
                )}
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "As an admin, you can self-approve your branding." : "Your company branding will be reviewed by an administrator before it is applied."}
              </p>
            </CardFooter>
          </Card>
        )}

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Admin Self-Approval</AlertDialogTitle>
              <AlertDialogDescription>
                As an admin, you can approve your own branding. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAdminApproval}>Approve</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  } else {
    // If no license, just show a message
    return (
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            License Required
          </CardTitle>
          <CardDescription className="text-amber-700">
            You need an active license to access branding features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6 text-center">
          <Building className="h-16 w-16 text-amber-400/30 mb-4" />
          <p className="max-w-md mb-2 text-amber-800 dark:text-amber-400">
            Please activate a license to access branding features.
          </p>
        </CardContent>
      </Card>
    );
  }
};
