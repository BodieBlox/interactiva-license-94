
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { createLicense } from '@/utils/api';
import { KeyRound, Copy, Wand } from 'lucide-react';

export const SecretKeyGenerator = () => {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      // Generate standard license with 30-day expiration
      const license = await createLicense('standard', 30);
      setGeneratedKey(license.key);
      toast({
        title: "Success",
        description: "License key generated successfully",
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
      toast({
        title: "Copied",
        description: "License key copied to clipboard",
      });
    }
  };

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <Card className="border shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span>License Key Generator</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Generate license keys instantly</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <Button 
            onClick={handleGenerateKey}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
            ) : (
              <Wand className="h-4 w-4 mr-2" />
            )}
            Generate License Key
          </Button>

          {generatedKey && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Your License Key:</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyToClipboard}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy to clipboard</span>
                </Button>
              </div>
              <p className="font-mono text-sm break-all">{generatedKey}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
