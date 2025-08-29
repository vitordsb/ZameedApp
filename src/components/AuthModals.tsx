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
import { RegisterInterface, LoginInterface } from "@/lib/Interfaces";

export const AuthModals: React.FC<{
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
}> = ({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onSuccess,
}) => {
    const { toast } = useToast();
    const { login, registerUser } = useAuth();
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);

    const loginForm = useForm<LoginInterface>({ defaultValues: { email: "", password: "" } });
    const registerForm = useForm<RegisterInterface>({
      defaultValues: {
        name: "",
        email: "",
        gender: "",
        birth: "",
        type: "contratante",
        password: "",
        confirmPassword: "",
        termos_aceitos: false,
      },
    });

    const selectedType = registerForm.watch("type");
    const fieldClasses = "w-full";
    const [isPrestador, setIsPrestador] = useState(false);
    const handlePrestadorChange = (checked: boolean) => {
      setIsPrestador(checked);
      registerForm.setValue("type", checked ? "prestador" : "contratante");
    };
    async function handleLogin(data: LoginInterface) {
      setLoginLoading(true);
      try {
        await login(data);
        loginForm.reset();
        onLoginClose();
        onSuccess?.();
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

    async function handleRegister(d: RegisterInterface) {
      if (d.password !== d.confirmPassword) {
        toast({ title: "Erro", description: "Senhas não coincidem", variant: "destructive" });
        return;
      }

      setRegisterLoading(true);
      try {
        // Enviando os dados informados pelo usuário no cadastro
        const registerData: any = {
          name: d.name,
          email: d.email,
          password: d.password,
          gender: d.gender,
          birth: d.birth,
          type: isPrestador ? "prestador" : "contratante",
          termos_aceitos: d.termos_aceitos,
        };

        await registerUser(registerData);
        registerForm.reset();
        setIsPrestador(false);
        onRegisterClose();
        onSuccess?.();
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

        <Dialog open={isRegisterOpen} onOpenChange={onRegisterClose}>
          <DialogContent className="max-w-lg p-8">
            <DialogHeader>
              <DialogTitle>Cadastro</DialogTitle>
              <DialogDescription>Preencha para criar sua conta.</DialogDescription>
            </DialogHeader>
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full border p-2 rounded">
                            <option value="">Selecione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                            <option value="Prefiro não informar">Prefiro não informar</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl><Input type="date" {...field} className={fieldClasses} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isPrestador}
                      onCheckedChange={handlePrestadorChange}
                      id="sou-prestador"
                    />
                    <label htmlFor="sou-prestador" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Sou prestador
                    </label>
                  </div>
                </div>
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

