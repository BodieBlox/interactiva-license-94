
import { Card, CardContent } from '@/components/ui/card';
import { User as UserIcon, Mail, Calendar } from 'lucide-react';
import { User } from '@/utils/types';
import { format } from 'date-fns';

interface UserProfileProps {
  user: User | null;
}

export const UserProfile = ({ user }: UserProfileProps) => {
  if (!user) return null;

  // Create a date 6 months from now (dummy license data)
  const licenseExpiry = new Date();
  licenseExpiry.setMonth(licenseExpiry.getMonth() + 6);
  
  return (
    <Card className="overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-primary/10 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 flex items-center gap-3 border-b border-primary/10">
        <div className="bg-primary/20 rounded-full h-10 w-10 flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-lg truncate">{user.username}</h3>
          <p className="text-sm text-muted-foreground truncate">{user.role}</p>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="truncate">{user.email}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>
            License valid until: <span className="font-medium">{format(licenseExpiry, 'MMM d, yyyy')}</span>
          </span>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm">
            <span className="text-muted-foreground">Status: </span>
            <span className={`font-medium ${user.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {user.status}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
