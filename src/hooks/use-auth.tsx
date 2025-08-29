import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { parseJwt } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { User, RegisterInterface, AuthContextType, LoginInterface } from "@/lib/Interfaces";
import { loginSchema, registerSchema } from "@/lib/Schemas";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const expiry = sessionStorage.getItem("tokenExpiry");
    if (token && expiry && Number(expiry) > Date.now()) {
      try {
        const payload = parseJwt<User>(token);
        setUser(payload?.id ? payload : null);
      } catch {
        sessionStorage.clear();
        setUser(null);
      }
    }
    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  const login = async (data: LoginInterface) => {
    loginSchema.parse(data);
    const res = await apiRequest("POST", "/auth/login", data);
    if (!res.ok) throw new Error("Credenciais inválidas");
    const body = (await res.json()) as { data: { token: string } };
    const token = body.data.token;
    const expiresAt = Date.now() + 10000 * 60 * 60; // 10h
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("tokenExpiry", expiresAt.toString());
    const payload = parseJwt<User>(token);
    setUser(payload);
    toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
  };

  const register = async (data: RegisterInterface) => {
    if (data.password.length < 6) {
      throw new Error("Senha muito curta, por favor preencha 6 digitos")
    }
    else if (data.termos_aceitos === false) {
      throw new Error("É preciso aceitar os termos para se cadastrar")
    }
    registerSchema.parse(data);
    let userRegistrationPayload: any = { ...data };
    delete userRegistrationPayload.profession;
    delete userRegistrationPayload.about;

    const userRes = await apiRequest("POST", "/users", userRegistrationPayload);
    const userBody = await userRes.json();

    if (!userRes.ok) {
      throw new Error(userBody.message || "Erro ao cadastrar usuário");
    }
    const successMessage = data.type === "prestador"
      ? "Cadastro de prestador realizado com sucesso!"
      : "Cadastro realizado com sucesso!";

    toast({
      title: "Cadastro realizado",
      description: successMessage
    });
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
        register,
        logout,
        isInitialized,
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

