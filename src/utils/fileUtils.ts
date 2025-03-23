
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';

/**
 * Uploads an image file and returns the URL
 * @param file The file to upload
 * @param path Optional path to store the file
 * @returns The URL of the uploaded file
 */
export const uploadImage = async (file: File, path = 'uploads'): Promise<string> => {
  // In a real app, this would upload to a storage service
  // For now, we'll create a local URL
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        // In a real app, this would be the URL returned from the storage service
        const fileId = uuidv4();
        const fileExtension = file.name.split('.').pop();
        const storagePath = `${path}/${fileId}.${fileExtension}`;
        
        // For demo purposes, we're just using the data URL
        // In a real application, this would be an API call to upload the file
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Validates an image file before upload
 * @param file The file to validate
 * @param maxSizeMB Maximum size in MB
 * @returns True if valid, false otherwise
 */
export const validateImageFile = (file: File, maxSizeMB = 5): boolean => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    toast({
      title: "Invalid file type",
      description: "Please select an image file",
      variant: "destructive"
    });
    return false;
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    toast({
      title: "File too large",
      description: `File size must be less than ${maxSizeMB}MB`,
      variant: "destructive"
    });
    return false;
  }
  
  return true;
};
