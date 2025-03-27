import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Building, Users, Shield, Settings } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { UserWithCompany } from '@/utils/companyTypes';
import { permissionPresets, MemberPermissions, PermissionLevel } from '@/utils/companyPermissions';

export const CompanyPermissionsManager = () => {
  const { userCompany, companyMembers, updateCompanyInfo } = useCompany();
  const [customPermissions, setCustomPermissions] = useState<Record<string, MemberPermissions>>({});
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [limits, setLimits] = useState({
    maxMembers: userCompany?.limits?.maxMembers || 10,
    maxProjects: userCompany?.limits?.maxProjects || 5,
    maxStorage: userCompany?.limits?.maxStorage || 1024
  });

  useEffect(() => {
    // Initialize permissions from company settings if available
    if (userCompany?.permissions) {
      setCustomPermissions(userCompany.permissions);
    }
    
    if (userCompany?.limits) {
      setLimits({
        maxMembers: userCompany.limits.maxMembers || 10,
        maxProjects: userCompany.limits.maxProjects || 5,
        maxStorage: userCompany.limits.maxStorage || 1024
      });
    }
  }, [userCompany]);

  const handlePermissionChange = (memberId: string, permission: keyof MemberPermissions, value: boolean | number) => {
    setCustomPermissions(prev => {
      // Create a deep copy of the previous state
      const newPermissions = { ...prev };
      
      // If this member doesn't exist yet, initialize with default permissions
      if (!newPermissions[memberId]) {
        newPermissions[memberId] = { ...permissionPresets.member };
      }
      
      // Create a new object for this member's permissions to avoid mutation
      newPermissions[memberId] = {
        ...newPermissions[memberId],
        [permission]: value
      };
      
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    try {
      await updateCompanyInfo({
        permissions: customPermissions,
        limits
      });
      toast({
        title: "Permissions Updated",
        description: "Company permissions and limits have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const findMemberById = (memberId: string): UserWithCompany | undefined => {
    return companyMembers.find(member => member.id === memberId);
  };

  const applyPreset = (memberId: string, preset: PermissionLevel) => {
    setCustomPermissions(prev => {
      const newPermissions = { ...prev };
      newPermissions[memberId] = { ...permissionPresets[preset] };
      return newPermissions;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Company Permissions & Limits
        </CardTitle>
        <CardDescription>
          Configure permissions and limits for your company members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Member Permissions
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Company Limits
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1 border rounded-md p-4">
                <h3 className="font-medium mb-3">Company Members</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {companyMembers.map(member => (
                    <div 
                      key={member.id}
                      className={`p-2 rounded-md flex items-center justify-between cursor-pointer ${
                        selectedMember === member.id ? 'bg-primary/10' : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => setSelectedMember(member.id)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="ml-2">
                          <p className="font-medium">{member.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.isCompanyAdmin ? 'Admin' : 'Member'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 border rounded-md p-4">
                {selectedMember ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">
                        Permissions for {findMemberById(selectedMember)?.username}
                      </h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => applyPreset(selectedMember, 'member')}
                        >
                          Member Preset
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => applyPreset(selectedMember, 'admin')}
                        >
                          Admin Preset
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(permissionPresets.admin).map(([key, defaultValue]) => {
                        if (typeof defaultValue === 'boolean') {
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <Label htmlFor={`${selectedMember}-${key}`}>
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Label>
                              <Switch
                                id={`${selectedMember}-${key}`}
                                checked={customPermissions[selectedMember]?.[key as keyof MemberPermissions] as boolean || false}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(selectedMember, key as keyof MemberPermissions, checked)
                                }
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Resource Limits</h4>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`${selectedMember}-maxProjects`}>Max Projects</Label>
                              <Input
                                id={`${selectedMember}-maxProjects`}
                                type="number"
                                value={customPermissions[selectedMember]?.maxProjects || 0}
                                onChange={(e) => 
                                  handlePermissionChange(selectedMember, 'maxProjects', parseInt(e.target.value) || 0)
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`${selectedMember}-maxStorage`}>Storage Limit (MB)</Label>
                              <Input
                                id={`${selectedMember}-maxStorage`}
                                type="number"
                                value={customPermissions[selectedMember]?.maxStorage || 0}
                                onChange={(e) => 
                                  handlePermissionChange(selectedMember, 'maxStorage', parseInt(e.target.value) || 0)
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <Users className="h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-muted-foreground">
                      Select a member to configure their permissions
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="limits">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-4">Company-wide Resource Limits</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxMembers">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={limits.maxMembers}
                    onChange={(e) => setLimits(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total number of members allowed in your company
                  </p>
                </div>
                <div>
                  <Label htmlFor="maxProjects">Maximum Projects</Label>
                  <Input
                    id="maxProjects"
                    type="number"
                    value={limits.maxProjects}
                    onChange={(e) => setLimits(prev => ({ ...prev, maxProjects: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total number of projects allowed for your company
                  </p>
                </div>
                <div>
                  <Label htmlFor="maxStorage">Storage Limit (MB)</Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={limits.maxStorage}
                    onChange={(e) => setLimits(prev => ({ ...prev, maxStorage: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Total storage space available for your company (in MB)
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSavePermissions}>
                  Save Company Limits
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompanyPermissionsManager;
