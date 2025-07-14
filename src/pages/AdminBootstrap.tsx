import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminBootstrap() {
  const { toast } = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [confirmPassword, setConfirmPassword] = useState("password123");
  const [name, setName] = useState("Administrator");
  const [email, setEmail] = useState("admin@example.com");

  const bootstrapMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/bootstrap", data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Admin user created",
        description: "The first admin user has been created successfully",
      });
      console.log("Bootstrap response:", data);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }
    
    bootstrapMutation.mutate({
      username,
      password,
      confirmPassword,
      name,
      email,
      userType: "admin", // This will be enforced by the API anyway
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Admin Bootstrap</h1>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create First Admin User</CardTitle>
            <CardDescription>
              This will create the first administrator account in the system.
              You can only use this once, after which you'll need to login as an admin
              to create more admin accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={bootstrapMutation.isPending}
              >
                {bootstrapMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Creating Admin...
                  </>
                ) : (
                  "Create Admin"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <p className="text-sm text-muted-foreground">
              After creating the admin user, you'll be able to login with the credentials
              you provided on the login page.
            </p>
            {bootstrapMutation.isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 text-sm">
                <p className="font-semibold">Admin Created Successfully!</p>
                <p>You can now go to the login page and use these credentials to login.</p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
