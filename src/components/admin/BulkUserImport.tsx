
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Check, X, Upload, AlertCircle, FileUp, UserPlus, Users } from 'lucide-react';
import { createUser } from '@/utils/api';
import { logAdminAction } from '@/utils/auditLog';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/utils/types';

interface UserImportData {
  email: string;
  username?: string;
  role?: string;
  licenseType?: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export const BulkUserImport = () => {
  const [importData, setImportData] = useState<string>('');
  const [format, setFormat] = useState<string>('csv');
  const [userRecords, setUserRecords] = useState<UserImportData[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [licenseType, setLicenseType] = useState<string>('none');
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
  }>({ total: 0, success: 0, failed: 0 });

  const parseImportData = () => {
    try {
      let records: UserImportData[] = [];
      
      if (format === 'csv') {
        // Parse CSV format
        const lines = importData.split('\n');
        // Check if there's a header row
        const hasHeader = lines[0].toLowerCase().includes('email');
        
        const startIndex = hasHeader ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const email = values[0]?.trim();
          
          if (email && email.includes('@')) {
            records.push({
              email,
              username: values[1]?.trim() || email.split('@')[0],
              role: values[2]?.trim() || 'user',
              licenseType: values[3]?.trim() || licenseType !== 'none' ? licenseType : undefined,
              status: 'pending'
            });
          }
        }
      } else if (format === 'json') {
        // Parse JSON format
        try {
          const jsonData = JSON.parse(importData);
          
          if (Array.isArray(jsonData)) {
            records = jsonData.map(item => ({
              email: item.email,
              username: item.username || item.email?.split('@')[0],
              role: item.role || 'user',
              licenseType: item.licenseType || (licenseType !== 'none' ? licenseType : undefined),
              status: 'pending'
            }));
          }
        } catch (err) {
          toast({
            title: "Invalid JSON format",
            description: "Please check your JSON data format and try again.",
            variant: "destructive"
          });
          return [];
        }
      }
      
      // Filter out invalid emails
      records = records.filter(record => {
        const isValid = record.email && /\S+@\S+\.\S+/.test(record.email);
        if (!isValid) {
          console.warn('Invalid email format:', record.email);
        }
        return isValid;
      });
      
      return records;
    } catch (error) {
      console.error('Error parsing import data:', error);
      toast({
        title: "Error parsing data",
        description: "Please check your data format and try again.",
        variant: "destructive"
      });
      return [];
    }
  };

  const handlePreview = () => {
    const records = parseImportData();
    setUserRecords(records);
    
    toast({
      title: `Parsed ${records.length} users`,
      description: "Review the list below and click Import to create the accounts."
    });
  };

  const handleImport = async () => {
    if (userRecords.length === 0) {
      toast({
        title: "No valid users to import",
        description: "Please preview your data first to validate the users.",
        variant: "destructive"
      });
      return;
    }
    
    setImporting(true);
    const results = { total: userRecords.length, success: 0, failed: 0 };
    const updatedRecords = [...userRecords];
    
    try {
      // Process users in batches to avoid overwhelming the API
      for (let i = 0; i < updatedRecords.length; i++) {
        const record = updatedRecords[i];
        
        try {
          // Create the user with required fields
          await createUser({
            id: uuidv4(), // Generate a unique ID
            email: record.email,
            username: record.username || record.email.split('@')[0],
            role: record.role as 'admin' | 'user' | 'staff',
            status: 'active', // Set default status
            licenseType: record.licenseType as 'basic' | 'premium' | 'enterprise',
            licenseActive: !!record.licenseType && record.licenseType !== 'none'
          } as User);
          
          // Update status
          updatedRecords[i] = {
            ...record,
            status: 'success',
            message: 'User created successfully'
          };
          
          results.success++;
        } catch (error) {
          console.error(`Error creating user ${record.email}:`, error);
          updatedRecords[i] = {
            ...record,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
          
          results.failed++;
        }
        
        // Update records state to show progress
        setUserRecords([...updatedRecords]);
      }
      
      // Log the bulk import action
      await logAdminAction({
        action: 'bulk_user_import',
        details: `Imported ${results.success} users (${results.failed} failed)`,
        resourceType: 'users'
      });
      
      setImportResults(results);
      
      toast({
        title: "User import complete",
        description: `Successfully imported ${results.success} users. Failed: ${results.failed}.`
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Error during import",
        description: "An unexpected error occurred during the import process.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const getExampleData = () => {
    if (format === 'csv') {
      return `email,username,role,licenseType
john@example.com,John Smith,user,basic
alice@example.com,Alice Johnson,admin,premium`;
    } else if (format === 'json') {
      return JSON.stringify([
        { email: "john@example.com", username: "John Smith", role: "user", licenseType: "basic" },
        { email: "alice@example.com", username: "Alice Johnson", role: "admin", licenseType: "premium" }
      ], null, 2);
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bulk User Import</CardTitle>
          <CardDescription>
            Import multiple users at once using CSV or JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV Format</SelectItem>
                  <SelectItem value="json">JSON Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger>
                  <SelectValue placeholder="Default license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No license</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setImportData(getExampleData())}
              className="flex items-center gap-2"
            >
              <FileUp className="h-4 w-4" />
              Example Data
            </Button>
          </div>
          
          <div>
            <Textarea 
              placeholder={`Paste your ${format.toUpperCase()} data here...`}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="h-64 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-2">
              {format === 'csv' 
                ? 'Format: email,username,role,licenseType (header row optional)'
                : 'JSON array of objects with email, username, role, licenseType'}
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={handlePreview}
              disabled={!importData.trim() || importing}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Preview
            </Button>
            
            <Button 
              onClick={handleImport}
              disabled={userRecords.length === 0 || importing}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {importing ? 'Importing...' : 'Import Users'}
            </Button>
          </div>
          
          {userRecords.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Import Preview
                <span className="text-sm font-normal text-gray-500">
                  ({userRecords.length} users)
                </span>
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRecords.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username || '-'}</TableCell>
                      <TableCell>{user.role || 'user'}</TableCell>
                      <TableCell>{user.licenseType || 'None'}</TableCell>
                      <TableCell>
                        {user.status === 'pending' ? (
                          <span className="text-gray-500">Pending</span>
                        ) : user.status === 'success' ? (
                          <span className="text-green-500 flex items-center gap-1">
                            <Check className="h-4 w-4" /> Success
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center gap-1" title={user.message}>
                            <X className="h-4 w-4" /> Failed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {importResults.total > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <h3 className="font-medium mb-2">Import Results</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
                  <p className="text-gray-500 text-sm">Total</p>
                  <p className="text-2xl font-bold">{importResults.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
                  <p className="text-green-500 text-sm">Successful</p>
                  <p className="text-2xl font-bold text-green-500">{importResults.success}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm">
                  <p className="text-red-500 text-sm">Failed</p>
                  <p className="text-2xl font-bold text-red-500">{importResults.failed}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50 flex justify-between">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Users will receive email invitations to set their passwords
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
