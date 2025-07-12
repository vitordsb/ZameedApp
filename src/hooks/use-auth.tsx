
// src/hooks/use-auth.tsx
import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { parseJwt } from "@/lib/utils";

export interface OldAuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const loginSchema = z.object({
  email: z.string().min(1, "Necessário o email"),
  password: z.string().min(1, "Senha é necessária"),
});

const registerSchema = z.object({
    name: z.string().min(1, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    profession: z.string().min(1, "Profissão obrigatória"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
    cnpj: z.string().min(14, "CNPJ inválido"),
    cpf: z.string().min(11, "CPF inválido"),
    type: z.enum(["contratante", "prestador"]),
    termos_aceitos: z.boolean().refine((val) => val === true, {
      message: "É preciso aceitar os termos",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type RegisterPayload = Omit<RegisterData, "confirmPassword">;

export type AuthContextType = OldAuthContextType & {
  error: Error | null;
  loginMutation: UseMutationResult<void, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterPayload>;
  isGuest: boolean;
  loginAsGuest: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // 1) Restaura sessão ao montar
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const expiry = sessionStorage.getItem("tokenExpiry");
    console.log("🔄 restoring session, token:", token, "expiry:", expiry);

    if (token && expiry && Number(expiry) > Date.now()) {
      // decodifica direto no formato User
      const payload = parseJwt<User>(token);
      if (payload?.id) {
        console.log("✔ session válida, user:", payload);
        setUser(payload);
      } else {
        console.log("❌ token inválido, limpando sessão");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("tokenExpiry");
        setUser(null);
      }
    } else {
      console.log("⏳ nenhuma sessão válida encontrada");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("tokenExpiry");
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  // 2) Login
  const loginMutation = useMutation<void, Error, LoginData>({
    mutationFn: async (credentials) => {
      loginSchema.parse(credentials);
      console.log("🔐 calling /auth/login", credentials);
      const res = await apiRequest("POST", "/auth/login", credentials);
      const body = (await res.json()) as { data: { token: string } };
      const token = body.data.token;
      console.log("← login response:", body);

      // expira em 1h
      const expiresAt = Date.now() + 1000 * 60 * 60;
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("tokenExpiry", expiresAt.toString());
    },
    onSuccess: () => {
      const token = sessionStorage.getItem("token")!;
      const payload = parseJwt<User>(token);
      console.log("→ logged in user:", payload);
      setUser(payload);
      setIsGuest(false);
      toast({
        title: "Login realizado",
        description: "Seu acesso expira em 1 hora. Ou permaneça conectado para nunca expirar.",
      });
      queryClient.setQueryData(["/auth/login"], payload);
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login falhou",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 3) Registro
  const registerMutation = useMutation<User, Error, RegisterPayload>({
    mutationFn: async (userData) => {
      registerSchema.parse({ ...userData, confirmPassword: userData.password });
      const res = await apiRequest("POST", "/users", userData);
      const body = await res.json();
      console.log("← register response:", body);
      return body.user as User;
    },
    onSuccess: (newUser) => {
      console.log("✔ registered user:", newUser);
      setUser(newUser);
      setIsGuest(false);
      toast({
        title: "Cadastro realizado",
        description: "Bem-vindo(a)!",
      });
      queryClient.setQueryData(["/user"], newUser);
    },
    onError: (error) => {
      console.error("Register error:", error);
      toast({
        title: "Cadastro falhou",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout
  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/auth/logout");
    },
    onSuccess: () => {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("tokenExpiry");
      setUser(null);
      setIsGuest(false);
      toast({
        title: "Desconectado",
        description: "Até a próxima!",
      });
      queryClient.setQueryData(["/auth/login"], null);
    },
    onError: (error) => {
      console.error("Logout error:", error);
      toast({
        title: "Logout falhou",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginAsGuest = () => {
    setIsGuest(true);
    setUser(null);
  };

  const oldContext: OldAuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    logout: () => logoutMutation.mutateAsync(),
    refetchUser: () => queryClient.invalidateQueries(["/auth/login"]),
  };

  return (
    <AuthContext.Provider
      value={{
        ...oldContext,
        error: null,
        loginMutation,
        logoutMutation,
        registerMutation,
        isGuest,
        loginAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

