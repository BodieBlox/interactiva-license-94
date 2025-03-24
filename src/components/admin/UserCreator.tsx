
import { useState } from 'react';
import { createUser } from '@/utils/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Mail, User, Lock, Shield, Loader2, UserCheck } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["user", "admin", "staff"])
});

type FormValues = z.infer<typeof formSchema>;

export const UserCreator = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      role: 'user'
    }
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      const userId = uuidv4();
      
      await createUser({
        id: userId,
        email: values.email,
        password: values.password,
        username: values.username,
        role: values.role,
        status: 'active',
        licenseActive: false
      });
      
      setIsSuccess(true);
      toast({
        title: "User Created",
        description: `${values.username} has been successfully created as a ${values.role}`,
        variant: "success"
      });
      
      // Reset form
      form.reset();
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: `Failed to create user: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <Card className="glass-panel border-0 animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create New User
          </CardTitle>
          <CardDescription>
            Add a new user to the system with specified role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter username"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter email address"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter password"
                        className="transition-all duration-300 focus:ring-2 focus:ring-primary/30"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Must be at least 6 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      User Role
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="user" id="role-user" />
                          <Label htmlFor="role-user" className="cursor-pointer">User</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="staff" id="role-staff" />
                          <Label htmlFor="role-staff" className="flex items-center cursor-pointer">
                            <span className="mr-1">Staff</span>
                            <span className="text-xs text-muted-foreground">(Limited admin access)</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="role-admin" />
                          <Label htmlFor="role-admin" className="cursor-pointer">Admin</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${isSuccess ? 'bg-green-500 hover:bg-green-600' : ''} transition-colors`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : isSuccess ? (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    User Created!
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
