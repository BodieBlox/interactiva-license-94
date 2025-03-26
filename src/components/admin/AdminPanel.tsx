
import { Routes, Route } from 'react-router-dom';
import { CompanyManagement } from './CompanyManagement';
import { CompanyCreator } from './CompanyCreator';
import { CompanyChat } from './CompanyChat';
import { useParams } from 'react-router-dom';

// Create a wrapper component that gets parameters from URL
const CompanyChatWrapper = () => {
  const { companyId } = useParams();
  
  // We need to handle the case when companyId is undefined
  if (!companyId) {
    return <div className="p-4">Company ID is required</div>;
  }
  
  return <CompanyChat companyId={companyId} companyName="Company Chat" />;
};

export const AdminPanel = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route path="/" element={<CompanyManagement />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="company/new" element={<CompanyCreator />} />
        <Route path="company/chat/:companyId" element={<CompanyChatWrapper />} />
      </Routes>
    </div>
  );
};
