import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { createLicense } from '@/utils/api';
import { KeyRound, Copy, Wand, Shield, Calendar, Infinity, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const SecretKeyGenerator = () => {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [licenseType, setLicenseType] = useState<'standard' | 'premium' | 'enterprise'>('standard');
  const [showExpiration, setShowExpiration] = useState(true);
  const [expirationDays, setExpirationDays] = useState(30);
  const [copied, setCopied] = useState(false);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      // Generate license with selected type and expiration
      const licenseData = {
        type: licenseType,
        ...(showExpiration && { expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString() })
      };
      
      const license = await createLicense(licenseData);
      setGeneratedKey(license.key);
      toast({
        title: "Success",
        description: `${licenseType.charAt(0).toUpperCase() + licenseType.slice(1)} license key generated successfully`,
      });
    } catch (error) {
      console.error('Error generating key:', error);
      toast({
        title: "Error",
        description: "Failed to generate license key",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast({
        title: "Copied",
        description: "License key copied to clipboard",
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLicenseTypeIcon = () => {
    switch(licenseType) {
      case 'standard': return <KeyRound className="h-4 w-4 text-blue-500" />;
      case 'premium': return <Shield className="h-4 w-4 text-purple-500" />;
      case 'enterprise': return <Wand className="h-4 w-4 text-amber-500" />;
    }
  };

  const getLicenseColor = () => {
    switch(licenseType) {
      case 'standard': return 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700';
      case 'premium': return 'from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700';
      case 'enterprise': return 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700';
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card className="border shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
        <CardHeader className="text-center pb-2 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span>License Key Generator</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Generate license keys instantly</p>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="space-y-3">
            <Label htmlFor="licenseType">License Type</Label>
            <Select
              value={licenseType}
              onValueChange={(value) => setLicenseType(value as 'standard' | 'premium' | 'enterprise')}
            >
              <SelectTrigger id="licenseType" className="bg-white/80 dark:bg-gray-800/80 border-primary/20">
                <div className="flex items-center gap-2">
                  {getLicenseTypeIcon()}
                  <SelectValue placeholder="Select license type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-blue-500" />
                    <span>Standard</span>
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
                    <Wand className="h-4 w-4 text-amber-500" />
                    <span>Enterprise</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
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
                className="bg-white/80 dark:bg-gray-800/80 border-primary/20"
              />
            </div>
          )}

          <Button 
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className={`w-full bg-gradient-to-r ${getLicenseColor()} text-white shadow-md py-6`}
            size="lg"
          >
            {isGenerating ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
            ) : (
              <Wand className="h-5 w-5 mr-2" />
            )}
            Generate {licenseType.charAt(0).toUpperCase() + licenseType.slice(1)} License
          </Button>
        </CardContent>
        <CardFooter className="px-6 pb-6 pt-0">
          {generatedKey && (
            <div className="w-full mt-2 p-4 bg-primary/5 rounded-md border border-primary/10 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Your License Key:</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyToClipboard}
                  className="h-8 w-8 p-0 hover:bg-primary/10 text-primary"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy to clipboard</span>
                </Button>
              </div>
              <p className="font-mono text-sm break-all bg-white dark:bg-gray-800 p-3 rounded border border-primary/10 shadow-inner">
                {generatedKey}
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
