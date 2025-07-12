import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'wouter';
import { User, InsertUser } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Form schema for creating a new admin
const adminCreateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type AdminCreateFormValues = z.infer<typeof adminCreateSchema>;

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('users');
  
  // Redirect if not authenticated or not admin
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!user || user.userType !== 'admin') {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admins">Admin Management</TabsTrigger>
          <TabsTrigger value="designers">Designers</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UsersList />
        </TabsContent>
        
        <TabsContent value="admins" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CreateAdminForm />
          </div>
        </TabsContent>
        
        <TabsContent value="designers" className="space-y-4">
          <DesignersList />
        </TabsContent>
        
        <TabsContent value="posts" className="space-y-4">
          <PostsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersList() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    }
  });
  
  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>Manage all users in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of all users in the system</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${user.userType === 'admin' ? 'bg-red-100 text-red-800' : 
                      user.userType === 'designer' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {user.userType}
                  </span>
                </TableCell>
                <TableCell>{user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : (typeof user.createdAt === 'string' ? new Date(user.createdAt).toLocaleDateString() : 'N/A')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CreateAdminForm() {
  const form = useForm<AdminCreateFormValues>({
    resolver: zodResolver(adminCreateSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    }
  });
  
  const createAdminMutation = useMutation({
    mutationFn: async (userData: AdminCreateFormValues) => {
      const response = await apiRequest('POST', '/api/admin/create', userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Admin user created successfully",
        variant: "default",
      });
      form.reset();
      // Invalidate the users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: AdminCreateFormValues) => {
    createAdminMutation.mutate(data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Admin User</CardTitle>
        <CardDescription>Add a new admin user to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="mt-4"
              disabled={createAdminMutation.isPending}
            >
              {createAdminMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Admin User"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DesignersList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Designers</CardTitle>
        <CardDescription>Manage designer profiles</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Designer management coming soon...</p>
      </CardContent>
    </Card>
  );
}

function PostsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts</CardTitle>
        <CardDescription>Manage all posts</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Post management coming soon...</p>
      </CardContent>
    </Card>
  );
}
