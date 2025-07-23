
// src/pages/ProviderProfile.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import AplicationLayout from "@/components/layouts/ApplicationLayout";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Eye,
  Calendar,
  Briefcase,
  User,
  DollarSign,
  CheckCircle,
  MessageCircle,
  ArrowLeft,
  Heart,
  Share2,
  Mail,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  Phone,
  Image as ImageIcon,
  Grid3X3,
  Loader2,
  Settings,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export interface ProviderApi {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
  rating_mid: string;
  created_at: string;
}

export interface UserApi {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface Service {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: string;
  created_at: string;
}

export interface PortfolioItem {
  id: number;
  image_id: number;
  user_id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ImageItem {
  id: number;
  user_id: number;
  image_url: string;
  image_path: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProviderProfile() {
  const { provider_id } = useParams<{ provider_id: string }>();
  const [, setLocation] = useLocation();
  const viewed = useRef(false);
  
  // Hook para acessar dados do usuário logado
  const { user: currentUser } = useAuth();

  // Estados para portfólio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // 1) Provider - com estados de loading e error explícitos
  const { 
    data: provEnv, 
    isLoading: isLoadingProvider, 
    isError: isErrorProvider,
    error: providerError 
  } = useQuery<{ provider: ProviderApi }>({
    queryKey: ["provider", provider_id],
    enabled: !!provider_id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/providers/${provider_id}`);
      if (!res.ok) {
        throw new Error(`Provider não encontrado: ${res.status}`);
      }
      return res.json();
    },
    retry: 2,
    retryDelay: 1000,
  });
  const provider = provEnv?.provider;

  // 2) User - com estados de loading e error explícitos
  const userId = provider?.user_id.toString();
  const { 
    data: userEnv, 
    isLoading: isLoadingUser, 
    isError: isErrorUser,
    error: userError 
  } = useQuery<{ user: UserApi }>({
    queryKey: ["user", userId],
    enabled: !!userId,
    queryFn: async () => {
      // CORREÇÃO: Se for o usuário logado, usar os dados do contexto
      if (currentUser && userId && parseInt(userId) === currentUser.id) {
        console.log("Usando dados do usuário logado do contexto");
        return { user: currentUser as UserApi };
      }
      
      // Caso contrário, buscar na API
      const res = await apiRequest("GET", `/users/${userId}`);
      if (!res.ok) {
        throw new Error(`Usuário não encontrado: ${res.status}`);
      }
      return res.json();
    },
    retry: 2,
    retryDelay: 1000,
  });
  const user = userEnv?.user;

  // 3) Verificar se é o próprio usuário
  const isOwnProfile = currentUser && provider && currentUser.id === provider.user_id;

  // 4) Incrementa view apenas uma vez e se for usuário diferente
  useEffect(() => {
    if (
      provider &&
      currentUser &&
      currentUser.id !== provider.user_id &&
      !viewed.current
    ) {
      // Verificar se já visualizou antes de incrementar
      checkAndIncrementView();
      viewed.current = true;
    }
  }, [provider, currentUser]);

  const checkAndIncrementView = async () => {
    try {
      // Aqui você pode implementar uma verificação se o usuário já visualizou
      // Por enquanto, vamos incrementar diretamente
      await apiRequest("PATCH", `/providers/addview/${provider?.provider_id}`);
    } catch (error) {
      console.error("Erro ao incrementar visualização:", error);
    }
  };

  // 5) Carrega e filtra serviços
  const [services, setServices] = useState<Service[]>([]);
  const [loadingSv, setLoadingSv] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/servicesfreelancer/getall");
        const body = await res.json();
        setServices(
          (body.servicesFreelancer as Service[]).filter(
            (s) => String(s.id_provider) === provider_id
          )
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSv(false);
      }
    })();
  }, [provider_id]);

  // 6) Carrega portfólio
  useEffect(() => {
    if (userId) {
      loadPortfolio();
    }
  }, [userId]);

  const loadPortfolio = async () => {
    try {
      setLoadingPortfolio(true);
      
      // Buscar portfólio
      const portfolioRes = await apiRequest("GET", `/portfolio?user=${userId}`);
      if (portfolioRes.ok) {
        try {
          const portfolioData = await portfolioRes.json();
          // CORREÇÃO: Acessar portfolioData.posts em vez de portfolioData diretamente
          const portfolioItems = portfolioData.posts || portfolioData;
          setPortfolio(Array.isArray(portfolioItems) ? portfolioItems : []);
        } catch (jsonError) {
          console.error("Erro ao fazer parse do JSON do portfólio:", jsonError);
          const textResponse = await portfolioRes.text();
          console.error("Resposta recebida:", textResponse);
          setPortfolio([]);
        }
      } else {
        console.error("Erro ao buscar portfólio:", portfolioRes.status);
        setPortfolio([]);
      }

      // Buscar imagens
      const imagesRes = await apiRequest("GET", `/upload/images?user=${userId}`);
      if (imagesRes.ok) {
        try {
          const imagesData = await imagesRes.json();
          // Verificar se a resposta tem a estrutura esperada
          if (imagesData && imagesData.images && Array.isArray(imagesData.images)) {
            setImages(imagesData.images);
          } else if (Array.isArray(imagesData)) {
            setImages(imagesData);
          } else {
            console.warn("Estrutura de dados de imagens inesperada:", imagesData);
            setImages([]);
          }
        } catch (jsonError) {
          console.error("Erro ao fazer parse do JSON das imagens:", jsonError);
          const textResponse = await imagesRes.text();
          console.error("Resposta recebida:", textResponse);
          setImages([]);
        }
      } else {
        console.error("Erro ao buscar imagens:", imagesRes.status);
        setImages([]);
      }
    } catch (error) {
      console.error("Erro ao carregar portfólio:", error);
      setPortfolio([]);
      setImages([]);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  // Função para obter URL da imagem pelo image_id
  const getImageUrl = (imageId: number) => {
    const image = images.find(img => img.id === imageId);
    
    if (image?.image_path) {
      const baseUrl = "https://zameed-backend.onrender.com";
      const imageUrl = image.image_path.startsWith("http") 
        ? image.image_path 
        : `${baseUrl}/${image.image_path}`;
      
      return imageUrl;
    }
    
    return "/placeholder-image.jpg";
  };

  // ESTADO DE CARREGAMENTO - Mostrar loading enquanto os dados estão sendo buscados
  if (isLoadingProvider || isLoadingUser) {
    return (
      <AplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">Carregando perfil...</h3>
              <p className="text-slate-500">Aguarde enquanto buscamos as informações do profissional.</p>
            </div>
          </div>
        </div>
      </AplicationLayout>
    );
  }

  // MENSAGEM PARA PRÓPRIO USUÁRIO - Exibir mensagem personalizada quando for o próprio perfil
  if (isOwnProfile) {
    return (
      <AplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-blue-200 shadow-xl max-w-md mx-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="h-10 w-10 text-blue-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-700">Esse é o seu usuário</h3>
              <p className="text-slate-600 leading-relaxed">
                Por favor, se quiser ver informações, clique no seu perfil no canto superior direito e vá em "Meu Perfil".
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation("/profile")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ir para Meu Perfil
              </Button>
              <Button 
                onClick={() => setLocation("/home")}
                variant="outline"
                className="border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </AplicationLayout>
    );
  }

  // ESTADO DE ERRO - Só mostrar "perfil não encontrado" se realmente houver erro ou dados não existirem
  if (isErrorProvider || isErrorUser || !provider || !user) {
    return (
      <AplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-red-200 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-red-700">Perfil não encontrado</h3>
              <p className="text-red-600">
                {providerError?.message || userError?.message || "O perfil que você está procurando não existe ou foi removido."}
              </p>
            </div>
            <Button 
              onClick={() => setLocation("/home")}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>
        </div>
      </AplicationLayout>
    );
  }

  const getInitials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  
  const getSince = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff < 30) return `${diff} dias`;
    if (diff < 365) return `${Math.floor(diff / 30)} meses`;
    return `${Math.floor(diff / 365)} anos`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return "Data inválida";
    }
  };

  const getRatingColor = (rating: string) => {
    const num = parseFloat(rating);
    if (num >= 4.5) return "text-green-600";
    if (num >= 3.5) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <AplicationLayout>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 scroll-smooth">
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* HEADER HERO SECTION */}
        <Card className="relative overflow-hidden shadow-2xl border-0 rounded-3xl">
          {/* Background com gradiente laranja */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500" />
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          <CardContent className="relative p-6 sm:p-8 lg:p-12 text-white">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative flex-shrink-0"
              >
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white shadow-2xl">
                  <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-4xl sm:text-5xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </motion.div>

              {/* Informações principais */}
              <div className="flex-1 text-center lg:text-left space-y-4 min-w-0">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words">{user.name}</h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/90 font-medium break-words">{provider.profession}</p>
                </motion.div>

                {/* Badges de estatísticas */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3"
                >
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 fill-current" />
                    {provider.rating_mid} estrelas
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {provider.views_profile} visualizações
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Desde {formatDate(user.createdAt)}
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {services.length} serviços
                  </Badge>
                </motion.div>

                {/* Botões de ação rápida */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 pt-4"
                >
                  <Button
                    onClick={() => setLocation(`/messages?userId=${user.id}`)}
                    className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-4 py-2 sm:px-6 sm:py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Enviar Mensagem
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-orange-600 hover:bg-white hover:text-orange-600 font-semibold px-4 py-2 sm:px-6 sm:py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Favoritar
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Sobre mim */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Sobre Mim
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-slate-700 leading-relaxed text-base sm:text-lg">
                      {provider.about || "Este profissional ainda não adicionou uma descrição sobre si. Entre em contato para saber mais sobre seus serviços e experiência."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Portfólio */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Portfólio
                    <Badge className="bg-orange-100 text-orange-700 ml-auto">
                      {portfolio.length} {portfolio.length === 1 ? 'projeto' : 'projetos'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPortfolio ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-300 border-t-orange-600"></div>
                    </div>
                  ) : portfolio.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum projeto no portfólio</h3>
                      <p className="text-slate-500">Este profissional ainda não adicionou projetos ao seu portfólio.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {portfolio
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 3)
                        .map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                          >
                            <Card className="border border-white/30 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden">
                              <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 relative overflow-hidden">
                                <img
                                  src={getImageUrl(item.image_id)}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/placeholder-image.jpg";
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                              <CardContent className="p-4">
                                <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2 line-clamp-1">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed mb-4 text-sm sm:text-base line-clamp-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center text-xs sm:text-sm text-slate-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(item.created_at)}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Serviços */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Serviços Oferecidos
                    <Badge className="bg-orange-100 text-orange-700 ml-auto">
                      {services.length} {services.length === 1 ? 'serviço' : 'serviços'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingSv ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-300 border-t-orange-600"></div>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum serviço cadastrado</h3>
                      <p className="text-slate-500">Este profissional ainda não cadastrou nenhum serviço.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {services.map((s, index) => (
                        <motion.div
                          key={s.id_serviceFreelancer}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        >
                          <Card className="border border-white/30 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] bg-white/60 backdrop-blur-sm rounded-2xl">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2 break-words">{s.title}</h3>
                                  <p className="text-slate-600 leading-relaxed mb-4 text-sm sm:text-base break-words">
                                    {s.description}
                                  </p>
                                  <div className="flex items-center text-xs sm:text-sm text-slate-500">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Criado em {formatDate(s.created_at)}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 w-full sm:w-auto">
                                  <div className="flex items-center justify-center sm:justify-end text-xl sm:text-2xl font-bold text-green-600 mb-2">
                                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                                    {parseFloat(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
                                  >
                                    Ver Detalhes
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                      <div className={`text-xl sm:text-2xl font-bold ${getRatingColor(provider.rating_mid)}`}>
                        {provider.rating_mid}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500">Avaliação</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">
                        {provider.views_profile}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500">Visualizações</div>
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {services.length}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500">Serviços Ativos</div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {portfolio.length}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500">Projetos no Portfólio</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Ações */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
                    onClick={() => setLocation(`/messages?userId=${user.id}`)}
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Enviar Mensagem
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold py-2.5 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> 
                    Favoritar Perfil
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-2.5 sm:py-3 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    onClick={() => setLocation("/home")}
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> 
                    Voltar ao Início
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
    </AplicationLayout> 
  );
}


