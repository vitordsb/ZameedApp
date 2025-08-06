
import { useState, useEffect } from "react";
import { AuthModals } from "@/components/AuthModals";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
export default function AuthPage() {
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const { isLoggedIn } = useAuth();
  const [location, navigate] = useLocation();
  const [justLoggedIn, setJustLoggedIn] = useState(false); 

  useEffect(() => {
  if (isLoggedIn && justLoggedIn) {
    const lastRoute = sessionStorage.getItem("last_route");
    const shouldGo = !lastRoute || lastRoute === "/auth" ? "/home" : lastRoute;
    navigate(shouldGo);
  }
}, [isLoggedIn, justLoggedIn, navigate]);  const handleSwitchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const handleAuthSuccess = () => {
    setJustLoggedIn(true);
  };

  const handleGuest = () => {
    navigate("/home");
  }
  return (
    <div className="flex min-h-screen">
      <Navbar/>
      <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center items-center bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Bem vindo ArqDoor!</h1>
            <p className="text-gray-600 mb-8">
              Por favor, faça login ou crie uma conta para continuar.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => setIsLoginOpen(true)} 
              className="w-full" 
              size="lg"
            >
            Entrar
            </Button>
            <Button 
              onClick={() => setIsRegisterOpen(true)} 
              variant="outline" 
              className="w-full" 
              size="lg"
            >
            Criar conta
            </Button>
            <div className="text-center mt-4">
              <Button 
                variant="link" 
                onClick={handleGuest}
              >
             Quero apenas experimentar!
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-amber-600 to-amber-600/50 items-center justify-center">
        <div className="max-w-md p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">Descubra profissionais incríveis</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Encontre o projetista perfeito para o seu projeto</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Compare portfólios e escolha o melhor designer</p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                ✓
              </div>
              <p>Compartilhe projetos e obtenha feedbacks valiosos</p>
            </li>
          </ul>
        </div>
      </div>

      <AuthModals
        isLoginOpen={isLoginOpen}
        isRegisterOpen={isRegisterOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onRegisterClose={() => setIsRegisterOpen(false)}
        onSuccess={handleAuthSuccess}
        onSwitchToRegister={handleSwitchToRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}

