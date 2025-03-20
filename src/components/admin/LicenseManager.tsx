import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllLicenses, deleteLicense } from '@/utils/api';
import { Copy, Trash, Key, Calendar, Infinity, Search, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { License } from '@/utils/types';

const LicenseManager = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const fetchedLicenses = await getAllLicenses();
      setLicenses(fetchedLicenses);
      setFilteredLicenses(fetchedLicenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error",
        description: "Failed to load licenses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = licenses.filter(license => 
        license.key.toLowerCase().includes(query) ||
        license.type.toLowerCase().includes(query) ||
        license.status.toLowerCase().includes(query)
      );
      setFilteredLicenses(filtered);
    } else {
      setFilteredLicenses(licenses);
    }
  }, [searchQuery, licenses]);

  const handleCopyLicense = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  const handleDeleteLicense = async () => {
    if (!selectedLicense) return;
    
    setIsDeleting(true);
    try {
      await deleteLicense(selectedLicense.id);
      setLicenses(prevLicenses => prevLicenses.filter(license => license.id !== selectedLicense.id));
      toast({
        title: "License Deleted",
        description: "The license has been deleted successfully",
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting license:', error);
      toast({
        title: "Error",
        description: "Failed to delete license",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="mb-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl font-medium mb-1 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              License Management
            </h2>
            <p className="text-sm text-muted-foreground">View, copy, and delete license keys</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={fetchLicenses}
              className="whitespace-nowrap"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Key className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-muted-foreground">No licenses found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLicenses.map((license, index) => (
                    <TableRow 
                      key={license.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <TableCell className="font-mono text-xs">{license.key}</TableCell>
                      <TableCell className="capitalize">{license.type}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${license.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                            license.status === 'revoked' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`
                        }>
                          {license.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {license.expiresAt ? (
                            <>
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{formatDate(license.expiresAt)}</span>
                            </>
                          ) : (
                            <>
                              <Infinity className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Never</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(license.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLicense(license.key)}
                            className="h-8 px-2 text-muted-foreground"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLicense(license);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete License</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this license? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="p-4 border rounded-md bg-muted/50 mb-4">
              <p className="font-mono text-sm mb-2">{selectedLicense.key}</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Type: {selectedLicense.type}</span>
                <span>Status: {selectedLicense.status}</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteLicense}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Delete License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenseManager;
