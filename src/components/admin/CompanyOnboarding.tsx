
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { GraduationCap, Plus, Trash2, FileText, MoveUp, MoveDown } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { uploadImage } from '@/utils/fileUtils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  required: boolean;
}

export const CompanyOnboarding = () => {
  const { userCompany, updateCompanyInfo } = useCompany();
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  const [onboardingConfig, setOnboardingConfig] = useState({
    enabled: userCompany?.onboarding?.enabled || false,
    welcomeMessage: userCompany?.onboarding?.welcomeMessage || 'Welcome to our platform!',
    steps: userCompany?.onboarding?.steps || [] as OnboardingStep[],
    requiredForAllMembers: userCompany?.onboarding?.requiredForAllMembers || true,
  });
  
  const addStep = () => {
    const newStep: OnboardingStep = {
      id: `step-${Date.now()}`,
      title: 'New Step',
      description: 'Description for this step',
      required: true
    };
    
    setOnboardingConfig(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };
  
  const removeStep = (id: string) => {
    setOnboardingConfig(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== id)
    }));
  };
  
  const updateStep = (id: string, field: keyof OnboardingStep, value: any) => {
    setOnboardingConfig(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === id ? { ...step, [field]: value } : step
      )
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, stepId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userCompany?.id) return;
    
    setIsUploading(stepId);
    try {
      const file = files[0];
      const imageUrl = await uploadImage(file, `company-onboarding/${userCompany.id}/${stepId}`);
      
      if (imageUrl) {
        updateStep(stepId, 'imageUrl', imageUrl);
        toast({
          title: "Upload Success",
          description: "Image uploaded successfully",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(null);
    }
  };
  
  const handleSaveConfig = async () => {
    try {
      await updateCompanyInfo({
        onboarding: onboardingConfig
      });
      
      toast({
        title: "Onboarding Saved",
        description: "Your onboarding configuration has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving onboarding config:', error);
      toast({
        title: "Error",
        description: "Failed to save onboarding configuration. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(onboardingConfig.steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setOnboardingConfig(prev => ({
      ...prev,
      steps: items
    }));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Company Onboarding
        </CardTitle>
        <CardDescription>
          Create custom onboarding flows and training materials for your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="onboarding-enabled">Enable Custom Onboarding</Label>
            <Switch
              id="onboarding-enabled"
              checked={onboardingConfig.enabled}
              onCheckedChange={(checked) => 
                setOnboardingConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="required-all">Required for All Members</Label>
            <Switch
              id="required-all"
              checked={onboardingConfig.requiredForAllMembers}
              onCheckedChange={(checked) => 
                setOnboardingConfig(prev => ({ ...prev, requiredForAllMembers: checked }))
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              value={onboardingConfig.welcomeMessage}
              onChange={(e) => 
                setOnboardingConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))
              }
              placeholder="Welcome to our platform!"
              className="min-h-20"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Onboarding Steps</h3>
              <Button onClick={addStep} variant="outline" size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add Step
              </Button>
            </div>
            
            {onboardingConfig.steps.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-2 text-muted-foreground">
                  No onboarding steps added yet. Add a step to get started.
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="onboarding-steps">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {onboardingConfig.steps.map((step, index) => (
                        <Draggable key={step.id} draggableId={step.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="border rounded-md p-4 relative bg-card"
                            >
                              <div className="absolute right-2 top-2 flex gap-1">
                                <div {...provided.dragHandleProps} className="cursor-move p-1 hover:bg-secondary rounded">
                                  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" className="text-muted-foreground">
                                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                                  </svg>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeStep(step.id)}
                                  className="h-6 w-6 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-4 mt-6">
                                <div>
                                  <Label htmlFor={`step-${step.id}-title`}>Title</Label>
                                  <Input
                                    id={`step-${step.id}-title`}
                                    value={step.title}
                                    onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`step-${step.id}-description`}>Description</Label>
                                  <Textarea
                                    id={`step-${step.id}-description`}
                                    value={step.description}
                                    onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                                    className="mt-1 min-h-20"
                                  />
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`step-${step.id}-image`}>Image (Optional)</Label>
                                    <div className="mt-2">
                                      {step.imageUrl ? (
                                        <div className="mb-2">
                                          <img 
                                            src={step.imageUrl} 
                                            alt={step.title} 
                                            className="h-24 object-contain rounded border border-border/50 p-1"
                                          />
                                        </div>
                                      ) : null}
                                      
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={isUploading === step.id}
                                        onClick={() => document.getElementById(`image-upload-${step.id}`)?.click()}
                                      >
                                        {isUploading === step.id ? (
                                          <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                                        ) : null}
                                        {step.imageUrl ? 'Change Image' : 'Upload Image'}
                                        <input
                                          id={`image-upload-${step.id}`}
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleImageUpload(e, step.id)}
                                          disabled={isUploading === step.id}
                                        />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`step-${step.id}-video`}>Video URL (Optional)</Label>
                                    <Input
                                      id={`step-${step.id}-video`}
                                      value={step.videoUrl || ''}
                                      onChange={(e) => updateStep(step.id, 'videoUrl', e.target.value)}
                                      placeholder="https://youtube.com/..."
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`step-${step.id}-required`}>Required Step</Label>
                                  <Switch
                                    id={`step-${step.id}-required`}
                                    checked={step.required}
                                    onCheckedChange={(checked) => updateStep(step.id, 'required', checked)}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSaveConfig}>
          Save Onboarding Configuration
        </Button>
      </CardFooter>
    </Card>
  );
};
