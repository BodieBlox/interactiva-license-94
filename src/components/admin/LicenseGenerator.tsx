
import { useState, useEffect } from 'react';
import { License } from '@/utils/types';
import { getAllLicenses, createLicense } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { KeyRound, Plus, Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const LicenseGenerator = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const allLicenses = await getAllLicenses();
        setLicenses(allLicenses);
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newLicense = await createLicense();
      setLicenses([newLicense, ...licenses]);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-medium">License Keys</h2>
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
          <span>Generate New License</span>
        </Button>
      </div>

      <Card className="glass-panel border-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">License Key</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Activated By</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No licenses found
                    </td>
                  </tr>
                ) : (
                  licenses.map(license => (
                    <tr key={license.id} className="border-b last:border-0 hover:bg-muted/30 transition-apple">
                      <td className="p-4 font-mono">{license.key}</td>
                      <td className="p-4">
                        {license.isActive ? (
                          <Badge variant="default" className="bg-green-500">Activated</Badge>
                        ) : (
                          <Badge variant="outline" className="border-primary text-primary">Available</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(license.createdAt), { addSuffix: true })}
                      </td>
                      <td className="p-4 text-sm">
                        {license.userId ? license.userId : '—'}
                      </td>
                      <td className="p-4 text-right">
                        {!license.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(license.key)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
