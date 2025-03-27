
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { CompanyPermissionsManager } from './CompanyPermissionsManager';
import { CompanyRebranding } from './CompanyRebranding';
import { CompanyOnboarding } from './CompanyOnboarding';
import { LocalizationSettings } from './LocalizationSettings';
import { NotificationCenter } from '../notifications/NotificationCenter';

// Sample data for charts
const usageData = [
  { name: 'Jan', active: 65, inactive: 35 },
  { name: 'Feb', active: 59, inactive: 41 },
  { name: 'Mar', active: 80, inactive: 20 },
  { name: 'Apr', active: 81, inactive: 19 },
  { name: 'May', active: 56, inactive: 44 },
  { name: 'Jun', active: 55, inactive: 45 },
  { name: 'Jul', active: 40, inactive: 60 },
];

const licenseTypeData = [
  { name: 'Basic', value: 20 },
  { name: 'Premium', value: 35 },
  { name: 'Enterprise', value: 45 },
];

const licenseExpiryData = [
  { name: 'This Month', value: 5 },
  { name: '1-3 Months', value: 15 },
  { name: '3-6 Months', value: 25 },
  { name: '6-12 Months', value: 30 },
  { name: '>12 Months', value: 25 },
];

const LicenseUsageAnalytics = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">License & Company Management</h1>
        <NotificationCenter />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="rebranding">Rebranding</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="space-y-6 pt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>License Usage</CardTitle>
                <CardDescription>Active vs Inactive Licenses</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart 
                  data={usageData} 
                  dataKey="active"
                  nameKey="name"
                  height={250}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>License Types</CardTitle>
                <CardDescription>Distribution by license tier</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={licenseTypeData} 
                  dataKey="value"
                  nameKey="name"
                  height={250}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>License Expiration</CardTitle>
                <CardDescription>Time until license expiry</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={licenseExpiryData} 
                  dataKey="value"
                  nameKey="name"
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly License Activity</CardTitle>
              <CardDescription>Activations, deactivations, and renewals</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart 
                data={usageData} 
                dataKey={['active', 'inactive']}
                nameKey="name"
                height={350}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="pt-4">
          <CompanyPermissionsManager />
        </TabsContent>
        
        <TabsContent value="rebranding" className="pt-4">
          <CompanyRebranding />
        </TabsContent>
        
        <TabsContent value="onboarding" className="pt-4">
          <CompanyOnboarding />
        </TabsContent>
        
        <TabsContent value="localization" className="pt-4">
          <LocalizationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LicenseUsageAnalytics;
