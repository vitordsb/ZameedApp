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

type LoginForm = { email: string; password: string };
type RegisterForm = {
  name: string;
  email: string;
  cpf: string;
  cnpj?: string;
  type: "contratante" | "prestador";
  profession?: string;
  password: string;
  confirmPassword: string;
  termos_aceitos: boolean;
};

export const AuthModals: React.FC<{
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onAuthSuccess?: () => void;
}> = ({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onAuthSuccess,
}) => {
  const { toast } = useToast();
  const { login, registerUser } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const loginForm = useForm<LoginForm>({ defaultValues: { email: "", password: "" } });
  const registerForm = useForm<RegisterForm>({
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      cnpj: "",
      type: "contratante",
      password: "",
      confirmPassword: "",
      termos_aceitos: false,
    },
  });

  const selectedType = registerForm.watch("type");
  const fieldClasses = "w-full";

  async function handleLogin(data: LoginForm) {
    setLoginLoading(true);
    try {
      await login(data);
      loginForm.reset();
      onLoginClose();
      onAuthSuccess?.();
    } catch (err) {
      toast({
        title: "Erro no login",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(d: RegisterForm) {
    if (d.password !== d.confirmPassword) {
      toast({ title: "Erro", description: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    if (d.type === "prestador" && !d.profession?.trim()) {
      toast({ title: "Erro", description: "Informe sua profissão", variant: "destructive" });
      return;
    }

    setRegisterLoading(true);
    try {
      await registerUser({
        name: d.name,
        email: d.email,
        password: d.password,
        cpf: d.cpf,
        cnpj: d.cnpj,
        cidade_id: 1,     // workaround por enquanto
        type: d.type,
        termos_aceitos: d.termos_aceitos,
      });
      registerForm.reset();
      onRegisterClose();
      onAuthSuccess?.();
    } catch (err) {
      toast({
        title: "Erro no cadastro",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  }
  return (
    <>
      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={onLoginClose}>
        <DialogContent className="max-w-md p-8">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>Entre com seu e-mail e senha.</DialogDescription>
          </DialogHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className={fieldClasses} />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} className={fieldClasses} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={loginLoading} className="w-full">
                  {loginLoading && <Loader2 className="animate-spin mr-2" />}
                  Entrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={onRegisterClose}>
        <DialogContent className="max-w-lg p-8">
          <DialogHeader>
            <DialogTitle>Cadastro</DialogTitle>
            <DialogDescription>Preencha para criar sua conta.</DialogDescription>
          </DialogHeader>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              {/* Nome / E-mail */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input {...field} className={fieldClasses} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl><Input type="email" {...field} className={fieldClasses} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* CPF / CNPJ */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl><Input {...field} className={fieldClasses} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ (opcional)</FormLabel>
                      <FormControl><Input {...field} className={fieldClasses} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Tipo / Profissão */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conta</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full border p-2 rounded">
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
                        <FormLabel>Profissão</FormLabel>
                        <FormControl><Input {...field} className={fieldClasses} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {/* Senha / Confirmar */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl><Input type="password" {...field} className={fieldClasses} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl><Input type="password" {...field} className={fieldClasses} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Termos */}
              <FormField
                control={registerForm.control}
                name="termos_aceitos"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <span>Li e aceito os termos de uso.</span>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={registerLoading} className="w-full bg-amber-600">
                  {registerLoading && <Loader2 className="animate-spin mr-2" />}
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

