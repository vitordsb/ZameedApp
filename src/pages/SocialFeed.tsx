
// src/pages/SocialFeed.tsx
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Search,
  MapPin,
  Briefcase,
  Filter,
  MessageCircle,
  Users,
  TrendingUp,
  Shield,
  Loader2,
  Zap,
  CheckCircle,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  User,
  Settings,
  UserCheck,
  Home,
} from "lucide-react";
import { apiRequest} from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMessaging } from "@/hooks/use-messaging";

interface Provider {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
  rating_mid: number;
}

interface ProvidersResponse {
  code: number;
  providers: Provider[];
  message: string;
  success: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  cpf: string;
  cnpj?: string;
  cidade_id: number;
  type: "prestador" | "contratante";
}

// Interface ajustada para corresponder ao retorno da API
interface ServiceProvider {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
}

interface FreelancerService {
  ServiceProvider: ServiceProvider;
  createdAt: string;
  description: string;
  id_provider: number;
  id_serviceFreelancer: number;
  price: string;
  title: string;
  updatedAt: string;
}

interface FreelancerServicesResponse {
  code: number;
  message: string;
  servicesFreelancer: FreelancerService[];
  success: boolean;
}

const locations = [
  { label: "São Paulo", value: "sao-paulo" },
  { label: "Rio de Janeiro", value: "rio-de-janeiro" },
  { label: "Belo Horizonte", value: "belo-horizonte" },
  { label: "Curitiba", value: "curitiba" },
  { label: "Porto Alegre", value: "porto-alegre" },
];

const servicesList = [
  "Design de Interiores",
  "Renderização 3D",
  "Planejamento de Espaço",
  "Consultoria de Cores",
  "Design Comercial",
];

// Carrossel de imagens para o banner superior
const carouselImages = [
  {
    src: "/bannerImages/01.jpg",
    title: "Transforme seus projetos em realidade",
    subtitle: "Conecte-se com os melhores arquitetos freelancers"
  },
  {
    src: "/bannerImages/02.webp", 
    title: "Qualidade profissional garantida",
    subtitle: "Todos os nossos profissionais são verificados"
  },
  {
    src: "/bannerImages/03.webp",
    title: "Projetos únicos e personalizados", 
    subtitle: "Encontre o especialista perfeito para seu projeto"
  }
];

export default function SocialFeed() {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // CORREÇÃO: Usar o hook useMessaging para acessar startConversationAndNavigate
  const { startConversationAndNavigate } = useMessaging();

  // Carrossel automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // CORREÇÃO: Função para iniciar conversa usando o hook
  const handleStartConversation = async (targetUserId: number) => {
    if (!currentUser) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para enviar mensagens.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Iniciando conversa com usuário:', targetUserId);
      await startConversationAndNavigate(targetUserId, setLocation);
      toast({
        title: "Conversa iniciada",
        description: "Redirecionando para suas mensagens...",
      });
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // 1) Busca lista de providers
  const { data: provRes, isLoading: loadingProv, isError: errProv } =
    useQuery<ProvidersResponse>({
      queryKey: ["providers"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/providers");
        if (!res.ok) throw new Error("Erro ao buscar prestadores");
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });

  const providers = provRes?.providers ?? [];

  // 2) Busca cada usuário associado - CORREÇÃO: Adicionado enabled para evitar requisições desnecessárias
  const userQueries = useQueries({
    queries: providers.map((p) => ({
      queryKey: ["user", p.user_id],
      queryFn: async () => {
        try {
          // CORREÇÃO: Se for o usuário logado, usar dados do contexto
          if (currentUser && p.user_id === currentUser.id) {
            console.log(`Usando dados do usuário logado para provider ${p.provider_id}`);
            return currentUser as User;
          }
          
          const r = await apiRequest("GET", `/users/${p.user_id}`);
          if (!r.ok) {
            console.error(`Erro ao buscar usuário ${p.user_id}: Status ${r.status}`);
            throw new Error(`Erro ao buscar usuário ${p.user_id}`);
          }
          const body = await r.json();
          return body.user as User;
        } catch (error) {
          console.error(`Falha na requisição para usuário ${p.user_id}:`, error);
          throw error;
        }
      },
      enabled: !!p.user_id && !loadingProv, // Só executa se tiver user_id válido e providers já carregaram
      retry: 2, // Tenta novamente 2 vezes em caso de erro
      retryDelay: 1000, // Aguarda 1 segundo entre tentativas
    })),
  });

  const loadingUsers = userQueries.some((q) => q.isLoading);
  const errUsers = userQueries.some((q) => q.isError);

  // 3) Busca serviços freelancer mais recentes - Interface corrigida
  const { data: servicesRes, isLoading: loadingServices, isError: errServices } =
    useQuery<FreelancerServicesResponse>({
      queryKey: ["freelancer-services"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/servicesfreelancer/getall");
        if (!res.ok) throw new Error("Erro ao buscar serviços");
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });

  // 4) Combina providers + users - CORREÇÃO: Melhor tratamento de erros
  const combined = useMemo(() => {
    if (loadingProv || loadingUsers) return [];
    
    return providers
      .map((provider) => {
        const userQuery = userQueries.find((q) => 
          q.data?.id === provider.user_id || 
          (q.isError && q.failureReason?.message?.includes(provider.user_id.toString()))
        );
        
        // Se a query do usuário falhou, pula este provider
        if (userQuery?.isError) {
          console.warn(`Pulando provider ${provider.provider_id} devido a erro no usuário ${provider.user_id}`);
          return null;
        }
        
        const user = userQuery?.data;
        return user ? { provider, user } : null;
      })
      .filter((x): x is { provider: Provider; user: User } => !!x);
  }, [providers, userQueries, loadingProv, loadingUsers]);

  // 5) Filtra apenas prestadores + aplica filtros de busca e serviço
  // MODIFICAÇÃO: Removido o filtro que exclui o usuário logado
  const allProviders = useMemo(
    () =>
      combined
        .filter(({ user }) => user.type === "prestador")
        .filter(({ provider, user }) => {
          const matchSearch =
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            provider.profession.toLowerCase().includes(search.toLowerCase());
          const matchService = !serviceFilter || provider.profession === serviceFilter;
          return matchSearch && matchService;
        }),
    [combined, search, serviceFilter]
  );

  // NOVA LÓGICA: Separar lista para exibição e detectar se só tem o usuário logado
  const { list, showOnlyCurrentUser } = useMemo(() => {
    // Se não há usuário logado, mostrar todos
    if (!currentUser) {
      return { 
        list: allProviders, 
        showOnlyCurrentUser: false 
      };
    }

    // Separar usuário logado dos outros
    const currentUserProvider = allProviders.find(({ user }) => user.id === currentUser.id);
    const otherProviders = allProviders.filter(({ user }) => user.id !== currentUser.id);

    // Se há outros prestadores, mostrar apenas eles (comportamento original)
    if (otherProviders.length > 0) {
      return { 
        list: otherProviders, 
        showOnlyCurrentUser: false 
      };
    }

    // Se só tem o usuário logado, indicar isso
    if (currentUserProvider) {
      return { 
        list: [], 
        showOnlyCurrentUser: true,
        currentUserProvider 
      };
    }

    // Se não há nenhum prestador
    return { 
      list: [], 
      showOnlyCurrentUser: false 
    };
  }, [allProviders, currentUser]);

  // 6) Processa serviços freelancer mais recentes - Ajustado para nova estrutura
  const recentServices = useMemo(() => {
    if (!servicesRes?.servicesFreelancer) return [];
    return servicesRes.servicesFreelancer
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3); // Pega os 3 mais recentes
  }, [servicesRes]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatPrice = (priceString: string) => {
    // Converte string para número e formata
    const price = parseFloat(priceString);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price);
  };

  // Função para extrair categoria do título ou descrição (já que não há campo category na API)
  const getServiceCategory = (title: string, description: string) => {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (titleLower.includes("3d") || titleLower.includes("render") || descLower.includes("render")) {
      return "Renderização 3D";
    } else if (titleLower.includes("interior") || descLower.includes("interior")) {
      return "Design de Interiores";
    } else if (titleLower.includes("comercial") || descLower.includes("comercial") || descLower.includes("loja")) {
      return "Design Comercial";
    } else if (titleLower.includes("consultoria") || descLower.includes("consultoria")) {
      return "Consultoria";
    } else if (titleLower.includes("jardim") || titleLower.includes("paisag") || descLower.includes("paisag")) {
      return "Paisagismo";
    } else {
      return "Arquitetura";
    }
  };

  // CORREÇÃO: Melhor tratamento de estados de loading e erro
  if (loadingProv) {
    return (
      <ApplicationLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto mb-4" />
            <p className="text-lg text-slate-600">Carregando prestadores...</p>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (errProv) {
    return (
      <ApplicationLayout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
          <p className="text-lg font-medium text-red-600 mb-2">
            Erro ao carregar prestadores
          </p>
          <p className="text-sm text-red-500">
            Verifique sua conexão e tente novamente
          </p>
        </div>
      </ApplicationLayout>
    );
  }

  // Se ainda está carregando usuários, mostra loading parcial
  if (loadingUsers) {
    return (
      <ApplicationLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto mb-4" />
            <p className="text-lg text-slate-600">Carregando informações dos usuários...</p>
            <p className="text-sm text-slate-500 mt-2">
              {providers.length} prestadores encontrados, carregando detalhes...
            </p>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-indigo-50">
        {/* Banner Superior com Carrossel */}
        <div className="relative h-96 overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 mb-8">
          <div className="absolute inset-0">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${image.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            ))}
          </div>
          
          {/* Controles do carrossel */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Conteúdo do banner */}
          <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4">
            <div className="max-w-4xl">
              <motion.h1 
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-6xl font-bold mb-4"
              >
                ZameedApp a melhor plataforma para freelancers de arquitetura
              </motion.h1>
              <motion.p 
                key={`subtitle-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl mb-8 text-orange-100"
              >
                {carouselImages[currentSlide].subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Button className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg font-semibold rounded-full">
                   Comece agora 
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Indicadores do carrossel */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Barra de Pesquisa e Filtros */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por nome ou profissão..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 border-slate-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:border-orange-400 focus:ring-orange-400 bg-white"
                  >
                    <option value="">Todos os serviços</option>
                    {servicesList.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" className="px-6 border-slate-200 hover:bg-orange-50 hover:border-orange-300">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Prestadores</p>
                    <p className="text-3xl font-bold">{allProviders.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Projetos Ativos</p>
                    <p className="text-3xl font-bold">{recentServices.length}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Avaliação Média</p>
                    <p className="text-3xl font-bold">4.8</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Taxa de Sucesso</p>
                    <p className="text-3xl font-bold">96%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção de Serviços Recentes */}
          {recentServices.length > 0 && (
            <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Serviços Recentes
                </CardTitle>
                <CardDescription>
                  Confira os últimos serviços adicionados pelos nossos prestadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentServices.map((service) => (
                    <Card key={service.id_serviceFreelancer} className="border border-slate-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            {getServiceCategory(service.title, service.description)}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {formatDate(service.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                          {service.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(service.price)}
                          </span>
                          <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Prestadores */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Shield className="h-5 w-5 text-orange-500" />
                Prestadores Verificados
              </CardTitle>
              <CardDescription>
                Conecte-se com profissionais qualificados para seus projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* NOVA LÓGICA: Mostrar mensagem quando só há o usuário logado */}
              {showOnlyCurrentUser ? (
                <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <UserCheck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">
                    Você é o único prestador cadastrado!
                  </h3>
                  <p className="text-blue-600 mb-6 max-w-md mx-auto">
                    Parabéns por fazer parte da nossa plataforma! Enquanto aguardamos mais prestadores se cadastrarem, 
                    que tal completar seu perfil para atrair mais clientes?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => setLocation("/profile")}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Editar Meu Perfil
                    </Button>
                    <Button 
                      onClick={() => setLocation("/home")}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      Voltar ao Início
                    </Button>
                  </div>
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">
                    Nenhum prestador encontrado
                  </h3>
                  <p className="text-slate-500">
                    Tente ajustar os filtros de busca para encontrar mais prestadores.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.map(({ provider, user }) => (
                    <motion.div
                      key={provider.provider_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card className="h-full border border-slate-200 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-white">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <Avatar className="h-16 w-16 border-2 border-orange-200">
                              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-lg">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-slate-800 mb-1">
                                {user.name}
                              </h3>
                              <p className="text-orange-600 font-medium mb-2">
                                {provider.profession}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="font-medium">
                                    {provider.rating_mid || "4.5"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>{provider.views_profile} visualizações</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {provider.about && (
                            <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                              {provider.about}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              <Award className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/providers/${provider.provider_id}`} className="flex-1">
                              <Button 
                                variant="outline" 
                                className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                              >
                                <User className="h-4 w-4 mr-2" />
                                Ver Perfil
                              </Button>
                            </Link>
                            <Button 
                              onClick={() => handleStartConversation(user.id)}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contatar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ApplicationLayout>
  );
}


