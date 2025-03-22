
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAllLicenses, deleteLicense, updateLicense } from '@/utils/api';
import { Copy, Trash, Key, Calendar, Infinity, Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { License } from '@/utils/types';
import { Badge } from '@/components/ui/badge';

const LicenseManager = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const fetchedLicenses = await getAllLicenses();
      // Sort licenses: active first, then by creation date (newest first)
      const sortedLicenses = fetchedLicenses.sort((a, b) => {
        // First by status (active first)
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setLicenses(sortedLicenses);
      setFilteredLicenses(sortedLicenses);
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
        license.status.toLowerCase().includes(query) ||
        (license.userId && license.userId.toLowerCase().includes(query))
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
    
    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };
  
  const handleActivateLicense = async () => {
    if (!selectedLicense) return;
    
    setIsProcessing(true);
    try {
      await updateLicense(selectedLicense.id, {
        status: 'active',
        isActive: true
      });
      
      // Update local state
      setLicenses(prevLicenses => 
        prevLicenses.map(license => 
          license.id === selectedLicense.id 
            ? { ...license, status: 'active', isActive: true } 
            : license
        )
      );
      
      toast({
        title: "License Activated",
        description: "The license has been activated successfully",
      });
      setActivateDialogOpen(false);
    } catch (error) {
      console.error('Error activating license:', error);
      toast({
        title: "Error",
        description: "Failed to activate license",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeactivateLicense = async () => {
    if (!selectedLicense) return;
    
    setIsProcessing(true);
    try {
      await updateLicense(selectedLicense.id, {
        status: 'inactive',
        isActive: false
      });
      
      // Update local state
      setLicenses(prevLicenses => 
        prevLicenses.map(license => 
          license.id === selectedLicense.id 
            ? { ...license, status: 'inactive', isActive: false } 
            : license
        )
      );
      
      toast({
        title: "License Deactivated",
        description: "The license has been deactivated successfully",
      });
      setDeactivateDialogOpen(false);
    } catch (error) {
      console.error('Error deactivating license:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate license",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const normalizeType = (type: string): string => {
    // Convert 'standard' to 'basic' for display consistency
    if (type.toLowerCase() === 'standard') return 'Basic';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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
        <CardHeader className="pb-0">
          <Badge variant="outline" className="mb-2 w-auto">
            Total: {filteredLicenses.length} license{filteredLicenses.length !== 1 ? 's' : ''}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
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
                      <TableCell>
                        <Badge variant="outline" className={
                          license.type === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          license.type === 'enterprise' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }>
                          {normalizeType(license.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${license.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                            license.status === 'revoked' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`
                        }>
                          {license.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate">
                        {license.userId || 'Unassigned'}
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
                          
                          {license.status !== 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLicense(license);
                                setActivateDialogOpen(true);
                              }}
                              className="h-8 px-2 text-green-500 hover:text-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
                          {license.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLicense(license);
                                setDeactivateDialogOpen(true);
                              }}
                              className="h-8 px-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          
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
      
      {/* Delete Dialog */}
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
                <span>Type: {normalizeType(selectedLicense.type)}</span>
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
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Delete License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Activate Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activate License</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate this license?
            </DialogDescription>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="p-4 border rounded-md bg-muted/50 mb-4">
              <p className="font-mono text-sm mb-2">{selectedLicense.key}</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Type: {normalizeType(selectedLicense.type)}</span>
                <span>Current Status: {selectedLicense.status}</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActivateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleActivateLicense}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Activate License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Deactivate Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate License</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this license?
            </DialogDescription>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="p-4 border rounded-md bg-muted/50 mb-4">
              <p className="font-mono text-sm mb-2">{selectedLicense.key}</p>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Type: {normalizeType(selectedLicense.type)}</span>
                <span>Current Status: {selectedLicense.status}</span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeactivateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleDeactivateLicense}
              disabled={isProcessing}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isProcessing ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Deactivate License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenseManager;
