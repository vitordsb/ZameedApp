
// src/components/AuthModals.tsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Tipos do formulário
type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = {
  name: string;
  email: string;
  cpf: string;
  cnpj?: string; // campo CNPJ opcional
  type: "contratante" | "prestador";
  profession?: string;
  password: string;
  confirmPassword: string;
  termos_aceitos: boolean;
};

interface AuthModalsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onAuthSuccess?: () => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onAuthSuccess,
}) => {
  const { toast } = useToast();
  const { loginMutation, registerMutation } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const loginForm = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterForm>({
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      cnpj: "",
      type: "contratante",
      profession: "",
      password: "",
      confirmPassword: "",
      termos_aceitos: false,
    },
  });

  const selectedType = registerForm.watch("type");
  const fieldClasses = "w-full";

  const handleLogin = async (data: LoginForm) => {
    setLoginLoading(true);
    try {
      await loginMutation.mutateAsync(data);
      loginForm.reset();
      onLoginClose();
      onAuthSuccess?.();
    } catch (err) {
      toast({
        title: "Erro no login",
        description:
          (err as Error).message || "Não foi possível logar.",
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "Senhas não coincidem",
        variant: "destructive",
      });
      return;
    }
    if (selectedType === "prestador" && !data.profession?.trim()) {
      toast({
        title: "Erro no cadastro",
        description: "Informe sua profissão",
        variant: "destructive",
      });
      return;
    }
    setRegisterLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      await registerMutation.mutateAsync(payload as any);
      registerForm.reset();
      onRegisterClose();
      onAuthSuccess?.();
    } catch (err) {
      toast({
        title: "Erro no cadastro",
        description:
          (err as Error).message || "Não foi possível cadastrar.",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={onLoginClose}>
        <DialogContent className="max-w-md w-full p-8 bg-white rounded-lg shadow-xl">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-2xl font-bold">Login</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Entre com seu e-mail e senha para acessar.
            </DialogDescription>
          </DialogHeader>
          <Form {...loginForm}>
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-6"
            >
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className={fieldClasses}
                        placeholder="email@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        className={fieldClasses}
                        placeholder="••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg"
                >
                  {loginLoading && (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  )}
                  Entrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={onRegisterClose}>
        <DialogContent className="max-w-lg w-full p-8 bg-white rounded-lg shadow-xl">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-2xl font-bold">Cadastro</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Preencha os campos abaixo para criar sua conta.
            </DialogDescription>
          </DialogHeader>
          <Form {...registerForm}>
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-6"
            >
              {/* Nome e E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Nome Completo
                      </FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClasses}
                          placeholder="Seu nome"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          className={fieldClasses}
                          placeholder="email@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* CPF e CNPJ (opcional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">CPF</FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClasses}
                          placeholder="12345678900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        CNPJ (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className={fieldClasses}
                          placeholder="00.000.000/0000-00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Tipo e Profissão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Tipo de Conta
                      </FormLabel>
                      <FormControl>
                        <select
                          className="w-full border rounded-lg p-2"
                          {...field}
                        >
                          <option value="contratante">Contratante</option>
                          <option value="prestador">Prestador</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedType === "prestador" && (
                  <FormField
                    control={registerForm.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">
                          Profissão
                        </FormLabel>
                        <FormControl>
                          <Input
                            className={fieldClasses}
                            placeholder="Sua profissão"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {/* Senha e Confirmação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className={fieldClasses}
                          placeholder="••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">
                        Confirmar Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          className={fieldClasses}
                          placeholder="••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Termos de Uso */}
              <FormField
                control={registerForm.control}
                name="termos_aceitos"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    Li e aceito os termos de uso.
                    <FormLabel className="text-sm">
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg"
                >
                  {registerLoading && (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  )}
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

