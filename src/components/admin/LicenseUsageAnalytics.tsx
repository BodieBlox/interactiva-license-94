import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanies } from '@/utils/companyApi';
import { getUsers } from '@/utils/api';
import { getAllLicenses } from '@/utils/api';
import { BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/utils/companyTypes';
import { License, User } from '@/utils/types';
import { Activity, Users, Building, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface CompanyWithUsage extends Company {
  activeUsers: number;
  licenseType: string;
  usagePercentage: number;
}

const LicenseUsageAnalytics = () => {
  const [companies, setCompanies] = useState<CompanyWithUsage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [totalLicenses, setTotalLicenses] = useState(0);
  const [usageByType, setUsageByType] = useState<{type: string, count: number, color: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [fetchedCompanies, fetchedUsers, fetchedLicenses] = await Promise.all([
          getCompanies(),
          getUsers(),
          getAllLicenses()
        ]);
        
        const companiesWithUsage = fetchedCompanies.map(company => {
          const companyUsers = fetchedUsers.filter(user => user.companyId === company.id);
          const activeUsers = companyUsers.filter(user => user.status === 'active').length;
          const companyLicense = fetchedLicenses.find(license => license.companyId === company.id);
          const licenseType = companyLicense?.type || 'none';
          const maxUsers = companyLicense?.maxUsers || Infinity;
          const usagePercentage = maxUsers === Infinity ? 0 : (activeUsers / maxUsers) * 100;
          
          return {
            ...company,
            activeUsers,
            licenseType,
            usagePercentage
          };
        });
        
        companiesWithUsage.sort((a, b) => b.usagePercentage - a.usagePercentage);
        
        setCompanies(companiesWithUsage);
        setUsers(fetchedUsers);
        setLicenses(fetchedLicenses);
        
        const activeUserCount = fetchedUsers.filter(user => user.status === 'active').length;
        setTotalActiveUsers(activeUserCount);
        setTotalLicenses(fetchedLicenses.length);
        
        const usageByLicenseType = [
          { type: 'Basic', count: 0, color: '#3b82f6' },
          { type: 'Premium', count: 0, color: '#8b5cf6' },
          { type: 'Enterprise', count: 0, color: '#f59e0b' }
        ];
        
        fetchedLicenses.forEach(license => {
          if (license.type === 'basic') usageByLicenseType[0].count++;
          if (license.type === 'premium') usageByLicenseType[1].count++;
          if (license.type === 'enterprise') usageByLicenseType[2].count++;
        });
        
        setUsageByType(usageByLicenseType);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching license analytics data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const prepareLicenseUsageData = () => {
    const barData = {
      labels: companies.slice(0, 10).map(c => c.name),
      datasets: [
        {
          label: 'Active Users',
          data: companies.slice(0, 10).map(c => c.activeUsers),
          backgroundColor: '#3b82f6',
        },
      ],
    };
    
    return barData;
  };
  
  const prepareLicenseTypeData = () => {
    const pieData = {
      labels: usageByType.map(u => u.type),
      datasets: [
        {
          label: 'License Distribution',
          data: usageByType.map(u => u.count),
          backgroundColor: usageByType.map(u => u.color),
        },
      ],
    };
    
    return pieData;
  };
  
  const prepareUsageTrendData = () => {
    let days: Date[] = [];
    const now = new Date();
    
    if (timeRange === '30days') {
      days = Array(30).fill(null).map((_, i) => subDays(now, 29 - i));
    } else if (timeRange === '90days') {
      days = Array(90).fill(null).map((_, i) => subDays(now, 89 - i));
    } else if (timeRange === 'thisMonth') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const daysInMonth = end.getDate();
      days = Array(daysInMonth).fill(null).map((_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1));
    }
    
    const userData = days.map((_, i) => Math.floor(totalActiveUsers * (0.7 + (i/days.length) * 0.3)));
    
    const lineData = {
      labels: days.map(d => format(d, 'MMM dd')),
      datasets: [
        {
          label: 'Active Users',
          data: userData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        }
      ],
    };
    
    return lineData;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <div className="text-2xl font-bold">{totalActiveUsers}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building className="h-5 w-5 text-primary mr-2" />
              <div className="text-2xl font-bold">{companies.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-primary mr-2" />
              <div className="text-2xl font-bold">{licenses.filter(l => l.isActive).length} / {totalLicenses}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="usage">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="usage" className="flex items-center gap-1">
              <BarChartIcon className="h-4 w-4" />
              <span>Usage by Company</span>
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span>License Types</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-1">
              <LineChartIcon className="h-4 w-4" />
              <span>Usage Trends</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden data-[state=active]:block" data-state={timeRange === 'trends' ? 'active' : 'inactive'}>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Usage by Company</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <BarChart data={prepareLicenseUsageData()} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Company License Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Company</th>
                      <th className="text-left py-3 px-4">License Type</th>
                      <th className="text-left py-3 px-4">Active Users</th>
                      <th className="text-left py-3 px-4">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company, index) => (
                      <tr key={company.id} className="border-b">
                        <td className="py-3 px-4">{company.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={
                            company.licenseType === 'premium' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            company.licenseType === 'enterprise' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            company.licenseType === 'basic' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }>
                            {company.licenseType === 'none' ? 'No License' : company.licenseType.charAt(0).toUpperCase() + company.licenseType.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{company.activeUsers}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  company.usagePercentage >= 90 ? 'bg-red-500' :
                                  company.usagePercentage >= 70 ? 'bg-amber-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(company.usagePercentage, 100)}%` }}
                              ></div>
                            </div>
                            <span>{company.usagePercentage.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>License Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex justify-center">
                <PieChart data={prepareLicenseTypeData()} />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                {usageByType.map((type) => (
                  <Card key={type.type}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{type.count}</div>
                        <div className="text-xs text-muted-foreground mt-1">{type.type} Licenses</div>
                        <div 
                          className="w-4 h-4 rounded-full mx-auto mt-2"
                          style={{ backgroundColor: type.color }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <LineChart data={prepareUsageTrendData()} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LicenseUsageAnalytics;
