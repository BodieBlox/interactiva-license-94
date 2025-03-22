import { useState, useEffect } from 'react';
import { LicenseRequest } from '@/utils/types';
import { getLicenseRequests, approveLicenseRequest, rejectLicenseRequest } from '@/utils/api';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, KeyRound, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const LicenseRequests = () => {
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LicenseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LicenseRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const allRequests = await getLicenseRequests();
      
      const sortedRequests = allRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setRequests(sortedRequests);
      setFilteredRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching license requests:', error);
      toast({
        title: "Error",
        description: "Failed to load license requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = requests.filter(request => 
        request.username.toLowerCase().includes(query) || 
        request.email.toLowerCase().includes(query)
      );
      setFilteredRequests(filtered);
    } else {
      setFilteredRequests(requests);
    }
  }, [searchQuery, requests]);
  
  const handleOpenDialog = (request: LicenseRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setDialogOpen(true);
  };
  
  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    
    setIsProcessing(true);
    try {
      if (actionType === 'approve') {
        await approveLicenseRequest(selectedRequest.id, '');
        toast({
          title: "Success",
          description: `License request from ${selectedRequest.username} has been approved`,
          variant: "success"
        });
      } else {
        await rejectLicenseRequest(selectedRequest.id, 'Request rejected by admin');
        toast({
          title: "Success",
          description: `License request from ${selectedRequest.username} has been rejected`,
          variant: "success"
        });
      }
      
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === selectedRequest.id
            ? { 
                ...req, 
                status: actionType === 'approve' ? 'approved' : 'rejected',
                resolvedAt: new Date().toISOString()
              }
            : req
        )
      );
      
      setFilteredRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === selectedRequest.id
            ? { 
                ...req, 
                status: actionType === 'approve' ? 'approved' : 'rejected',
                resolvedAt: new Date().toISOString()
              }
            : req
        )
      );
      
      setDialogOpen(false);
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} request: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchRequests();
  };
  
  const renderStatusBadge = (status: LicenseRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-red-500 text-red-500">Rejected</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
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
              License Requests
            </h2>
            <p className="text-sm text-muted-foreground">Manage pending license requests from users</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 transition-all duration-300 focus:ring-2 focus:ring-primary/30 w-full"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="glass-panel border-0 animate-scale-in">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <KeyRound className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-muted-foreground">No license requests found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request, index) => (
                  <TableRow 
                    key={request.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell className="font-medium">{request.username}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{renderStatusBadge(request.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {request.message || 'No message provided'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(request, 'approve')}
                            className="flex items-center gap-1 text-green-500 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(request, 'reject')}
                            className="flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}
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
              {actionType === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>
                {actionType === 'approve' ? 'Approve' : 'Reject'} License Request
              </span>
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `This will approve the license request from ${selectedRequest?.username} and automatically assign them a license.`
                : `This will reject the license request from ${selectedRequest?.username}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={isProcessing}
              className={actionType === 'approve'
                ? 'bg-green-500 hover:bg-green-600 transition-all duration-300'
                : 'bg-red-500 hover:bg-red-600 transition-all duration-300'
              }
            >
              {isProcessing ? (
                <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              ) : (
                actionType === 'approve' ? 'Approve' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
