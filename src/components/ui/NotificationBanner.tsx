
import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBannerProps {
  type: 'warning' | 'error';
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

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 p-4 transition-all duration-300 ease-apple',
        'animate-slide-in transform-gpu',
        type === 'warning' ? 'bg-amber-50 border-b border-amber-200' : 'bg-red-50 border-b border-red-200'
      )}
    >
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={cn(
              "h-5 w-5",
              type === 'warning' ? 'text-amber-500' : 'text-red-500'
            )} />
            <p className={cn(
              "text-sm font-medium",
              type === 'warning' ? 'text-amber-800' : 'text-red-800'
            )}>
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={cn(
              "rounded-full p-1 transition-colors duration-200",
              type === 'warning' ? 'text-amber-500 hover:bg-amber-100' : 'text-red-500 hover:bg-red-100'
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
