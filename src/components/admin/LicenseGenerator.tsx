
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateLicense } from '@/utils/api';
import { Key, Copy, Calendar, Infinity } from 'lucide-react';

export default function LicenseGenerator() {
  const [licenseType, setLicenseType] = useState('standard');
  const [expirationDays, setExpirationDays] = useState(30);
  const [showExpiration, setShowExpiration] = useState(true);
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Generate license key with the selected type
      const licenseKey = await generateLicense(licenseType, showExpiration ? expirationDays : undefined);
      
      // Set the generated license key
      setGeneratedLicense(licenseKey.key);
      
      toast({
        title: "License Generated",
        description: `New ${licenseType} ${showExpiration ? 'temporary' : 'permanent'} license key has been generated successfully`,
      });
    } catch (error) {
      console.error('Error generating license:', error);
      toast({
        title: "Error",
        description: "Failed to generate license key",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLicense);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>License Generator</CardTitle>
          <CardDescription>
            Generate license keys for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="licenseType">License Type</Label>
            <Select
              value={licenseType}
              onValueChange={setLicenseType}
            >
              <SelectTrigger id="licenseType">
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="expiration-mode"
              checked={showExpiration}
              onCheckedChange={setShowExpiration}
            />
            <Label htmlFor="expiration-mode" className="flex items-center gap-2">
              {showExpiration ? (
                <>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Set Expiration Period</span>
                </>
              ) : (
                <>
                  <Infinity className="h-4 w-4 text-muted-foreground" />
                  <span>Perpetual License (No Expiration)</span>
                </>
              )}
            </Label>
          </div>
          
          {showExpiration && (
            <div className="space-y-2">
              <Label htmlFor="expirationDays">Expiration Period (days)</Label>
              <Input 
                id="expirationDays"
                type="number" 
                min="1"
                value={expirationDays} 
                onChange={(e) => setExpirationDays(parseInt(e.target.value))}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-white" />
                Generating...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Generate License Key
              </>
            )}
          </Button>
          
          {generatedLicense && (
            <div className="w-full pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Generated License Key:</p>
              <div className="relative">
                <Input 
                  value={generatedLicense} 
                  readOnly 
                  className="pr-10 font-mono text-xs"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute right-0 top-0 h-full px-3" 
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
