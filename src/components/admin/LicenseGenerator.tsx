
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateLicense } from '@/utils/api';
import { Key, Copy, Calendar, Infinity, Shield, UserCog, Users } from 'lucide-react';

export default function LicenseGenerator() {
  const [licenseType, setLicenseType] = useState<'basic' | 'premium' | 'enterprise'>('basic');
  const [expirationDays, setExpirationDays] = useState(30);
  const [maxUsers, setMaxUsers] = useState(5);
  const [showExpiration, setShowExpiration] = useState(true);
  const [generatedLicense, setGeneratedLicense] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Convert UI license type to API compatible types
      const apiLicenseType = licenseType === 'basic' ? 'standard' : licenseType;
      
      // Generate license key with the selected type, expiration and max users
      const licenseKey = await generateLicense(
        apiLicenseType, 
        showExpiration ? expirationDays : undefined,
        maxUsers
      );
      
      // Set the generated license key
      setGeneratedLicense(licenseKey.key);
      
      toast({
        title: "License Generated",
        description: `New ${licenseType} ${showExpiration ? 'temporary' : 'permanent'} company license key has been generated successfully`,
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
      <Card className="bg-white shadow-sm border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b pb-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Key className="h-5 w-5 text-indigo-500" />
            Company License Generator
          </CardTitle>
          <CardDescription>
            Generate license keys for companies with customizable options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="licenseType" className="text-sm font-medium">License Type</Label>
            <Select
              value={licenseType}
              onValueChange={(value) => setLicenseType(value as 'basic' | 'premium' | 'enterprise')}
            >
              <SelectTrigger id="licenseType" className="bg-white">
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-500" />
                    <span>Basic</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span>Premium</span>
                  </div>
                </SelectItem>
                <SelectItem value="enterprise">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-amber-500" />
                    <span>Enterprise</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxUsers" className="text-sm font-medium">Maximum Users</Label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input 
                id="maxUsers"
                type="number" 
                min="1"
                value={maxUsers} 
                onChange={(e) => setMaxUsers(parseInt(e.target.value) || 5)}
                className="bg-white"
              />
            </div>
            <p className="text-xs text-muted-foreground">Maximum number of users allowed in the company</p>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="expiration-mode"
              checked={showExpiration}
              onCheckedChange={setShowExpiration}
            />
            <Label htmlFor="expiration-mode" className="flex items-center gap-2 text-sm">
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
              <Label htmlFor="expirationDays" className="text-sm font-medium">Expiration Period (days)</Label>
              <Input 
                id="expirationDays"
                type="number" 
                min="1"
                value={expirationDays} 
                onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                className="bg-white"
              />
            </div>
          )}

          {generatedLicense && (
            <div className="w-full mt-4 p-4 bg-slate-50 rounded-md border border-slate-100 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700">Generated Company License Key</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className="h-8 w-8 p-0 hover:bg-slate-100"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy to clipboard</span>
                </Button>
              </div>
              <div className="relative">
                <Input 
                  value={generatedLicense} 
                  readOnly 
                  className="pr-10 font-mono text-xs bg-white border-slate-200"
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-gray-50/50 border-t p-6">
          <Button 
            onClick={handleGenerate} 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
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
                Generate Company License Key
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
