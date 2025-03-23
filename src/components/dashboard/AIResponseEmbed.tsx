
import React from 'react';
import {
  User, Clock, Calendar, Shield, Database, 
  Key, Check, XCircle, Star, FileText,
  Building, UserCheck, AlertTriangle, UserRound,
  Info, MessageCircle, List, Mail, UserX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AIResponseEmbedProps {
  content: string;
  isAdminAction?: boolean;
}

export const AIResponseEmbed: React.FC<AIResponseEmbedProps> = ({ content, isAdminAction }) => {
  // Helper to check if content is JSON data
  const isJsonString = (str: string) => {
    try {
      const json = JSON.parse(str);
      return typeof json === 'object' && json !== null;
    } catch (e) {
      return false;
    }
  };

  // Check if content contains admin action result
  const containsAdminAction = content.includes('Successfully executed') || 
                             content.includes('Failed to execute');

  // Check if content is likely a user listing
  const isUserListing = content.includes('Found') && content.includes('users:') && 
                       content.includes('Username') && content.includes('Email');

  // Check if content is likely user details
  const isUserDetails = content.includes('User Details:') && 
                       (content.includes('Username:') || content.includes('Email:'));

  // Format user list
  const formatUserList = (content: string) => {
    if (!content.includes('users:')) return null;
    
    const titleMatch = content.match(/Found (\d+) users:/);
    const userCount = titleMatch ? titleMatch[1] : '0';
    
    // Split content into lines and process after the "Found X users:" line
    const lines = content.split('\n');
    const userLines = lines.slice(1); // Skip the title line
    
    return (
      <Card className="w-full border shadow-sm animate-fade-in overflow-hidden">
        <CardHeader className="bg-primary/5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              User Directory
            </CardTitle>
            <Badge variant="outline" className="bg-primary/10">
              {userCount} users
            </Badge>
          </div>
          <CardDescription>
            Complete list of system users and their status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {userLines.map((line, index) => {
              if (!line.trim() || !line.includes('-')) return null;
              
              // Parse user information from the line format: "- username (email): status, Role: role, License: active/inactive"
              const userMatch = line.match(/- (.*?) \((.*?)\): (.*?), Role: (.*?), License: (.*)/);
              
              if (!userMatch) return null;
              
              const [_, username, email, status, role, license] = userMatch;
              
              return (
                <div key={index} className="p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full p-1.5 bg-primary/10">
                        <UserRound className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{username}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {status.includes('active') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : status.includes('warned') ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Warned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Suspended
                        </Badge>
                      )}
                      
                      {role.includes('admin') ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          Admin
                        </Badge>
                      ) : role.includes('staff') ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Staff
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          User
                        </Badge>
                      )}
                      
                      {license.includes('Active') ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Licensed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          No License
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Format table rows
  const formatTableContent = (content: string) => {
    const lines = content.split('\n');
    
    return (
      <div className="overflow-x-auto animate-fade-in">
        <table className="w-full border-collapse">
          <thead>
            {lines.map((line, i) => {
              if (line.startsWith('| ') && i === 0) {
                const headers = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
                return (
                  <tr key={`header-${i}`} className="bg-primary/10 dark:bg-primary/20">
                    {headers.map((header, j) => (
                      <th key={`header-${i}-${j}`} className="p-2 text-left font-medium text-sm">
                        {header}
                      </th>
                    ))}
                  </tr>
                );
              }
              return null;
            })}
          </thead>
          <tbody>
            {lines.map((line, i) => {
              if (line.startsWith('| ') && i > 1 && !line.includes('| --')) {
                const cells = line.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
                return (
                  <tr key={`row-${i}`} className="border-b border-muted hover:bg-muted/20 transition-colors">
                    {cells.map((cell, j) => (
                      <td key={`cell-${i}-${j}`} className="p-2 text-sm">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Format user details
  const formatUserDetails = (content: string) => {
    if (isUserListing) return null;
    
    // Extract username and email if available
    const usernameMatch = content.match(/Username:\s*([^\n]+)/);
    const emailMatch = content.match(/Email:\s*([^\n]+)/);
    const statusMatch = content.match(/Status:\s*([^\n]+)/);
    const roleMatch = content.match(/Role:\s*([^\n]+)/);
    const licenseMatch = content.match(/License:\s*([^\n]+)/);
    const createdMatch = content.match(/Account created:\s*([^\n]+)/);
    const lastLoginMatch = content.match(/Last login:\s*([^\n]+)/);
    
    const username = usernameMatch ? usernameMatch[1].trim() : 'Unknown User';
    const email = emailMatch ? emailMatch[1].trim() : '';
    const status = statusMatch ? statusMatch[1].trim() : '';
    const role = roleMatch ? roleMatch[1].trim() : '';
    const license = licenseMatch ? licenseMatch[1].trim() : '';
    const created = createdMatch ? createdMatch[1].trim() : '';
    const lastLogin = lastLoginMatch ? lastLoginMatch[1].trim() : '';
    
    // Function to get status badge
    const getStatusBadge = (status: string) => {
      if (status.includes('active')) {
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      } else if (status.includes('warned')) {
        return (
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warned
          </Badge>
        );
      } else if (status.includes('suspended')) {
        return (
          <Badge variant="outline" className="border-red-300 text-red-700">
            <UserX className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      }
      return status;
    };
    
    // Function to get role badge
    const getRoleBadge = (role: string) => {
      if (role.includes('admin')) {
        return (
          <Badge variant="outline" className="border-purple-300 text-purple-700">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      } else if (role.includes('staff')) {
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            <UserCheck className="h-3 w-3 mr-1" />
            Staff
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-700">
          <User className="h-3 w-3 mr-1" />
          User
        </Badge>
      );
    };
    
    return (
      <Card className="w-full border shadow-sm animate-fade-in overflow-hidden">
        <CardHeader className="bg-primary/5 pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              User Profile
            </CardTitle>
            {getRoleBadge(role)}
          </div>
          <CardDescription>
            Detailed information for {username}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-medium">{username}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  {email}
                </div>
                <div className="flex gap-2 mt-1">
                  {getStatusBadge(status)}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  Account Information
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <span>{getStatusBadge(status)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Role</span>
                    <span>{getRoleBadge(role)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Created</span>
                    <span className="text-sm">{created}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Login</span>
                    <span className="text-sm">{lastLogin}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                  <Key className="h-4 w-4 mr-1" />
                  License Information
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">License Status</span>
                    <span>
                      {license.includes('Active') ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </span>
                  </div>
                  
                  {license.includes('(') && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">License Type</span>
                      <span className="text-sm">
                        {license.match(/\((.*?)\)/)?.[1] || 'Standard'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Format admin action result
  const formatAdminAction = (content: string) => {
    const isSuccess = content.includes('Successfully');
    const actionType = content.match(/executed (\w+) action/)?.[1] || 
                      content.match(/(suspended|warned|activated|revoked)/i)?.[1] || '';
    const username = content.match(/for user (\S+)/)?.[1] || 
                    content.match(/User (.*?) has been/)?.[1] || '';
    
    return (
      <div className={`rounded-lg border p-4 shadow-sm animate-scale-in ${
        isSuccess ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
                  'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-start gap-3">
          {isSuccess ? (
            <div className="rounded-full bg-green-100 dark:bg-green-800/30 p-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
            </div>
          ) : (
            <div className="rounded-full bg-red-100 dark:bg-red-800/30 p-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
          <div>
            <h4 className={`font-medium ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {isSuccess ? 'Action Completed' : 'Action Failed'}
            </h4>
            <p className="mt-1 text-sm">
              {content}
            </p>
            {username && actionType && (
              <div className="mt-2 flex gap-2">
                <Badge variant="outline" className={isSuccess ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}>
                  {actionType}
                </Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {username}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Check for different types of content and format accordingly
  if (isAdminAction) {
    // For user listing
    if (isUserListing) {
      return formatUserList(content);
    }
    
    // For user details
    if (isUserDetails) {
      return formatUserDetails(content);
    }
    
    // For table data
    if (content.includes('| --') && content.includes('|')) {
      return formatTableContent(content);
    }
    
    // For admin action results
    if (containsAdminAction) {
      return formatAdminAction(content);
    }
    
    // Attempt to parse JSON responses 
    if (isJsonString(content)) {
      try {
        const jsonData = JSON.parse(content);
        return (
          <Card className="w-full border shadow-sm animate-fade-in">
            <CardHeader className="bg-primary/5 pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Database Results
              </CardTitle>
              <CardDescription>
                Raw data response from the system
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <pre className="text-xs bg-muted/50 p-4 rounded-md overflow-x-auto">
                {JSON.stringify(jsonData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
      } catch (e) {
        // Fallback to regular format if JSON parsing fails
      }
    }
  }

  // Default formatting for regular messages
  return (
    <div className="whitespace-pre-wrap animate-fade-in">
      {content.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i !== content.split('\n').length - 1 && <br />}
        </span>
      ))}
    </div>
  );
};
