
import { Routes, Route } from 'react-router-dom';
import { CompanyManagement } from './CompanyManagement';
import { CompanyCreator } from './CompanyCreator';
import { CompanyChat } from './CompanyChat';

export const AdminPanel = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Routes>
        <Route path="companies/*" element={<CompanyManagement />} />
        <Route path="company/new" element={<CompanyCreator />} />
        <Route path="company/chat/:companyId" element={<CompanyChat />} />
      </Routes>
    </div>
  );
};
