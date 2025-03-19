
import { useState, useEffect } from 'react';
import { License } from '@/utils/types';
import { getAllLicenses, createLicense, deleteLicense } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { KeyRound, Plus, Copy, DownloadCloud, Search, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

export const LicenseGenerator = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const allLicenses = await getAllLicenses();
        setLicenses(allLicenses);
        setFilteredLicenses(allLicenses);
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

    fetchLicenses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = licenses.filter(license => 
        license.key.toLowerCase().includes(query) || 
        (license.userId && license.userId.toLowerCase().includes(query))
      );
      setFilteredLicenses(filtered);
    } else {
      setFilteredLicenses(licenses);
    }
  }, [searchQuery, licenses]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newLicense = await createLicense();
      setLicenses([newLicense, ...licenses]);
      setFilteredLicenses([newLicense, ...filteredLicenses]);
      toast({
        title: "License Generated",
        description: "New license key has been created successfully",
      });
    } catch (error) {
      console.error('Error generating license:', error);
      toast({
        title: "Error",
        description: "Failed to generate license",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  const handleOpenDeleteDialog = (license: License) => {
    setSelectedLicense(license);
    setDialogOpen(true);
  };

  const handleDeleteLicense = async () => {
    if (!selectedLicense) return;
    
    setIsDeleting(true);
    try {
      await deleteLicense(selectedLicense.id);
      
      // Remove from state
      setLicenses(licenses.filter(l => l.id !== selectedLicense.id));
      setFilteredLicenses(filteredLicenses.filter(l => l.id !== selectedLicense.id));
      
      toast({
        title: "License Deleted",
        description: "License has been deleted successfully",
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting license:', error);
      toast({
        title: "Error",
        description: `Failed to delete license: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const exportLicensesCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "License Key,Status,Created At,User ID\n"
      + licenses.map(license => {
          return `${license.key},${license.isActive ? "Activated" : "Available"},${license.createdAt},${license.userId || ""}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `licenses-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exported",
      description: "Licenses exported to CSV file",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <p className="text-muted-foreground animate-pulse">Loading licenses...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card variant="glass" className="mb-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl font-medium mb-1 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              License Keys
            </h2>
            <p className="text-sm text-muted-foreground">Manage and generate license keys for users</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 transition-all duration-300 focus:ring-2 focus:ring-primary/30 w-full"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={exportLicensesCSV}
              className="flex items-center gap-2 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <DownloadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 transition-apple flex items-center gap-2"
            >
              {isGenerating ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Generate License</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass-panel border-0 animate-scale-in">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Activated By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLicenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <KeyRound className="h-10 w-10 text-muted-foreground/30" />
                      <p>No licenses found</p>
                      {searchQuery && (
                        <Button 
                          variant="link" 
                          onClick={() => setSearchQuery('')}
                          className="mt-1"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicenses.map((license, index) => (
                  <TableRow 
                    key={license.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TableCell className="font-mono">{license.key}</TableCell>
                    <TableCell>
                      {license.isActive ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 transition-colors">Activated</Badge>
                      ) : (
                        license.suspendedAt ? (
                          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 transition-colors">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary text-primary hover:bg-primary/10 transition-colors">Available</Badge>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(license.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {license.userId ? license.userId : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!license.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(license.key)}
                            className="flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDeleteDialog(license)}
                          className="flex items-center gap-1 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md glass-panel border-0 animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Delete License</span>
            </DialogTitle>
            <DialogDescription>
              {selectedLicense?.isActive 
                ? "This license is currently assigned to a user. Deleting it will revoke their access to premium features."
                : "Are you sure you want to delete this license? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLicense && (
            <div className="px-1 py-2">
              <p className="text-sm font-mono bg-muted/50 p-2 rounded">
                {selectedLicense.key}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteLicense}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 transition-all duration-300"
            >
              {isDeleting ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              ) : (
                'Delete License'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
