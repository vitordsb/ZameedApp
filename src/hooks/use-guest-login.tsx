import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

export function useGuestLogin() {
  const { toast } = useToast();

  const guestLoginMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/auth/guest-login");
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Não foi possível logar como visitante. Por favor, tente novamente.");
        }
        
        const data = await res.json();
        return data.user as User;
      } catch (error) {
        console.error("Guest login fetch error:", error);
        throw error;
      }
    },
    onSuccess: (user) => {
      // Update the user data in the cache
      queryClient.setQueryData(["/api/auth/me"], user);
      
      toast({
        title: "Bem vindo, visitante!",
        description: "Você está logado como visitante.",
      });
    },
    onError: (error: any) => {
      console.error("Guest login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Poxa, houve um erro ao logar como visitante. Por favor, tente novamente.",
        variant: "destructive",
      });
    },
  });

  return guestLoginMutation;
}
