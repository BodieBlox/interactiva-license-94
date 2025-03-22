
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Lock, Key } from 'lucide-react';

export const BrandingSettings = () => {
  const { user } = useAuth();
  const isPartOfCompany = user?.customization?.isCompanyMember || (user?.customization?.companyName && user?.customization?.approved);
  
  // Show current license key and type first
  if (user?.licenseKey) {
    return (
      <div className="space-y-6">
        <Card className="bg-blue-900/30 border-blue-700/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Key className="h-5 w-5 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-blue-300 font-medium">
                Your License: <span className="font-mono">{user.licenseKey}</span>
              </p>
              <p className="text-sm text-blue-400/80">
                Type: {user.licenseType || 'Standard'} · Status: {user.licenseActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </CardContent>
        </Card>

        {isPartOfCompany ? (
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Company Managed
              </CardTitle>
              <CardDescription>
                Your branding is managed by your company administrator
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-6 text-center">
              <div className="bg-background/50 p-4 rounded-lg border border-border/50 mb-4 w-full max-w-md">
                <p className="font-medium">
                  Company: {user?.customization?.companyName}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div 
                    className="h-4 w-4 rounded-full" 
                    style={{ backgroundColor: user?.customization?.primaryColor || '#6366f1' }} 
                  />
                  <span className="text-sm text-muted-foreground">
                    {user?.customization?.primaryColor}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Your dashboard branding is managed by your company administrator. You cannot modify these settings yourself.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                Company Branding
              </CardTitle>
              <CardDescription>
                Company branding can only be managed by administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <Building className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="max-w-md mx-auto">
                Company branding allows customization of your dashboard with company colors and logo. 
                Please contact an administrator to be added to a company.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } else {
    // If no license, just show a message
    return (
      <Card className="bg-amber-900/30 border-amber-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            License Required
          </CardTitle>
          <CardDescription className="text-amber-400/80">
            You need an active license to access branding features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6 text-center">
          <Building className="h-16 w-16 text-amber-500/20 mb-4" />
          <p className="text-amber-300">
            Please activate a license to access branding features.
          </p>
        </CardContent>
      </Card>
    );
  }
};
