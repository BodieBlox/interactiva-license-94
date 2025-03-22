
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Company, UserWithCompany, CompanyInvitation } from '../utils/companyTypes';
import { 
  getCompanies, 
  getCompanyById, 
  createCompany, 
  updateCompany,
  getCompanyMembers,
  getCompanyInvitationsByUser 
} from '../utils/companyApi';
import { toast } from '@/components/ui/use-toast';

interface CompanyContextType {
  userCompany: Company | null;
  companyMembers: UserWithCompany[];
  pendingInvitations: CompanyInvitation[];
  isLoadingCompany: boolean;
  createNewCompany: (companyData: Partial<Company>) => Promise<Company | null>;
  updateCompanyInfo: (companyData: Partial<Company>) => Promise<Company | null>;
  refreshCompanyData: () => Promise<void>;
  error: Error | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [companyMembers, setCompanyMembers] = useState<UserWithCompany[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<CompanyInvitation[]>([]);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the user's company information
  useEffect(() => {
    if (!user) {
      setUserCompany(null);
      setCompanyMembers([]);
      setPendingInvitations([]);
      setIsLoadingCompany(false);
      return;
    }

    const fetchCompanyData = async () => {
      setIsLoadingCompany(true);
      setError(null);
      try {
        // Check if user is part of a company
        const companyId = user.customization?.companyName; // This will be changed to a proper ID in the real implementation
        
        if (companyId) {
          const company = await getCompanyById(companyId);
          setUserCompany(company);
          
          if (company) {
            const members = await getCompanyMembers(company.id);
            setCompanyMembers(members);
          }
        }
        
        // Fetch pending invitations
        const invitations = await getCompanyInvitationsByUser(user.id);
        setPendingInvitations(invitations);
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load company data'));
        toast({
          title: "Error",
          description: "Failed to load company data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyData();
  }, [user]);

  const createNewCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;
    
    try {
      const newCompany = await createCompany(companyData, user.id);
      setUserCompany(newCompany);
      return newCompany;
    } catch (err) {
      console.error('Error creating company:', err);
      setError(err instanceof Error ? err : new Error('Failed to create company'));
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCompanyInfo = async (companyData: Partial<Company>): Promise<Company | null> => {
    if (!userCompany) return null;
    
    try {
      const updatedCompany = await updateCompany(userCompany.id, companyData);
      setUserCompany(updatedCompany);
      return updatedCompany;
    } catch (err) {
      console.error('Error updating company:', err);
      setError(err instanceof Error ? err : new Error('Failed to update company'));
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive"
      });
      return null;
    }
  };

  const refreshCompanyData = async (): Promise<void> => {
    if (!user) return;
    
    setIsLoadingCompany(true);
    setError(null);
    try {
      // Fetch all data again
      const companyId = user.customization?.companyName;
      
      if (companyId) {
        const company = await getCompanyById(companyId);
        setUserCompany(company);
        
        if (company) {
          const members = await getCompanyMembers(company.id);
          setCompanyMembers(members);
        }
      }
      
      const invitations = await getCompanyInvitationsByUser(user.id);
      setPendingInvitations(invitations);
    } catch (err) {
      console.error('Error refreshing company data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh company data'));
    } finally {
      setIsLoadingCompany(false);
    }
  };

  return (
    <CompanyContext.Provider value={{
      userCompany,
      companyMembers,
      pendingInvitations,
      isLoadingCompany,
      createNewCompany,
      updateCompanyInfo,
      refreshCompanyData,
      error
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
