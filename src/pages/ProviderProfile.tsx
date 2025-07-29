
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
  AlertCircle,
} from "lucide-react";

export interface ProviderApi {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
  rating_mid: string;
  created_at: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserApi {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  birth?: string;
  gender?: string;
  cpf?: string;
  cnpj?: string;
  type: string;
  termos_aceitos?: boolean;
  is_email_verified?: boolean;
  perfil_completo?: boolean;
  updatedAt?: string;
}

export interface Service {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: string;
  created_at: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Estados para portfólio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // Estados para serviços
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [errorServices, setErrorServices] = useState<string | null>(null);

  // Estados para dados atualizados
  const [refreshedProvider, setRefreshedProvider] = useState<ProviderApi | null>(null);
  const [refreshedUser, setRefreshedUser] = useState<UserApi | null>(null);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  // Obter user_id do usuário logado
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.user_id || payload.id);
      } catch (error) {
        console.error("Erro ao decodificar token:", error);
      }
    }
  }, []);

  // Função para buscar dados atualizados
  const refreshData = async () => {
    if (!provider_id) return;
    
    setLoadingRefresh(true);
    try {
      // Buscar provider atualizado
      const providerRes = await apiRequest("GET", `/providers/${provider_id}`);
      if (providerRes.ok) {
        const providerData = await providerRes.json();
        setRefreshedProvider(providerData.provider);
        
        // Buscar user atualizado
        const userRes = await apiRequest("GET", `/users/${providerData.provider.user_id}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setRefreshedUser(userData.user);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setLoadingRefresh(false);
    }
  };

  // 1) Provider - usando dados atualizados se disponíveis
  const { data: provEnv, isLoading: isLoadingProvider } = useQuery<{ provider: ProviderApi }>({
    queryKey: ["provider", provider_id],
    enabled: !!provider_id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/providers/${provider_id}`);
      if (!res.ok) throw new Error("Provider não encontrado");
      return res.json();
    },
  });
  const provider = refreshedProvider || provEnv?.provider;

  // 2) User - usando dados atualizados se disponíveis
  const userId = provider?.user_id.toString();
  const { data: userEnv, isLoading: isLoadingUser } = useQuery<{ user: UserApi }>({
    queryKey: ["user", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/users/${userId}`);
      if (!res.ok) throw new Error("Usuário não encontrado");
      return res.json();
    },
  });
  const user = refreshedUser || userEnv?.user;

  // 3) Incrementa view apenas uma vez e se for usuário diferente
  useEffect(() => {
    if (
      provider &&
      currentUserId &&
      currentUserId !== provider.user_id &&
      !viewed.current
    ) {
      checkAndIncrementView();
      viewed.current = true;
    }
  }, [provider, currentUserId]);

  const checkAndIncrementView = async () => {
    try {
      await apiRequest("PATCH", `/providers/addview/${provider?.provider_id}`);
      // Atualizar dados após incrementar view
      await refreshData();
    } catch (error) {
      console.error("Erro ao incrementar visualização:", error);
    }
  };

  // 4) Carrega e filtra serviços
  useEffect(() => {
    loadServices();
  }, [provider_id]);

  const loadServices = async () => {
    if (!provider_id) return;
    
    setLoadingServices(true);
    setErrorServices(null);
    try {
      const res = await apiRequest("GET", "/servicesfreelancer/getall");
      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      
      const body = await res.json();
      const allServices = body.servicesFreelancer || [];
      
      // Filtrar serviços do provider específico
      const filteredServices = allServices.filter(
        (s: Service) => String(s.id_provider) === provider_id
      );
      
      setServices(filteredServices);
    } catch (error: any) {
      console.error("Erro ao carregar serviços:", error);
      setErrorServices(error.message);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // 5) Carrega portfólio
  useEffect(() => {
    if (userId) {
      loadPortfolio();
    }
  }, [userId]);

  const loadPortfolio = async () => {
    if (!userId) return;
    
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

  // Loading state
  if (isLoadingProvider || isLoadingUser || loadingRefresh) {
    return (
      <AplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">Carregando perfil...</h3>
              <p className="text-slate-500">Aguarde enquanto buscamos as informações mais recentes.</p>
            </div>
          </div>
        </div>
      </AplicationLayout>
    );
  }

  if (!provider || !user) {
    return (
      <AplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto">
              <User className="h-10 w-10 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">Perfil não encontrado</h3>
              <p className="text-slate-500">O perfil que você está procurando não existe ou foi removido.</p>
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
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/90 font-medium break-words">
                    {provider.profession || "Prestador de Serviços"}
                  </p>
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
                    className="border-white text-white hover:bg-white hover:text-orange-600 font-semibold px-4 py-2 sm:px-6 sm:py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Favoritar
                  </Button>
                  <Button
                    onClick={refreshData}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-orange-600 font-semibold px-4 py-2 sm:px-6 sm:py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Atualizar
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
{/* Portfólio */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Portfólio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPortfolio ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  ) : portfolio.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                      <p>Nenhum item no portfólio ainda.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {portfolio.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className="group cursor-pointer"
                        >
                          <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                            <div className="aspect-video bg-slate-100 overflow-hidden">
                              {getImageUrl(item.image_id) ? (
                                <img
                                  src={getImageUrl(item.image_id)}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-12 h-12 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-semibold text-slate-800 mb-2 break-words">
                                {item.title}
                              </h4>
                              <p className="text-sm text-slate-600 line-clamp-2 break-words">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

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
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                    {provider.about || "Este prestador ainda não adicionou uma descrição sobre si."}
                  </p>
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingServices ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  ) : errorServices ? (
                    <div className="text-center py-8 text-red-600">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                      <p>Erro ao carregar serviços: {errorServices}</p>
                    </div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Briefcase className="w-12 h-12 mx-auto mb-4" />
                      <p>Nenhum serviço disponível no momento.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6">
                      {services.map((service, index) => (
                        <motion.div
                          key={service.id_serviceFreelancer}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index, duration: 0.5 }}
                          className="p-4 sm:p-6 border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:border-orange-300 bg-white/50"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg sm:text-xl text-slate-800 mb-2 break-words">
                                {service.title}
                              </h3>
                              <p className="text-slate-600 text-sm sm:text-base leading-relaxed break-words">
                                {service.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                <span className="text-xl sm:text-2xl font-bold text-green-600">
                                  R$ {service.price}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-4 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-xs sm:text-sm"
                              >
                                Contratar Serviço
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

                      </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:space-y-8">
            {/* Estatísticas */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-slate-600">Avaliação</span>
                    </div>
                    <span className={`font-semibold ${getRatingColor(provider.rating_mid)}`}>
                      {provider.rating_mid}/5.0
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-600">Visualizações</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {provider.views_profile}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-slate-600">Serviços</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {services.length}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-slate-600">Membro há</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {getSince(user.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Informações de contato */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      onClick={() => setLocation(`/messages?userId=${user.id}`)}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Adicionar aos Favoritos
                    </Button>
                  </div>
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


