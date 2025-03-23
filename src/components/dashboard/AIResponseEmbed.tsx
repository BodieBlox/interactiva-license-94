
import React from 'react';
import {
  User, Clock, Calendar, Shield, Database, 
  Key, Check, XCircle, Star, FileText,
  Building, UserCheck, AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
    const lines = content.split('\n');
    let currentSection = '';
    
    return (
      <div className="bg-card rounded-lg p-4 shadow-sm border animate-fade-in">
        {lines.map((line, i) => {
          if (line.startsWith('## ')) {
            currentSection = line.replace('## ', '');
            return (
              <h3 key={`section-${i}`} className="text-lg font-bold mt-3 mb-2 flex items-center gap-2">
                {currentSection.includes('User') && <User className="h-4 w-4 text-primary" />}
                {currentSection.includes('License') && <Key className="h-4 w-4 text-amber-500" />}
                {currentSection.includes('Company') && <Building className="h-4 w-4 text-blue-500" />}
                {currentSection}
              </h3>
            );
          } else if (line.startsWith('- **')) {
            const [key, value] = line.replace('- **', '').split('**: ');
            
            return (
              <div key={`detail-${i}`} className="flex justify-between py-1.5 border-b border-muted last:border-0">
                <span className="font-medium text-muted-foreground">{key}</span>
                <span className="text-right">
                  {value?.includes('active') && key.includes('Status') ? (
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  ) : value?.includes('warned') && key.includes('Status') ? (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">Warned</Badge>
                  ) : value?.includes('suspended') && key.includes('Status') ? (
                    <Badge variant="outline" className="text-red-500 border-red-500">Suspended</Badge>
                  ) : value?.includes('true') || value === 'Yes' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : value?.includes('false') || value === 'No' ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : value?.includes('admin') ? (
                    <Shield className="h-4 w-4 text-purple-500" />
                  ) : value?.includes('staff') ? (
                    <UserCheck className="h-4 w-4 text-blue-500" />
                  ) : (
                    value
                  )}
                </span>
              </div>
            );
          } else if (line.trim() !== '') {
            return <p key={`text-${i}`} className="my-2">{line}</p>;
          }
          return null;
        })}
      </div>
    );
  };

  // Format admin action result
  const formatAdminAction = (content: string) => {
    const isSuccess = content.includes('Successfully');
    const actionType = content.match(/executed (\w+) action/)?.[1] || '';
    const username = content.match(/for user (\S+)/)?.[1] || '';
    
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
    // For table data
    if (content.includes('| --') && content.includes('|')) {
      return formatTableContent(content);
    }
    
    // For user details
    if (content.includes('## User Details') || content.includes('- **')) {
      return formatUserDetails(content);
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
          <div className="bg-card rounded-lg p-4 shadow-sm border animate-fade-in">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Database className="h-4 w-4" />
              <h3 className="font-medium">Database Results</h3>
            </div>
            <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-x-auto">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
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
