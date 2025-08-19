
// src/pages/SocialFeed.tsx - Versão com Links de Perfil Corrigidos
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  FileText,
  DollarSign,
  Eye,
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

interface UsersResponse {
  code: number;
  users: User[];
  message: string;
  success: boolean;
}

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

interface Demand {
  id_demand: number;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  status: string;
  id_user: number;
  createdAt: string;
  updatedAt: string;
  User?: User;
}

interface DemandsResponse {
  code: number;
  message: string;
  demands: Demand[];
  success: boolean;
}

// Componente UserBanner melhorado com responsividade
const UserBanner = ({ userId, className = '' }: { userId: number; className?: string }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserImage = async () => {
      if (!userId) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);

       const response = await apiRequest("GET", `/users/images/${userId}`); 

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.images && data.images.length > 0) {
          const firstImage = data.images[0];
          if (firstImage.image_url) {
            setImageUrl(firstImage.image_url);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao buscar imagem do usuário:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserImage();
  }, [userId]);

  const bannerStyle = {
    width: '100%',
    height: 'clamp(60px, 8vw, 100px)', // Altura responsiva
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: error || !imageUrl ? '#FEF8C3' : 'transparent',
    backgroundImage: imageUrl && !error ? `url(${imageUrl})` : 'none'
  };

  if (loading) {
    return (
      <div className={`${className}`} style={{...bannerStyle, backgroundColor: '#f3f4f6'}}>
        <div className="text-gray-500 text-xs">Carregando...</div>
      </div>
    );
  }

  return (
    <div className={`${className}`} style={bannerStyle}>
      {(error || !imageUrl) && (
        <div className="text-gray-600 text-xs">
        </div>
      )}
    </div>
  );
};

// Componente Avatar melhorado com responsividade
const UserAvatar = ({ userId, className = '', size = 'md' }: { userId: number; className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUserImage = async () => {
      if (!userId) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);

       const response = await apiRequest("GET", `/users/images/${userId}`); 

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.images && data.images.length > 0) {
          const firstImage = data.images[0];
          if (firstImage.image_url) {
            setImageUrl(firstImage.image_url);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao buscar imagem do usuário:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserImage();
  }, [userId]);

  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
    xl: 'w-20 h-20 sm:w-24 sm:h-24'
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-orange-100 flex items-center justify-center ${className}`}>
        <User className="w-6 h-6 text-orange-600" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg ${className}`}>
      <img 
        src={imageUrl} 
        alt="Avatar do usuário" 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

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
  const { user, isLoggedIn, user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { startConversationAndNavigate } = useMessaging();

  // Carrossel automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000); // Aumentado para 4 segundos
    return () => clearInterval(timer);
  }, []);

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
      console.log("Iniciando conversa com usuário:", targetUserId);
      setLocation(`/messages/${targetUserId}`);
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a conversa. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para gerar o link correto do perfil baseado no tipo de usuário
  const getProfileLink = (item: { user: User; provider: Provider | null }) => {
    if (item.user.type === "contratante") {
      return `/user/${item.user.id}`;
    } else if (item.user.type === "prestador" && item.provider) {
      return `/providers/${item.provider.provider_id}`;
    }
    // Fallback para casos inesperados
    return `/user/${item.user.id}`;
  };

  // Queries para buscar dados
  const { data: usersRes, isLoading: loadingAllUsers, isError: errAllUsers } =
    useQuery<UsersResponse>({
      queryKey: ["allUsers"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/users");
        if (!res.ok) throw new Error("Erro ao buscar todos os usuários");
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });

  const allUsers = usersRes?.users ?? [];

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

  const combinedUsersAndProviders = useMemo(() => {
    if (loadingAllUsers || loadingProv) return [];

    return allUsers.map(user => {
      if (user.type === "prestador") {
        const providerData = providers.find(p => p.user_id === user.id);
        return providerData ? { user, provider: providerData } : null;
      } else {
        return { user, provider: null };
      }
    }).filter(item => item !== null);
  }, [allUsers, providers, loadingAllUsers, loadingProv]);

  const allProvidersData = useMemo(
    () =>
      combinedUsersAndProviders
        .filter(item => item.user.type === "prestador" && item.provider !== null) as { user: User; provider: Provider }[],
    [combinedUsersAndProviders]
  );

  const allClientsData = useMemo(
    () =>
      combinedUsersAndProviders
        .filter(item => item.user.type === "contratante") as { user: User; provider: null }[],
    [combinedUsersAndProviders]
  );

  const { displayList, showOnlyCurrentUser } = useMemo(() => {
    if (!currentUser) {
      return { 
        displayList: allProvidersData.filter(item => {
          const matchSearch =
            item.user.name.toLowerCase().includes(search.toLowerCase()) ||
            item.provider.profession.toLowerCase().includes(search.toLowerCase());
          const matchService = !serviceFilter || item.provider.profession === serviceFilter;
          const matchLocation = !locationFilter || (item.user.cidade_id && locations.find(loc => loc.value === locationFilter && item.user.cidade_id.toString() === loc.value));
          return matchSearch && matchService && matchLocation;
        }), 
        showOnlyCurrentUser: false 
      };
    }

    if (currentUser.type === "prestador") {
      return {
        displayList: allClientsData.filter(item => {
          const matchSearch = item.user.name.toLowerCase().includes(search.toLowerCase());
          const matchLocation = !locationFilter || (item.user.cidade_id && locations.find(loc => loc.value === locationFilter && item.user.cidade_id.toString() === loc.value));
          return matchSearch && matchLocation;
        }),
        showOnlyCurrentUser: false
      };
    }

    if (currentUser.type === "contratante") {
      return {
        displayList: allProvidersData.filter(item => {
          const matchSearch =
            item.user.name.toLowerCase().includes(search.toLowerCase()) ||
            item.provider.profession.toLowerCase().includes(search.toLowerCase());
          const matchService = !serviceFilter || item.provider.profession === serviceFilter;
          const matchLocation = !locationFilter || (item.user.cidade_id && locations.find(loc => loc.value === locationFilter && item.user.cidade_id.toString() === loc.value));
          return matchSearch && matchService && matchLocation;
        }),
        showOnlyCurrentUser: false
      };
    }

    return { 
      displayList: [], 
      showOnlyCurrentUser: true 
    };
  }, [allProvidersData, allClientsData, currentUser, search, serviceFilter, locationFilter]);

  // Query para buscar serviços freelancer
  const { data: servicesRes, isLoading: loadingServices, isError: errServices } =
    useQuery<FreelancerServicesResponse>({
      queryKey: ["servicesFreelancer"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/servicesfreelancer/getall");
        if (!res.ok) throw new Error("Erro ao buscar serviços freelancer");
        return res.json();
      },
      staleTime: 5 * 60 * 100,
    });

  // Query para buscar demandas
  const { data: demandsRes, isLoading: loadingDemands, isError: errDemands } =
    useQuery<DemandsResponse>({
      queryKey: ["demands"],
      queryFn: async () => {
        const res = await apiRequest("GET", "/demands/getall");
        if (!res.ok) throw new Error("Erro ao buscar demandas");
        return res.json();
      },
      staleTime: 5 * 60 * 100,
    });

  const recentServices = useMemo(() => {
    if (!servicesRes?.servicesFreelancer) return [];
    return servicesRes.servicesFreelancer
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [servicesRes]);
  console.log(recentServices);

  const recentDemands = useMemo(() => {
    if (!demandsRes?.demands) return [];
    return demandsRes.demands
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [demandsRes]);
  console.log(recentDemands);

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
    const price = parseFloat(priceString);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price);
  };

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

  const getDemandCategory = (title: string, description: string) => {
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

  if (loadingAllUsers || loadingProv) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">Carregando perfis...</h3>
              <p className="text-slate-500">Aguarde enquanto buscamos os melhores profissionais para você.</p>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (errAllUsers || errProv) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">Erro ao carregar dados</h3>
              <p className="text-slate-500">Não foi possível carregar os perfis. Tente novamente mais tarde.</p>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        {/* Banner Hero com Carrossel */}
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image.src})` }}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white px-4 max-w-4xl">
                    <motion.h1
                      key={`title-${currentSlide}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4"
                    >
                      {image.title}
                    </motion.h1>
                    <motion.p
                      key={`subtitle-${currentSlide}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="text-lg sm:text-xl lg:text-2xl text-white/90"
                    >
                      {image.subtitle}
                    </motion.p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Controles do carrossel */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar esquerda */}
            <div className="lg:w-80 space-y-6">
              {/* Filtros de pesquisa */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="h-5 w-5 text-amber-600" />
                    Filtros de Busca
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Buscar por nome ou profissão
                    </label>
                    <Input
                      placeholder="Digite aqui..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="border-gray-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Localização
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-amber-500 focus:ring-amber-500 bg-white"
                    >
                      <option value="">Todas as cidades</option>
                      {locations.map((loc) => (
                        <option key={loc.value} value={loc.value}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {currentUser?.type !== "prestador" && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Serviço
                      </label>
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-amber-500 focus:ring-amber-500 bg-white"
                      >
                        <option value="">Todos os serviços</option>
                        {servicesList.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Últimas ofertas */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Últimas Ofertas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingServices ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    </div>
                  ) : recentServices.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Nenhuma oferta disponível no momento.
                    </p>
                  ) : (
                    recentServices.map((service) => (
                      <div key={service.id_serviceFreelancer} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                          {service.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(service.price)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getServiceCategory(service.title, service.description)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Demandas recentes */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    Demandas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDemands ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                    </div>
                  ) : recentDemands.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Nenhuma demanda disponível no momento.
                    </p>
                  ) : (
                    recentDemands.map((demand) => (
                      <div key={demand.id_demand} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                        <h4 className="font-semibold text-sm text-gray-900 mb-1">
                          {demand.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {demand.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(demand.budget)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getDemandCategory(demand.title, demand.description)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Conteúdo principal */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {currentUser?.type === "prestador" 
                    ? "Clientes Disponíveis" 
                    : currentUser?.type === "contratante"
                    ? "Prestadores Disponíveis"
                    : "Prestadores Disponíveis"
                  }
                </h2>
                <Badge variant="outline" className="text-sm">
                  {displayList.length} {displayList.length === 1 ? "perfil" : "perfis"}
                </Badge>
              </div>

              {displayList.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum perfil encontrado
                    </h3>
                    <p className="text-gray-500">
                      Tente ajustar os filtros de pesquisa para encontrar mais resultados.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {displayList.map((item) => (
                    <motion.div
                      key={item.user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        {/* Banner do usuário */}
                        <UserBanner userId={item.user.id} />
                        
                        {/* Conteúdo do perfil */}
                        <CardContent className="relative p-4 sm:p-6">
                          {/* Avatar centralizado */}
                          <div className="flex justify-center -mt-10 mb-4">
                            <UserAvatar 
                              userId={item.user.id} 
                              size="lg"
                              className="ring-4 ring-white"
                            />
                          </div>
                          
                          {/* Informações centralizadas */}
                          <div className="text-center space-y-3">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                {item.user.name}
                              </h3>
                              
                              {item.provider && (
                                <>
                                  <p className="text-amber-600 font-medium text-sm sm:text-base mb-2">
                                    {item.provider.profession || "Ainda não informou"}
                                  </p>
                                  
                                  {/* Rating centralizado */}
                                  <div className="flex items-center justify-center gap-1 mb-3">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < Math.floor(item.provider.rating_mid)
                                              ? "text-yellow-400 fill-current"
                                              : "text-gray-300"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-600 ml-1">
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Badges e informações */}
                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                              <Badge variant="secondary" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {item.user.type === "prestador" ? "Prestador" : "Cliente"}
                              </Badge>
                              
                              {item.provider && (
                                <Badge variant="outline" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {item.provider.views_profile} visualizações
                                </Badge>
                              )}
                            </div>
                            
                            
                            {/* Botões de ação centralizados com link condicional */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs sm:text-sm hover:bg-gray-50"
                                asChild
                              >
                                <Link href={getProfileLink(item)}>
                                  <User className="h-4 w-4 mr-1" />
                                  Ver Perfil
                                </Link>
                              </Button>
                              
                              {isLoggedIn && currentUser?.id !== item.user.id && (
                                <Button
                                  size="sm"
                                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm"
                                  onClick={() => handleStartConversation(item.user.id)}
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Conversar
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}


