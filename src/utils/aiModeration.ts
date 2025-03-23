
import { toast } from '@/components/ui/use-toast';

// List of potentially inappropriate or offensive terms
const inappropriateTerms = [
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'bastard', 'whore', 'slut',
  'kill', 'suicide', 'nazi', 'porn', 'terrorist', 'torture', 'racist', 'nigger',
  'faggot', 'retard', 'damn', 'hell', 'pussy', 'cock', 'penis', 'vagina'
];

// Check message for inappropriate content
export const checkForInappropriateContent = (message: string): {
  isInappropriate: boolean;
  reason?: string;
} => {
  if (!message) return { isInappropriate: false };
  
  const lowerCaseMessage = message.toLowerCase();
  
  // Check for offensive language - using more robust word boundary detection
  for (const term of inappropriateTerms) {
    // Use improved regex pattern with word boundaries to match whole words
    // This avoids false positives like "assassin" matching "ass"
    const regex = new RegExp(`(^|\\s)${term}(\\s|$|[.,!?])`, 'i');
    if (regex.test(lowerCaseMessage)) {
      console.log(`Inappropriate term detected: ${term} in message: ${message}`);
      return {
        isInappropriate: true,
        reason: `Contains inappropriate language: "${term}"`
      };
    }
  }
  
  return { isInappropriate: false };
};

// Handle inappropriate message from user
export const handleInappropriateMessage = async (
  userId: string, 
  username: string,
  updateUser: (id: string, data: any) => Promise<any>
): Promise<string> => {
  console.log("Handling inappropriate message for user:", userId);
  try {
    // Issue warning to the user
    const result = await updateUser(userId, {
      status: 'warned',
      warningMessage: 'You have been warned for using inappropriate language. Continued violations may result in account suspension.'
    });
    
    console.log("Warning issued to user:", result);
    
    // Make sure the toast appears
    toast({
      title: "Warning Issued",
      description: "Your account has been flagged for inappropriate language",
      variant: "destructive"
    });
    
    return "I cannot respond to messages containing inappropriate language. Your account has been issued a warning.";
  } catch (error) {
    console.error('Error issuing warning:', error);
    toast({
      title: "Error",
      description: "Failed to issue warning to user",
      variant: "destructive"
    });
    return "I cannot respond to messages containing inappropriate language. Please refrain from using such terms.";
  }
};
