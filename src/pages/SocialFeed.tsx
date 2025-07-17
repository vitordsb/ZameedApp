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

  // 2) Busca cada usuário associado
  const userQueries = useQueries({
    queries: providers.map((p) => ({
      queryKey: ["user", p.user_id],
      queryFn: async () => {
        const r = await apiRequest("GET", `/users/${p.user_id}`);
        if (!r.ok) throw new Error("Erro ao buscar usuário");
        const body = await r.json();
        return body.user as User;
      },
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

  // 4) Combina providers + users
  const combined = useMemo(() => {
    if (loadingProv || loadingUsers) return [];
    return providers
      .map((provider) => {
        const user = userQueries.find((q) => q.data?.id === provider.user_id)?.data;
        return user ? { provider, user } : null;
      })
      .filter((x): x is { provider: Provider; user: User } => !!x);
  }, [providers, userQueries, loadingProv, loadingUsers]);

  // 5) Filtra apenas prestadores + aplica filtros de busca e serviço (removido filtro de avaliação)
  const list = useMemo(
    () =>
      combined
        .filter(({ user }) => user.type === "prestador")
        .filter(({ provider }) => provider.user_id !== currentUser?.id)
        .filter(({ provider, user }) => {
          const matchSearch =
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            provider.profession.toLowerCase().includes(search.toLowerCase());
          const matchService = !serviceFilter || provider.profession === serviceFilter;
          return matchSearch && matchService;
        }),
    [combined, search, serviceFilter]
  );

  // 6) Processa serviços freelancer mais recentes - Ajustado para nova estrutura
  const recentServices = useMemo(() => {
    if (!servicesRes?.servicesFreelancer) return [];
    return servicesRes.servicesFreelancer
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3); // Pega os 5 mais recentes
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

  if (loadingProv || loadingUsers) {
    return (
      <ApplicationLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto" />
        </div>
      </ApplicationLayout>
    );
  }
  if (errProv || errUsers) {
    return (
      <ApplicationLayout>
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-lg font-medium text-red-600">
            Ocorreu um erro ao carregar os dados.
          </p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {list.map(({ provider, user }) => (
                  <motion.div
                    key={provider.provider_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    {/* Card de Perfil Modernizado */}
                    <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 bg-white border-0 rounded-3xl group-hover:scale-[1.02]">
                      {/* Banner Superior com Gradiente Dinâmico */}
                      <div className="h-32 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 relative overflow-hidden">
                        {/* Padrão decorativo */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                        </div>
                        {/* Overlay sutil */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </div>
                      
                      {/* Avatar Flutuante */}
                      <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                        <div className="relative">
                          <Avatar className="w-24 h-24 ring-4 ring-white shadow-2xl border-2 border-white/50">
                            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                              {user.name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Badge de verificação premium */}
                          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-2 shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Principal */}
                      <CardContent className="pt-20 pb-8 px-8 text-center">
                        {/* Nome e Profissão */}
                        <div className="mb-6">
                          <CardTitle className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
                            {user.name}
                          </CardTitle>
                          
                          <Badge className="mb-4 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-4 py-2 rounded-full font-medium border border-orange-200/50">
                            {provider.profession}
                          </Badge>
                        </div>

                        {/* Avaliação Estilizada */}
                        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-100">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-5 h-5 transition-colors duration-200 ${
                                  i < Math.floor(provider.rating_mid) 
                                    ? 'text-amber-400 fill-current drop-shadow-sm' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-lg font-semibold text-amber-700">
                            {provider.rating_mid}
                          </span>
                        </div>

                        {/* Descrição com altura fixa e line-clamp */}
                        <div className="mb-6 h-16 flex items-center justify-center">
                          <CardDescription className="text-slate-600 text-sm leading-relaxed line-clamp-3 text-center">
                            {provider.about ?? "Profissional especializado em projetos arquitetônicos únicos e personalizados, com foco em soluções criativas e funcionais."}
                          </CardDescription>
                        </div>

                        {/* Estatísticas em Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-medium text-blue-800">Cidade {user.cidade_id}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-2xl border border-purple-100">
                            <div className="flex items-center justify-center gap-2 text-purple-600 mb-1">
                              <Users className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-medium text-purple-800">{provider.views_profile} views</p>
                          </div>
                        </div>

                        {/* Botões de Ação Modernos */}
                        <div className="flex gap-3">
                          <Link href={`/providers/${provider.provider_id}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] border-0">
                              <User className="w-5 h-5 mr-2" />
                              Ver Perfil
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 rounded-2xl p-3 transition-all duration-300 hover:scale-105"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardContent>

                      {/* Efeito de hover sutil */}
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
                    </Card>
                  </motion.div>
                ))}
              </div>
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
