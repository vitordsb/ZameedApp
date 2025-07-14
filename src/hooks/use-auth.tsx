
// src/hooks/use-auth.tsx
import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { parseJwt } from "@/lib/utils";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  name: string;
  email: string;
  cpf: string;
  cnpj?: string;
  cidade_id: number;
  type: "contratante" | "prestador";
  termos_aceitos: boolean;
}

type LoginData = { email: string; password: string };
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  cpf: string;
  cnpj?: string;
  cidade_id: number;
  type: "contratante" | "prestador";
  termos_aceitos: boolean;
};

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (data: LoginData) => Promise<void>;
  registerUser: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});
const registerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha muito curta"),
  cpf: z.string().min(11, "CPF inválido"),
  cnpj: z.string().min(14).optional(),
  cidade_id: z.number(),
  type: z.enum(["contratante", "prestador"]),
  termos_aceitos: z.literal(true, { errorMap: () => ({ message: "É preciso aceitar os termos" }) }),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const expiry = sessionStorage.getItem("tokenExpiry");
    if (token && expiry && Number(expiry) > Date.now()) {
      try {
        const payload = parseJwt<User>(token);
        setUser(payload.id ? payload : null);
      } catch {
        sessionStorage.clear();
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginData) => {
    loginSchema.parse(data);
    const res = await apiRequest("POST", "/auth/login", data);
    if (!res.ok) throw new Error("Credenciais inválidas");
    const body = (await res.json()) as { data: { token: string } };
    const token = body.data.token;
    const expiresAt = Date.now() + 1000 * 60 * 60;
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("tokenExpiry", expiresAt.toString());
    const payload = parseJwt<User>(token);
    setUser(payload);
    toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
  };

  const registerUser = async (data: RegisterPayload) => {
    registerSchema.parse(data);
    const res = await apiRequest("POST", "/users", data);
    const body = await res.json();
    console.log(body)
    if (!res.ok) {
      throw new Error(body.message || "Erro ao cadastrar usuário");
    }
    toast({ title: "Cadastro realizado", description: "Bem-vindo(a)!" });
  };

  const logout = async () => {
    await apiRequest("POST", "/auth/logout");
    sessionStorage.clear();
    setUser(null);
    toast({ title: "Até mais!", description: "Você saiu da sua conta." });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}

