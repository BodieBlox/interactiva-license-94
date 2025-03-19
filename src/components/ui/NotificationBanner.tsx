
import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBannerProps {
  type: 'warning' | 'error' | 'success' | 'info';
  message: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const NotificationBanner = ({
  type,
  message,
  isOpen = true,
  onClose
}: NotificationBannerProps) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(isOpen);
    if (isOpen) setIsExiting(false);
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    
    // Wait for animation to complete before fully closing
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-50 border-b border-amber-200',
          icon: 'text-amber-500',
          text: 'text-amber-800',
          button: 'text-amber-500 hover:bg-amber-100'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-b border-red-200',
          icon: 'text-red-500',
          text: 'text-red-800',
          button: 'text-red-500 hover:bg-red-100'
        };
      case 'success':
        return {
          bg: 'bg-green-50 border-b border-green-200',
          icon: 'text-green-500',
          text: 'text-green-800',
          button: 'text-green-500 hover:bg-green-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-b border-blue-200',
          icon: 'text-blue-500',
          text: 'text-blue-800',
          button: 'text-blue-500 hover:bg-blue-100'
        };
      default:
        return {
          bg: 'bg-gray-50 border-b border-gray-200',
          icon: 'text-gray-500',
          text: 'text-gray-800',
          button: 'text-gray-500 hover:bg-gray-100'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 p-4 backdrop-blur-sm shadow-md',
        'transition-all duration-300 ease-apple',
        styles.bg,
        isExiting ? 'animate-slide-out' : 'animate-slide-in'
      )}
    >
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("flex items-center justify-center h-8 w-8 rounded-full bg-white/80", styles.icon)}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className={cn(
              "text-sm font-medium",
              styles.text
            )}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "rounded-full p-1.5 transition-colors duration-200 bg-white/80",
              styles.button,
              "hover-lift"
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
