
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Company, UserWithCompany, CompanyInvitation } from '../utils/companyTypes';
import { 
  getCompanies, 
  getCompanyById, 
  createCompany, 
  updateCompany,
  getCompanyMembers,
  removeCompanyMember,
  getCompanyInvitationsByUser,
  updateCompanyLogo
} from '../utils/companyApi';
import { toast } from '@/components/ui/use-toast';

interface CompanyContextType {
  userCompany: Company | null;
  companyMembers: UserWithCompany[];
  pendingInvitations: CompanyInvitation[];
  isLoadingCompany: boolean;
  createNewCompany: (companyData: Partial<Company>) => Promise<Company | null>;
  updateCompanyInfo: (companyData: Partial<Company>) => Promise<Company | null>;
  updateCompanyLogo: (companyId: string, logoUrl: string) => Promise<Company | null>;
  refreshCompanyData: () => Promise<void>;
  removeMember: (memberId: string) => Promise<boolean>;
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

  const fetchCompanyData = useCallback(async () => {
    if (!user) {
      setUserCompany(null);
      setCompanyMembers([]);
      setPendingInvitations([]);
      setIsLoadingCompany(false);
      return;
    }

    setIsLoadingCompany(true);
    setError(null);
    try {
      // Check if user is part of a company
      const companyId = user.customization?.companyId || user.customization?.companyName; // Support both companyId and legacy companyName
      
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [fetchCompanyData, user]);

  const createNewCompany = async (companyData: Partial<Company>): Promise<Company | null> => {
    if (!user) return null;
    
    try {
      const newCompany = await createCompany(companyData, user.id);
      await fetchCompanyData(); // Refresh data after creating
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
      await fetchCompanyData(); // Refresh data after updating
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

  const updateCompanyLogoFn = async (companyId: string, logoUrl: string): Promise<Company | null> => {
    try {
      const updatedCompany = await updateCompanyLogo(companyId, logoUrl);
      await fetchCompanyData(); // Refresh data after updating logo
      return updatedCompany;
    } catch (err) {
      console.error('Error updating company logo:', err);
      setError(err instanceof Error ? err : new Error('Failed to update company logo'));
      toast({
        title: "Error",
        description: "Failed to update company logo",
        variant: "destructive"
      });
      return null;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    if (!userCompany) return false;
    
    try {
      await removeCompanyMember(userCompany.id, memberId);
      await fetchCompanyData(); // Refresh data after removing member
      toast({
        title: "Member Removed",
        description: "The member has been removed from the company."
      });
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove member'));
      toast({
        title: "Error",
        description: "Failed to remove member from company",
        variant: "destructive"
      });
      return false;
    }
  };

  const refreshCompanyData = async (): Promise<void> => {
    await fetchCompanyData();
  };

  return (
    <CompanyContext.Provider value={{
      userCompany,
      companyMembers,
      pendingInvitations,
      isLoadingCompany,
      createNewCompany,
      updateCompanyInfo,
      updateCompanyLogo: updateCompanyLogoFn,
      refreshCompanyData,
      removeMember,
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
