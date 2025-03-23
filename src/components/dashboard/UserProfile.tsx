
import { Card, CardContent } from '@/components/ui/card';
import { User as UserIcon, Mail, Calendar, Shield, AlertCircle } from 'lucide-react';
import { User } from '@/utils/types';
import { format, isAfter } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface UserProfileProps {
  user: User | null;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!user) return null;
  
  // Get the expiry date from user object
  const expiryDate = user.licenseExpiryDate ? new Date(user.licenseExpiryDate) : null;
  
  // Check if license is valid
  const isLicenseValid = user.licenseActive && expiryDate && isAfter(expiryDate, new Date());
  
  // Check if expiring soon (within 30 days)
  const isExpiringSoon = isLicenseValid && expiryDate && 
    !isAfter(expiryDate, new Date(new Date().setDate(new Date().getDate() + 30)));
  
  return (
    <Card className="overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 flex items-center gap-3 border-b border-primary/10">
        <div className="bg-primary/20 rounded-full h-10 w-10 flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg truncate">{user.username}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground truncate">{user.role || 'User'}</p>
            {user.role === 'admin' && (
              <Badge variant="outline" className="text-amber-500 border-amber-500 px-1.5 py-0 text-[10px]">
                <Shield className="h-2.5 w-2.5 mr-0.5" />
                ADMIN
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="truncate">{user.email}</span>
        </div>
        
        {expiryDate && (
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              License valid until: <span className="font-medium">{format(expiryDate, 'MMM d, yyyy')}</span>
              {isExpiringSoon && (
                <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500 px-1.5 py-0 text-[10px]">
                  <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                  EXPIRES SOON
                </Badge>
              )}
            </span>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Status: </span>
              <span className={`font-medium ${isLicenseValid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isLicenseValid ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary/80 hover:text-primary"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
          
          {showDetails && (
            <div className="mt-3 text-xs space-y-2 bg-primary/5 p-3 rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">License ID:</span>
                <span className="font-mono">{user.licenseId || user.licenseKey || 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier:</span>
                <span>{user.licenseType || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Not available'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
