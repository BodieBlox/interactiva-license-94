
import { useToast, toast as originalToast } from "@/hooks/use-toast";

// Create an extended toast object with our additional methods
interface ExtendedToast {
  (props: Parameters<typeof originalToast>[0]): ReturnType<typeof originalToast>;
  success(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
}

// Create our extended toast function
const toast = originalToast as ExtendedToast;

// Add convenience methods for showing different types of toasts
toast.success = (message: string) => {
  originalToast({
    title: "Success",
    description: message,
    variant: "success",
  });
};

toast.error = (message: string) => {
  originalToast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

toast.warning = (message: string) => {
  originalToast({
    title: "Warning",
    description: message,
    variant: "warning",
  });
};

toast.info = (message: string) => {
  originalToast({
    title: "Info",
    description: message,
  });
};

// Re-export for easy usage throughout the application
export { useToast, toast };
