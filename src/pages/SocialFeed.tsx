
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

// Componente UserBanner integrado
const UserBanner = ({ userId, className = '' }) => {
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
    height: '80px', // Altura reduzida para cards
    borderRadius: '8px 8px 0 0',
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

// Componente Avatar do usuário para o perfil
const UserAvatar = ({ userId, className = '', size = 'md' }) => {
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
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
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
      console.log("Iniciando conversa com usuário:", targetUserId);
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
      <div className="min-h-screen bg-gray-100">
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
                ArqDoor a melhor plataforma para freelancers de arquitetura
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

        <div className="container mx-auto px-4 py-8">
          {/* Barra de Pesquisa e Filtros */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar designers ou serviços..."
                className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-orange-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select
                className="w-full sm:w-auto px-4 py-2 border rounded-full focus:ring-2 focus:ring-orange-500"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="">Todos os Serviços</option>
                {servicesList.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
              <select
                className="w-full sm:w-auto px-4 py-2 border rounded-full focus:ring-2 focus:ring-orange-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">Todas as Localizações</option>
                {locations.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2">
                <Filter className="h-5 w-5 mr-2" /> Filtrar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Coluna da Esquerda: Últimos Serviços e Falar com Especialista */}
            <div className="lg:col-span-1 flex flex-col space-y-8">
              {/* Seção de Últimos Serviços Adicionados */}
              {recentServices.length > 0 && (
                <Card className="shadow-lg rounded-lg overflow-hidden bg-white border border-gray-200">
                  <CardHeader className="bg-yellow-100 p-4 border-b border-yellow-200">
                    <CardTitle className="text-xl font-bold text-yellow-800 flex items-center">
                      <Zap className="h-6 w-6 text-yellow-600 mr-2" /> Serviços recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {recentServices.map((service) => (
                      <div key={service.id_serviceFreelancer} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <h3 className="font-semibold text-gray-800 text-lg">{service.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-1">{service.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <span className="font-bold text-green-600">{formatPrice(service.price)}</span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> {formatDate(service.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                            {getServiceCategory(service.title, service.description)}
                          </Badge>
                          <Link href={`/providers/${service.id_provider}`}>
                            <Button variant="link" className="h-auto p-0 text-amber-500 hover:text-amber-600">
                              <UserCheck className="h-3 w-3 mr-1" /> 
                              Ver Perfil
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Seção Falar com Especialista */}
              <Card className="p-6 shadow-lg rounded-lg bg-white border-100 border-gray-200">
                <CardTitle className="text-2xl font-bold text-amber-700 mb-4 flex items-center">
                  <MessageCircle className="h-7 w-7 mr-2" /> Solicite suporte 
                </CardTitle>
                <CardDescription className="text-black-600">
                  Está precisando de suporte 24 horas para tirar alguma dúvida referente a plataforma? Clique no botão e fale com um especialista agora mesmo!
                </CardDescription>
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-4">
                  Falar com especialista 
                </Button>
              </Card>
            </div>

            {/* Coluna da Direita: Prestadores em Destaque */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
                <Users className="h-7 w-7 text-amber-500 mr-2" /> {list.length} profissionais encontrados 
              </h2>
              {showOnlyCurrentUser ? (
                <Card className="w-full p-6 text-center shadow-lg rounded-lg bg-yellow-50 border-yellow-200">
                  <CardTitle className="text-xl font-semibold text-yellow-800 mb-2">
                    Você é o único prestador encontrado com os filtros atuais!
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    Seu perfil está em destaque. Compartilhe para atrair mais clientes.
                  </CardDescription>
                  <Link href="/profile">
                    <Button className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white">
                      Ver Meu Perfil
                    </Button>
                  </Link>
                </Card>
              ) : list.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.map(({ provider, user }) => (
                    <Card
                      key={provider.provider_id}
                      className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border border-gray-200"
                    >
                      {/* Banner do usuário */}
                      <div className="relative">
                        <UserBanner userId={user.id} className="h-20" />
                        
                        {/* Avatar posicionado metade no banner e metade no conteúdo */}
                        <div className="absolute left-6 -bottom-10 z-10">
                          <UserAvatar userId={user.id} size="lg" />
                        </div>
                      </div>
                      
                      <CardContent className="pt-12 pb-4 px-6">
                        {/* Nome e profissão */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {provider.profession || "Profissão não informada"}
                          </p>
                        </div>

                        {/* Estatísticas */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{provider.rating_mid}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{provider.views_profile} views</span>
                          </div>
                        </div>

                        {/* Localização */}
                        <div className="flex items-center  text-gray-600 mb-4">
                          <MapPin className="h-4 w-4 mr-1" /> {user.cidade_id ? `Cidade ID: ${user.cidade_id}` : "Em breve"}
                        </div>

                        {/* Botões de ação */}
                        <div className="flex gap-2">
                          <Link href={`/providers/${provider.user_id}`} className="flex-1">
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                              Ver Perfil
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            className="flex-none p-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleStartConversation(user.id)}
                          >
                            <MessageCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : ( 
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Nenhum prestador encontrado com os filtros atuais.</p>
                  <p className="text-sm text-gray-400">Tente ajustar sua busca ou filtros.</p>
                </div>
              )}
            </div>
          </div>

          {/* Seção de Gerenciamento de Demandas (apenas para contratantes) */}
          {currentUser?.type === "contratante" && (
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" /> Minhas Demandas
              </h2>
              {/* <DemandsManager /> */}
              <Card className="p-6 shadow-lg rounded-lg">
                <p className="text-gray-700">Aqui viria o componente DemandsManager.</p>
              </Card>
            </div>
          )}

          {/* Seção de Segurança e Privacidade */}
          <div className="mt-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
              <Shield className="h-8 w-8 text-green-500 mr-3" /> Segurança e Privacidade
            </h2>
            <Card className="p-6 shadow-lg rounded-lg">
              <p className="text-gray-700">
                Sua segurança é nossa prioridade. Utilizamos as mais recentes tecnologias de criptografia
                e proteção de dados para garantir que suas informações estejam sempre seguras.
              </p>
              <ul className="list-disc list-inside text-gray-600 mt-4 space-y-2">
                <li>Verificação de perfil para todos os prestadores.</li>
                <li>Transações financeiras seguras e protegidas.</li>
                <li>Suporte ao cliente dedicado para qualquer problema.</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}


