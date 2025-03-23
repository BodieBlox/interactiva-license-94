
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
  const lowerCaseMessage = message.toLowerCase();
  
  // Check for offensive language
  for (const term of inappropriateTerms) {
    if (lowerCaseMessage.includes(term)) {
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
  try {
    // Issue warning to the user
    await updateUser(userId, {
      status: 'warned',
      warningMessage: 'You have been warned for using inappropriate language.'
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
