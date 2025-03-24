
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const CompanyJoinPage = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user } = useAuth();
  const { joinViaInviteLink, userCompany } = useCompany();
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const validateInviteCode = async () => {
      if (!inviteCode) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the invite details
        const response = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/companyInviteLinks/${inviteCode}.json`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invite details');
        }
        
        const inviteData = await response.json();
        
        if (!inviteData) {
          throw new Error('Invalid invite code');
        }
        
        // Check if the invite is expired
        if (new Date(inviteData.expires) < new Date()) {
          throw new Error('This invite link has expired');
        }
        
        // Get the company data
        const companyResponse = await fetch(`https://orgid-f590b-default-rtdb.firebaseio.com/companies/${inviteData.companyId}.json`);
        if (!companyResponse.ok) {
          throw new Error('Failed to fetch company details');
        }
        
        const companyData = await companyResponse.json();
        if (companyData && companyData.name) {
          setCompanyName(companyData.name);
          setIsValid(true);
        } else {
          throw new Error('Company not found');
        }
      } catch (error) {
        console.error('Error validating invite code:', error);
        toast({
          title: "Invalid Invite",
          description: error instanceof Error ? error.message : "This invite link is invalid or has expired",
          variant: "destructive",
        });
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateInviteCode();
  }, [inviteCode]);

  const handleJoinCompany = async () => {
    if (!user || !inviteCode) return;
    
    setIsJoining(true);
    try {
      const success = await joinViaInviteLink(inviteCode);
      
      if (success) {
        toast({
          title: "Success!",
          description: `You've joined ${companyName}`,
        });
        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error joining company:', error);
      toast({
        title: "Error",
        description: "Failed to join company",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Validating invite...</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>This invite link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (userCompany) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Already in a Company</CardTitle>
            <CardDescription>
              You are already a member of a company. You need to leave your current company before joining another one.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/settings')} className="w-full">
              Go to Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-12 px-4">
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join {companyName}</CardTitle>
          <CardDescription>
            You've been invited to join {companyName}. Click the button below to accept this invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Joining a company will give you access to shared resources and settings.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleJoinCompany} 
            disabled={isJoining} 
            className="w-full"
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <span>Join Company</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
