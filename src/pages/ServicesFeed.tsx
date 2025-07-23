
// src/pages/ServicesFeed.tsx
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Grid3X3,
  SortAsc,
  SortDesc,
  Search,
  User,
  Star,
  Clock,
  DollarSign,
  Filter,
  TrendingUp,
  Award,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Interfaces baseadas na estrutura real da API
interface ServiceProvider {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
}

interface ServiceFreelancer {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: string; // A API retorna como string
  createdAt: string;
  updatedAt: string;
  ServiceProvider: ServiceProvider;
}

interface ServicesResponse {
  code: number;
  message: string;
  servicesFreelancer: ServiceFreelancer[];
  success: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  cidade_id?: number;
  type: "prestador" | "contratante";
  gender?: string;
  birth?: string;
  created_at: string;
  updated_at: string;
}

interface UserResponse {
  code: number;
  message: string;
  user: User;
  success: boolean;
}

interface EnrichedService extends ServiceFreelancer {
  userName: string;
  userEmail: string;
  userType: string;
}

export default function ServicesFeed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const perPage = 6;
  
  // Hook para acessar dados do usuário logado
  const { user: currentUser } = useAuth();

  // Query para buscar todos os serviços
  const { 
    data: servicesData, 
    isLoading: loadingServices, 
    isError: errorServices,
    error: servicesError
  } = useQuery<ServicesResponse>({
    queryKey: ["services-freelancer"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/servicesfreelancer/getall");
      if (!res.ok) {
        throw new Error(`Erro ao buscar serviços: ${res.status}`);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para buscar informações dos usuários (executada apenas quando temos serviços)
  const { 
    data: enrichedServices, 
    isLoading: loadingUsers,
    isError: errorUsers 
  } = useQuery<EnrichedService[]>({
    queryKey: ["enriched-services", servicesData?.servicesFreelancer, currentUser?.id],
    queryFn: async () => {
      if (!servicesData?.servicesFreelancer) return [];
      
      const services = servicesData.servicesFreelancer;
      const enriched: EnrichedService[] = [];

      // Buscar informações do usuário para cada serviço
      for (const service of services) {
        try {
          let userData: User | null = null;
          
          // CORREÇÃO: Se o serviço foi postado pelo usuário logado, usar os dados do usuário logado
          if (currentUser && service.ServiceProvider.user_id === currentUser.id) {
            userData = currentUser;
            console.log(`Usando dados do usuário logado para serviço ${service.id_serviceFreelancer}`);
          } else {
            // Caso contrário, buscar na API
            try {
              const userRes = await apiRequest("GET", `/users/${service.ServiceProvider.user_id}`);
              if (userRes.ok) {
                const userResponse: UserResponse = await userRes.json();
                userData = userResponse.user;
                console.log(`Dados do usuário ${service.ServiceProvider.user_id} carregados da API`);
              } else {
                console.error(`Erro ao buscar usuário ${service.ServiceProvider.user_id}: Status ${userRes.status}`);
              }
            } catch (apiError) {
              console.error(`Erro na requisição para usuário ${service.ServiceProvider.user_id}:`, apiError);
            }
          }

          if (userData) {
            enriched.push({
              ...service,
              userName: userData.name,
              userEmail: userData.email,
              userType: userData.type,
            });
          } else {
            // Fallback: usar dados básicos do ServiceProvider se disponível
            enriched.push({
              ...service,
              userName: service.ServiceProvider.profession || "Prestador",
              userEmail: "Email não disponível",
              userType: "prestador",
            });
            console.warn(`Usando fallback para serviço ${service.id_serviceFreelancer}`);
          }
        } catch (error) {
          console.error(`Erro geral ao processar usuário ${service.ServiceProvider.user_id}:`, error);
          // Fallback em caso de erro
          enriched.push({
            ...service,
            userName: service.ServiceProvider.profession || "Prestador",
            userEmail: "Email não disponível",
            userType: "prestador",
          });
        }
      }

      console.log(`Processados ${enriched.length} serviços de ${services.length} total`);
      return enriched;
    },
    enabled: !!servicesData?.servicesFreelancer && servicesData.servicesFreelancer.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const services = enrichedServices || [];
  const loading = loadingServices || loadingUsers;
  const error = errorServices || errorUsers;

  if (loading) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
              <Loader2 className="animate-spin h-16 w-16 text-orange-600 mx-auto" />
              <div className="space-y-2">
                <p className="text-xl font-semibold text-slate-700">Carregando serviços</p>
                <p className="text-slate-500">Aguarde enquanto buscamos os melhores profissionais</p>
              </div>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-red-200 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-red-700">Ops! Algo deu errado</p>
                <p className="text-red-600">
                  {servicesError?.message || "Erro ao carregar serviços"}
                </p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  // Filtrar e ordenar serviços
  let filtered = services.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortBy === "newest") {
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sortBy === "priceAsc") {
    filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else {
    filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  }

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  const getSortLabel = () => {
    switch (sortBy) {
      case "newest": return "Mais recentes";
      case "priceAsc": return "Menor preço";
      case "priceDesc": return "Maior preço";
      default: return "Ordenar";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (priceString: string) => {
    const price = parseFloat(priceString);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const isNewService = (dateString: string) => {
    const serviceDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - serviceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Considera novo se foi criado nos últimos 7 dias
  };

  return (
    <ApplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 scroll-smooth">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center space-y-6 mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                Serviços Freelancer
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Conecte-se com profissionais talentosos e encontre soluções personalizadas para suas necessidades
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span>+{services.length} serviços ativos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-orange-500" />
                  <span>Profissionais verificados</span>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por serviços, habilidades ou profissionais..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-12 h-14 bg-white/80 backdrop-blur-sm border-white/30 focus:border-orange-400 focus:ring-orange-300 rounded-2xl shadow-lg text-lg transition-all duration-300 focus:scale-105 focus:shadow-xl"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    const nextSort = sortBy === "newest" ? "priceAsc" : sortBy === "priceAsc" ? "priceDesc" : "newest";
                    setSortBy(nextSort);
                  }}
                  className="h-14 px-6 bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-orange-300"
                  variant="outline"
                >
                  <Filter className="h-5 w-5 mr-2" />
                  {getSortLabel()}
                  {sortBy === "priceAsc" ? <SortAsc className="h-4 w-4 ml-2" /> : <SortDesc className="h-4 w-4 ml-2" />}
                </Button>
                
                <Button 
                  onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
                  className="h-14 px-4 bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-orange-300"
                  variant="outline"
                >
                  {viewMode === "grid" ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Results Info */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <p className="text-lg text-slate-600">
                {filtered.length === 0 ? "Nenhum serviço encontrado" : 
                 `${filtered.length} serviço${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
              </p>
              {searchTerm && (
                <Badge className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md">
                  Buscando por: "{searchTerm}"
                </Badge>
              )}
            </div>
          </div>

          {/* Services Grid/List */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                : "space-y-6"
            }`}
          >
            {pageItems.map((svc, index) => (
              <Card 
                key={svc.id_serviceFreelancer} 
                className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] ${
                  viewMode === "list" ? "flex flex-row" : ""
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                
                {viewMode === "grid" ? (
                  <>
                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2 mb-3">
                            {svc.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <CardDescription className="text-2xl font-bold text-green-600">
                              {formatPrice(svc.price)}
                            </CardDescription>
                          </div>
                        </div>
                        {isNewService(svc.createdAt) && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Star className="h-3 w-3 mr-1" />
                            Novo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 pb-6 relative z-10">
                      <p className="text-slate-600 line-clamp-3 leading-relaxed text-base">
                        {svc.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-300/50">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-lg">{svc.userName}</p>
                          <p className="text-sm text-slate-500 truncate">{svc.userEmail}</p>
                          <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">
                            {svc.ServiceProvider.profession}
                          </Badge>
                          {/* Indicador se é o usuário logado */}
                          {currentUser && svc.ServiceProvider.user_id === currentUser.id && (
                            <Badge className="mt-1 ml-2 bg-green-100 text-green-800 text-xs">
                              Seu serviço
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="h-4 w-4 mr-2" />
                        Publicado em {formatDate(svc.createdAt)}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-6 border-t border-white/20 relative z-10">
                      <Link href={`/providers/${svc.ServiceProvider.provider_id}`}>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-orange-300"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </Link>
                      <Link href={`/service/${svc.id_serviceFreelancer}`}>
                        <Button 
                          size="lg"
                          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 focus:ring-2 focus:ring-orange-300"
                        >
                          Ver Detalhes
                        </Button>
                      </Link>
                    </CardFooter>
                  </>
                ) : (
                  <>
                    <div className="flex-1 p-8 relative z-10">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                              {svc.title}
                            </h3>
                            {isNewService(svc.createdAt) && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg">
                                <Star className="h-3 w-3 mr-1" />
                                Novo
                              </Badge>
                            )}
                            {/* Indicador se é o usuário logado */}
                            {currentUser && svc.ServiceProvider.user_id === currentUser.id && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Seu serviço
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 line-clamp-2 mb-6 text-lg leading-relaxed">
                            {svc.description}
                          </p>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="text-2xl font-bold text-green-600">
                                {formatPrice(svc.price)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-orange-300/50">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">{svc.userName}</span>
                                <p className="text-sm text-slate-500">{svc.userEmail}</p>
                                <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">
                                  {svc.ServiceProvider.profession}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-500">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(svc.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3 ml-6">
                          <Link href={`/providers/${svc.ServiceProvider.provider_id}`}>
                            <Button 
                              size="lg" 
                              variant="outline"
                              className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-orange-300"
                            >
                              Ver Perfil
                            </Button>
                          </Link>
                          <Link href={`/service/${svc.id_serviceFreelancer}`}>
                            <Button 
                              size="lg"
                              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 focus:ring-2 focus:ring-orange-300"
                            >
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {pageItems.length === 0 && (
            <div className="text-center py-20">
              <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl max-w-md mx-auto shadow-xl border border-white/20">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Search className="h-16 w-16 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-4">Nenhum serviço encontrado</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Não encontramos serviços que correspondam aos seus critérios de busca. 
                  Tente ajustar os filtros ou usar termos diferentes.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("newest");
                    setPage(1);
                  }}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1"
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3 mt-16">
              <Button 
                disabled={page === 1} 
                onClick={() => setPage((p) => p - 1)}
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-orange-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex space-x-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="lg"
                      onClick={() => setPage(pageNum)}
                      className={pageNum === page 
                        ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                        : "bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 transition-all duration-300 hover:scale-105 rounded-xl hover:shadow-lg focus:ring-2 focus:ring-orange-300"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                variant="outline"
                size="lg"
                className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-orange-400 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-orange-300"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </ApplicationLayout>
  );
}


