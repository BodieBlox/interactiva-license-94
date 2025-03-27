
import { useState, useEffect } from 'react';

export type SupportedLocale = 
  | 'en-US'   // English (United States)
  | 'es-ES'   // Spanish (Spain)
  | 'fr-FR'   // French (France)
  | 'de-DE'   // German (Germany)
  | 'it-IT'   // Italian (Italy)
  | 'pt-BR'   // Portuguese (Brazil)
  | 'ru-RU'   // Russian (Russia)
  | 'zh-CN'   // Chinese (China)
  | 'ja-JP'   // Japanese (Japan)
  | 'ko-KR';  // Korean (Korea)

export interface LocalizationSettings {
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  autoDetect: boolean;
  forceDefault: boolean;
}

const DEFAULT_LOCALIZATION_SETTINGS: LocalizationSettings = {
  defaultLocale: 'en-US',
  supportedLocales: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ru-RU', 'zh-CN', 'ja-JP', 'ko-KR'],
  autoDetect: true,
  forceDefault: false
};

const translations: Record<SupportedLocale, Record<string, Record<string, string>>> = {
  'en-US': {
    common: {
      welcome: 'Welcome',
      login: 'Log in',
      logout: 'Log out',
      register: 'Register',
      dashboard: 'Dashboard',
      settings: 'Settings',
      profile: 'Profile',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      notification: 'Notification',
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      failure: 'Failure',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
    },
    company: {
      members: 'Members',
      inviteMembers: 'Invite Members',
      permissions: 'Permissions',
      branding: 'Branding',
      settings: 'Company Settings',
      createCompany: 'Create Company',
      joinCompany: 'Join Company',
      leaveCompany: 'Leave Company',
      companyAdmin: 'Company Admin',
      companyMember: 'Company Member',
      licenseManagement: 'License Management',
      activateLicense: 'Activate License',
      deactivateLicense: 'Deactivate License',
    },
    notifications: {
      newMember: 'New member joined',
      companyUpdate: 'Company update',
      licenseExpiring: 'License expiring soon',
      systemUpdate: 'System update',
      markAsRead: 'Mark as read',
      markAllAsRead: 'Mark all as read',
      noNotifications: 'No notifications',
    },
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      passwordMismatch: 'Passwords do not match',
      serverError: 'Server error, please try again',
      unauthorized: 'Unauthorized access',
      notFound: 'Not found',
    }
  },
  // Add translations for other languages...
  'es-ES': {
    common: {
      welcome: 'Bienvenido',
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      register: 'Registrarse',
      dashboard: 'Panel',
      settings: 'Configuración',
      profile: 'Perfil',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      notification: 'Notificación',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      success: 'Éxito',
      failure: 'Fallo',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
    },
    company: {
      members: 'Miembros',
      inviteMembers: 'Invitar Miembros',
      permissions: 'Permisos',
      branding: 'Marca',
      settings: 'Configuración de la Empresa',
      createCompany: 'Crear Empresa',
      joinCompany: 'Unirse a la Empresa',
      leaveCompany: 'Abandonar Empresa',
      companyAdmin: 'Administrador de la Empresa',
      companyMember: 'Miembro de la Empresa',
      licenseManagement: 'Gestión de Licencias',
      activateLicense: 'Activar Licencia',
      deactivateLicense: 'Desactivar Licencia',
    },
    notifications: {
      newMember: 'Nuevo miembro se ha unido',
      companyUpdate: 'Actualización de la empresa',
      licenseExpiring: 'Licencia a punto de expirar',
      systemUpdate: 'Actualización del sistema',
      markAsRead: 'Marcar como leído',
      markAllAsRead: 'Marcar todo como leído',
      noNotifications: 'No hay notificaciones',
    },
    errors: {
      required: 'Este campo es obligatorio',
      invalidEmail: 'Dirección de correo electrónico inválida',
      passwordMismatch: 'Las contraseñas no coinciden',
      serverError: 'Error del servidor, por favor intente de nuevo',
      unauthorized: 'Acceso no autorizado',
      notFound: 'No encontrado',
    }
  },
  // Add more languages here
  'fr-FR': {
    // French translations
    common: {
      welcome: 'Bienvenue',
      login: 'Connexion',
      logout: 'Déconnexion',
      register: 'S\'inscrire',
      dashboard: 'Tableau de bord',
      settings: 'Paramètres',
      profile: 'Profil',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      search: 'Rechercher',
      notification: 'Notification',
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      success: 'Succès',
      failure: 'Échec',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
    },
    company: {
      members: 'Membres',
      inviteMembers: 'Inviter des membres',
      permissions: 'Permissions',
      branding: 'Image de marque',
      settings: 'Paramètres de l\'entreprise',
      createCompany: 'Créer une entreprise',
      joinCompany: 'Rejoindre une entreprise',
      leaveCompany: 'Quitter l\'entreprise',
      companyAdmin: 'Administrateur de l\'entreprise',
      companyMember: 'Membre de l\'entreprise',
      licenseManagement: 'Gestion des licences',
      activateLicense: 'Activer la licence',
      deactivateLicense: 'Désactiver la licence',
    },
    notifications: {
      newMember: 'Nouveau membre inscrit',
      companyUpdate: 'Mise à jour de l\'entreprise',
      licenseExpiring: 'Licence bientôt expirée',
      systemUpdate: 'Mise à jour du système',
      markAsRead: 'Marquer comme lu',
      markAllAsRead: 'Tout marquer comme lu',
      noNotifications: 'Aucune notification',
    },
    errors: {
      required: 'Ce champ est obligatoire',
      invalidEmail: 'Adresse e-mail invalide',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      serverError: 'Erreur du serveur, veuillez réessayer',
      unauthorized: 'Accès non autorisé',
      notFound: 'Non trouvé',
    }
  },
  'de-DE': { common: {}, company: {}, notifications: {}, errors: {} }, // German 
  'it-IT': { common: {}, company: {}, notifications: {}, errors: {} }, // Italian
  'pt-BR': { common: {}, company: {}, notifications: {}, errors: {} }, // Portuguese
  'ru-RU': { common: {}, company: {}, notifications: {}, errors: {} }, // Russian
  'zh-CN': { common: {}, company: {}, notifications: {}, errors: {} }, // Chinese
  'ja-JP': { common: {}, company: {}, notifications: {}, errors: {} }, // Japanese
  'ko-KR': { common: {}, company: {}, notifications: {}, errors: {} }, // Korean
};

export function useLocalization() {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('en-US');
  const [settings, setSettings] = useState<LocalizationSettings>(DEFAULT_LOCALIZATION_SETTINGS);
  
  useEffect(() => {
    // Load settings from local storage if available
    const savedSettings = localStorage.getItem('localizationSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as LocalizationSettings;
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing localization settings:', error);
      }
    }
    
    // Detect browser language
    if (settings.autoDetect) {
      const browserLocale = navigator.language;
      const matchedLocale = settings.supportedLocales.find(locale => 
        browserLocale.startsWith(locale.split('-')[0])
      );
      
      if (matchedLocale && !settings.forceDefault) {
        setCurrentLocale(matchedLocale);
      } else {
        setCurrentLocale(settings.defaultLocale);
      }
    } else {
      setCurrentLocale(settings.defaultLocale);
    }
  }, [settings.autoDetect, settings.defaultLocale, settings.forceDefault, settings.supportedLocales]);
  
  // Function to translate a key
  const translate = (section: string, key: string): string => {
    if (
      translations[currentLocale] && 
      translations[currentLocale][section as keyof typeof translations[typeof currentLocale]] && 
      translations[currentLocale][section as keyof typeof translations[typeof currentLocale]][key]
    ) {
      return translations[currentLocale][section as keyof typeof translations[typeof currentLocale]][key];
    }
    
    // Fallback to English
    if (
      translations['en-US'] && 
      translations['en-US'][section as keyof typeof translations['en-US']] && 
      translations['en-US'][section as keyof typeof translations['en-US']][key]
    ) {
      return translations['en-US'][section as keyof typeof translations['en-US']][key];
    }
    
    // Return the key if no translation found
    return key;
  };
  
  // Function to update settings
  const updateSettings = (newSettings: Partial<LocalizationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('localizationSettings', JSON.stringify(updatedSettings));
  };
  
  // Function to change the locale
  const changeLocale = (locale: SupportedLocale) => {
    if (settings.supportedLocales.includes(locale)) {
      setCurrentLocale(locale);
      localStorage.setItem('userLocale', locale);
    }
  };
  
  return {
    currentLocale,
    settings,
    supportedLocales: settings.supportedLocales,
    translate,
    t: translate, // Shorthand
    updateSettings,
    changeLocale
  };
}

export interface LocalizationContextProps {
  currentLocale: SupportedLocale;
  settings: LocalizationSettings;
  supportedLocales: SupportedLocale[];
  translate: (section: string, key: string) => string;
  t: (section: string, key: string) => string; // Shorthand
  updateSettings: (settings: Partial<LocalizationSettings>) => void;
  changeLocale: (locale: SupportedLocale) => void;
}
