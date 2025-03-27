
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Globe, Check, Languages } from 'lucide-react';
import { useLocalization, SupportedLocale, LocalizationSettings } from '@/utils/localization';

export const LocalizationSettings = () => {
  const { currentLocale, settings, supportedLocales, updateSettings, changeLocale } = useLocalization();
  
  const [localSettings, setLocalSettings] = useState<LocalizationSettings>({
    ...settings
  });
  
  const handleToggleChange = (field: keyof LocalizationSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  const handleDefaultLocaleChange = (value: SupportedLocale) => {
    setLocalSettings(prev => ({
      ...prev,
      defaultLocale: value
    }));
  };
  
  const handleLocaleSelect = (locale: SupportedLocale) => {
    changeLocale(locale);
    toast({
      title: "Language Changed",
      description: `User interface language changed to ${getLocaleName(locale)}`,
    });
  };
  
  const handleSaveSettings = () => {
    updateSettings(localSettings);
    toast({
      title: "Settings Saved",
      description: "Localization settings have been updated",
    });
  };
  
  const getLocaleName = (locale: SupportedLocale): string => {
    const localeNames: Record<SupportedLocale, string> = {
      'en-US': 'English (US)',
      'es-ES': 'Español (España)',
      'fr-FR': 'Français (France)',
      'de-DE': 'Deutsch (Deutschland)',
      'it-IT': 'Italiano (Italia)',
      'pt-BR': 'Português (Brasil)',
      'ru-RU': 'Русский (Россия)',
      'zh-CN': '中文 (中国)',
      'ja-JP': '日本語 (日本)',
      'ko-KR': '한국어 (한국)'
    };
    
    return localeNames[locale] || locale;
  };
  
  const getLocaleFlag = (locale: SupportedLocale): string => {
    const flagEmojis: Record<SupportedLocale, string> = {
      'en-US': '🇺🇸',
      'es-ES': '🇪🇸',
      'fr-FR': '🇫🇷',
      'de-DE': '🇩🇪',
      'it-IT': '🇮🇹',
      'pt-BR': '🇧🇷',
      'ru-RU': '🇷🇺',
      'zh-CN': '🇨🇳',
      'ja-JP': '🇯🇵',
      'ko-KR': '🇰🇷'
    };
    
    return flagEmojis[locale] || '🌐';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Localization Settings
        </CardTitle>
        <CardDescription>
          Configure language settings and translation preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/30 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Current Language
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {supportedLocales.map((locale) => (
              <Button
                key={locale}
                variant={locale === currentLocale ? "default" : "outline"}
                className="flex items-center justify-start gap-2"
                onClick={() => handleLocaleSelect(locale)}
              >
                <span className="text-lg">{getLocaleFlag(locale)}</span>
                <span className="text-sm truncate">{getLocaleName(locale)}</span>
                {locale === currentLocale && <Check className="h-3 w-3 ml-auto" />}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Admin Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-detect User Language</p>
                <p className="text-sm text-muted-foreground">
                  Automatically detect and use the user's browser language
                </p>
              </div>
              <Switch
                checked={localSettings.autoDetect}
                onCheckedChange={() => handleToggleChange('autoDetect')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Force Default Language</p>
                <p className="text-sm text-muted-foreground">
                  Override user browser language with the default language
                </p>
              </div>
              <Switch
                checked={localSettings.forceDefault}
                onCheckedChange={() => handleToggleChange('forceDefault')}
              />
            </div>
            
            <div>
              <p className="font-medium mb-1">Default Language</p>
              <Select 
                value={localSettings.defaultLocale} 
                onValueChange={(value) => handleDefaultLocaleChange(value as SupportedLocale)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {supportedLocales.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      <div className="flex items-center gap-2">
                        <span>{getLocaleFlag(locale)}</span>
                        <span>{getLocaleName(locale)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveSettings}>
          Save Localization Settings
        </Button>
      </CardFooter>
    </Card>
  );
};
