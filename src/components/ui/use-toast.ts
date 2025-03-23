
import { useToast, toast } from "@/hooks/use-toast";

// Re-export for easy usage throughout the application
export { useToast, toast };

// Add a convenience method for showing success toasts
toast.success = (message: string) => {
  toast({
    title: "Success",
    description: message,
    variant: "success",
  });
};

// Add a convenience method for showing error toasts
toast.error = (message: string) => {
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

// Add a convenience method for showing warning toasts
toast.warning = (message: string) => {
  toast({
    title: "Warning",
    description: message,
    variant: "warning",
  });
};

// Add a convenience method for showing info toasts
toast.info = (message: string) => {
  toast({
    title: "Info",
    description: message,
  });
};
