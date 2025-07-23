
// src/pages/SocialFeed.tsx
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link } from "wouter";
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
  Crown,
  Sparkles,
} from "lucide-react";
import { apiRequest} from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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

  // Carrossel automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
  // MODIFICAÇÃO: INCLUINDO TODOS OS PRESTADORES (inclusive o usuário logado)
  const list = useMemo(
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
    [combined, search, serviceFilter] // Removido currentUser?.id da dependência
  );

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
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (priceString: string) => {
    // Converte string para número e formata
    const price = parseFloat(priceString);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Função para extrair categoria do título ou descrição (já que não há campo category na API)
  const getServiceCategory = (title: string, description: string) => {
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (titleLower.includes('3d') || titleLower.includes('render') || descLower.includes('render')) {
      return 'Renderização 3D';
    } else if (titleLower.includes('interior') || descLower.includes('interior')) {
      return 'Design de Interiores';
    } else if (titleLower.includes('comercial') || descLower.includes('comercial') || descLower.includes('loja')) {
      return 'Design Comercial';
    } else if (titleLower.includes('consultoria') || descLower.includes('consultoria')) {
      return 'Consultoria';
    } else if (titleLower.includes('jardim') || titleLower.includes('paisag') || descLower.includes('paisag')) {
      return 'Paisagismo';
    } else {
      return 'Arquitetura';
    }
  };

  // Função para verificar se é o usuário logado
  const isCurrentUser = (userId: number) => {
    return currentUser && currentUser.id === userId;
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

        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="mb-12 shadow-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-amber-900">
                    Encontre o Profissional Perfeito
                  </CardTitle>
                </div>
                <CardDescription>
                  Use os filtros abaixo para encontrar arquitetos que atendam
                  exatamente às suas necessidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Campos de pesquisa ajustados - removido filtro de avaliação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome ou especialidade"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  {/* Location */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10 w-full border p-2 rounded focus:border-amber-500"
                    >
                      <option value="">Localização</option>
                      {locations.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Service */}
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="pl-10 w-full border p-2 rounded focus:border-amber-500"
                    >
                      <option value="">Serviço</option>
                      {servicesList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(search || locationFilter || serviceFilter) && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filtros ativos:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setLocationFilter("");
                        setServiceFilter("");
                      }}
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      Limpar todos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista de Architects */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <section className="lg:col-span-3">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {list.length} Arquitetos Encontrados
                </h2>
                <Badge className="bg-amber-100 text-amber-700 px-3 py-1">
                  Todos Verificados
                </Badge>
              </div>

              {/* CORREÇÃO: Mostrar aviso se alguns usuários falharam ao carregar */}
              {errUsers && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Alguns perfis não puderam ser carregados. Mostrando {list.length} de {providers.length} prestadores disponíveis.
                    </p>
                  </div>
                </div>
              )}

              {/* GRID DE CARDS - AGORA INCLUINDO TODOS OS PRESTADORES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {list.map(({ provider, user }) => {
                  const isOwnProfile = isCurrentUser(user.id);
                  
                  return (
                    <motion.div
                      key={provider.provider_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      {/* Card com Destaque para Usuário Logado */}
                      <Card className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl group-hover:scale-[1.02] ${
                        isOwnProfile 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-100 ring-2 ring-blue-300 ring-opacity-50' 
                          : 'bg-white'
                      }`}>
                        
                        {/* Badge "Seu Perfil" para o usuário logado */}
                        {isOwnProfile && (
                          <div className="absolute top-2 right-2 z-10">
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                              <Crown className="w-3 h-3 mr-1" />
                              Seu Perfil
                            </Badge>
                          </div>
                        )}
                        
                        {/* Banner Superior Compacto */}
                        <div className={`h-16 relative overflow-hidden ${
                          isOwnProfile 
                            ? 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600' 
                            : 'bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500'
                        }`}>
                          {/* Padrão decorativo sutil */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -translate-y-8 translate-x-8"></div>
                            {isOwnProfile && (
                              <Sparkles className="absolute top-2 left-2 w-4 h-4 text-white/60 animate-pulse" />
                            )}
                          </div>
                        </div>
                        
                        {/* Avatar Posicionado */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                          <Avatar className={`w-14 h-14 ring-3 shadow-lg border-2 border-white/50 ${
                            isOwnProfile ? 'ring-blue-300' : 'ring-white'
                          }`}>
                            <AvatarFallback className={`text-base font-bold text-white ${
                              isOwnProfile 
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-800' 
                                : 'bg-gradient-to-br from-slate-600 to-slate-800'
                            }`}>
                              {user.name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Badge de verificação */}
                          <div className={`absolute -bottom-1 -right-1 rounded-full p-1 shadow-lg ${
                            isOwnProfile 
                              ? 'bg-gradient-to-r from-blue-400 to-indigo-500' 
                              : 'bg-gradient-to-r from-green-400 to-emerald-500'
                          }`}>
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        {/* Conteúdo Principal Compacto */}
                        <CardContent className="pt-9 pb-4 px-4 text-center">
                          {/* Nome e Profissão */}
                          <div className="mb-2">
                            <CardTitle className={`text-base font-bold mb-1 tracking-tight line-clamp-1 ${
                              isOwnProfile ? 'text-blue-900' : 'text-slate-800'
                            }`}>
                              {user.name}
                            </CardTitle>
                            
                            <Badge className={`mb-2 px-2 py-1 rounded-full font-medium border text-xs ${
                              isOwnProfile 
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200/50' 
                                : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200/50'
                            }`}>
                              {provider.profession}
                            </Badge>
                          </div>

                          {/* Avaliação Limpa */}
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Star className={`w-4 h-4 fill-current ${
                              isOwnProfile ? 'text-blue-500' : 'text-amber-500'
                            }`} />
                            <span className={`text-sm font-semibold ${
                              isOwnProfile ? 'text-blue-800' : 'text-gray-800'
                            }`}>
                              {provider.rating_mid}
                            </span>
                            <span className={`text-xs ml-1 ${
                              isOwnProfile ? 'text-blue-400' : 'text-gray-400'
                            }`}>
                              • {provider.views_profile} views
                            </span>
                          </div>

                          {/* Descrição Compacta */}
                          <div className="mb-3 h-8 flex items-center justify-center">
                            <CardDescription className={`text-xs leading-tight line-clamp-2 text-center ${
                              isOwnProfile ? 'text-blue-700' : 'text-slate-600'
                            }`}>
                              {provider.about ?? "Profissional especializado em projetos arquitetônicos únicos e personalizados."}
                            </CardDescription>
                          </div>

                          {/* Informação de Localização Compacta */}
                          <div className="mb-3">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${
                              isOwnProfile 
                                ? 'bg-blue-50 border-blue-100' 
                                : 'bg-blue-50 border-blue-100'
                            }`}>
                              <MapPin className={`w-3 h-3 ${
                                isOwnProfile ? 'text-blue-600' : 'text-blue-600'
                              }`} />
                              <span className={`text-xs font-medium ${
                                isOwnProfile ? 'text-blue-800' : 'text-blue-800'
                              }`}>
                                Cidade {user.cidade_id}
                              </span>
                            </div>
                          </div>

                          {/* Botões de Ação Compactos */}
                          <div className="flex gap-2">
                            <Link href={`/providers/${provider.provider_id}`} className="flex-1">
                              <Button className={`w-full font-semibold py-1.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg text-xs ${
                                isOwnProfile 
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white' 
                                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
                              }`}>
                                <User className="w-3 h-3 mr-1" />
                                {isOwnProfile ? 'Meu Perfil' : 'Ver Perfil'}
                              </Button>
                            </Link>
                            {!isOwnProfile && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 rounded-xl p-1.5 transition-all duration-300"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mensagem quando não há resultados */}
              {list.length === 0 && !loadingProv && !loadingUsers && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Nenhum arquiteto encontrado
                  </h3>
                  <p className="text-slate-500 mb-4">
                    Tente ajustar os filtros de busca para encontrar mais profissionais.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setLocationFilter("");
                      setServiceFilter("");
                    }}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </section>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Serviços Freelancer Mais Recentes - COM BOTÃO VER PERFIL */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="bg-amber-50 border-amber-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <CardTitle className="text-amber-800">
                        Serviços Mais Recentes
                      </CardTitle>
                    </div>
                    <CardDescription className="text-amber-600">
                      Últimos serviços lançados na plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingServices ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="animate-spin h-6 w-6 text-amber-600" />
                      </div>
                    ) : errServices ? (
                      <p className="text-sm text-red-600 text-center py-4">
                        Erro ao carregar serviços
                      </p>
                    ) : recentServices.length > 0 ? (
                      recentServices.map((service) => (
                        <div key={service.id_serviceFreelancer} className="border-b border-amber-200 pb-3 last:border-b-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                            {service.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {service.description}
                          </p>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-amber-600 font-semibold">
                              {formatPrice(service.price)}
                            </span>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(service.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-amber-100 text-amber-800 text-xs">
                              {getServiceCategory(service.title, service.description)}
                            </Badge>
                            {/* BOTÃO VER PERFIL ADICIONADO */}
                            <Link href={`/providers/${service.ServiceProvider.provider_id}`}>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-xs px-2 py-1 h-6 border-amber-300 text-amber-700 hover:bg-amber-100"
                              >
                                <User className="w-3 h-3 mr-1" />
                                Ver Perfil
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-4">
                        Nenhum serviço encontrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium Features */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Card className="bg-amber-50 border-amber-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-600" />
                      <CardTitle className="text-amber-800">
                        Recursos Premium
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "Contratação Expressa",
                      "Garantia de Qualidade",
                      "Suporte 24/7",
                    ].map((txt, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <p className="text-sm text-gray-900">{txt}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* CTA Support */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <Card className="bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-xl border-0">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white mb-3 text-lg">
                      Precisa de Ajuda?
                    </CardTitle>
                    <CardDescription className="text-amber-100 text-sm mb-4">
                      Nossa equipe está pronta para ajudar você a encontrar o
                      arquiteto perfeito.
                    </CardDescription>
                    <Button className="w-full bg-white text-amber-600 hover:bg-amber-50 font-semibold py-2.5 rounded-xl">
                      Falar com Especialista
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </aside>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}


