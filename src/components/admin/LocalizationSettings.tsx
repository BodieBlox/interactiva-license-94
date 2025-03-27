import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Globe, Languages, Palette, Check } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';

export const LocalizationSettings = () => {
  const { userCompany, updateCompanyInfo } = useCompany();
  
  const [localizationConfig, setLocalizationConfig] = useState({
    enabled: userCompany?.localization?.enabled || false,
    defaultLanguage: userCompany?.localization?.defaultLanguage || 'en',
    supportedLanguages: userCompany?.localization?.supportedLanguages || ['en'],
    autoDetect: userCompany?.localization?.autoDetect || false,
    translations: userCompany?.localization?.translations || {},
  });
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
  ];
  
  const toggleLanguage = (languageCode: string) => {
    setLocalizationConfig(prev => {
      const supportedLanguages = [...prev.supportedLanguages];
      
      if (supportedLanguages.includes(languageCode)) {
        if (languageCode === prev.defaultLanguage) {
          toast({
            title: "Cannot Remove Default Language",
            description: "Please change your default language before removing this one.",
            variant: "destructive"
          });
          return prev;
        }
        return {
          ...prev,
          supportedLanguages: supportedLanguages.filter(code => code !== languageCode)
        };
      } else {
        return {
          ...prev,
          supportedLanguages: [...supportedLanguages, languageCode]
        };
      }
    });
  };
  
  const handleSaveLocalization = async () => {
    try {
      await updateCompanyInfo({
        localization: localizationConfig
      });
      
      toast({
        title: "Localization Saved",
        description: "Your localization settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving localization settings:', error);
      toast({
        title: "Error",
        description: "Failed to save localization settings. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Localization Settings
        </CardTitle>
        <CardDescription>
          Configure language settings for your company's global presence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="localization-enabled">Enable Localization</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to view the platform in their preferred language
              </p>
            </div>
            <Switch
              id="localization-enabled"
              checked={localizationConfig.enabled}
              onCheckedChange={(checked) => 
                setLocalizationConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="default-language">Default Language</Label>
            <Select
              value={localizationConfig.defaultLanguage}
              onValueChange={(value) => 
                setLocalizationConfig(prev => ({ ...prev, defaultLanguage: value }))
              }
              disabled={!localizationConfig.enabled}
            >
              <SelectTrigger id="default-language" className="w-full">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.filter(lang => 
                  localizationConfig.supportedLanguages.includes(lang.code)
                ).map(language => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Supported Languages</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Select which languages your application will support
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {languages.map(language => (
                <div
                  key={language.code}
                  className={`
                    flex items-center justify-between p-3 rounded-md cursor-pointer
                    ${localizationConfig.supportedLanguages.includes(language.code) 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'border border-border hover:bg-secondary/50'}
                  `}
                  onClick={() => toggleLanguage(language.code)}
                >
                  <span>{language.name}</span>
                  {localizationConfig.supportedLanguages.includes(language.code) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-detect">Auto-detect User Language</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect and apply the user's preferred language
              </p>
            </div>
            <Switch
              id="auto-detect"
              checked={localizationConfig.autoDetect}
              onCheckedChange={(checked) => 
                setLocalizationConfig(prev => ({ ...prev, autoDetect: checked }))
              }
              disabled={!localizationConfig.enabled}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveLocalization} disabled={!localizationConfig.enabled}>
          Save Localization Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LocalizationSettings;
