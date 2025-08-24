
// src/pages/DemandsPage.tsx
import { useState, useEffect } from "react";
import { Link } from "wouter";
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
  Briefcase,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Demand {
  id_demand: number;
  id_user: number;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
  User?: UserData; // Adiciona a propriedade User opcional
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

interface EnrichedDemand extends Demand {
  userName: string;
  userEmail: string;
}

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function DemandsPage() {
  const [demands, setDemands] = useState<EnrichedDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    (async () => {
      try {
        // 1) busca demandas
        const demandRes = await apiRequest("GET", "/demands/getall");
        if (!demandRes.ok) throw new Error("Erro ao buscar demandas");
        const body = await demandRes.json();
        const fetchedDemands: Demand[] = Array.isArray(body.demand) ? body.demand : [];

        const enriched: EnrichedDemand[] = fetchedDemands.map(d => {
          return {
            ...d,
            userName: d.User?.name || "Usuário Desconhecido",
            userEmail: d.User?.email || "N/A",
            price: parseFloat(d.price as any) // Garante que o preço é um número
          };
        });

        setDemands(enriched);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <ApplicationLayout>
         <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
            </div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-amber-600 mx-auto">

            </div>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (error) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-red-200 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center mx-auto">
                <span className="text-red-600 text-3xl">⚠️</span>
              </div>
              </div>
            </div>
          </div>
      </ApplicationLayout>
    );
  }

  let filtered = demands.filter(
    (d) =>
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortBy === "newest") {
    filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (sortBy === "priceAsc") {
    filtered.sort((a, b) => a.price - b.price);
  } else {
    filtered.sort((a, b) => b.price - a.price);
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
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isNewDemand = (dateString: string) => {
    const demandDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - demandDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Considera nova se foi criada nos últimos 7 dias
  };

  return (
    <ApplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 scroll-smooth">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <p className="text-lg text-slate-600">
                {filtered.length === 0 ? "Nenhuma demanda encontrada" : 
                 `${filtered.length} demanda${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
              </p>
              {searchTerm && (
                <Badge className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-md">
                  Buscando por: "{searchTerm}"
                </Badge>
              )}
            </div>
          </div>

          {/* Demands Grid/List */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                : "space-y-6"
            }`}
          >
            {pageItems.map((demand, index) => (
              <Card 
                key={demand.id_demand} 
                className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm border-white/30 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-amber-100/50 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] ${
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
                          <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-amber-600 transition-colors duration-300 line-clamp-2 mb-3">
                            {demand.title}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <CardDescription className="text-2xl font-bold text-green-600">
                              R$ {demand.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </CardDescription>
                          </div>
                        </div>
                        {isNewDemand(demand.created_at) && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Star className="h-3 w-3 mr-1" />
                            Nova
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 pb-6 relative z-10">
                      <p className="text-slate-600 line-clamp-3 leading-relaxed text-base">
                        {demand.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-300/50">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate text-lg">{demand.userName}</p>
                          <p className="text-sm text-slate-500 truncate">{demand.userEmail}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-slate-500">
                        <Clock className="h-4 w-4 mr-2" />
                        Publicada em {formatDate(demand.created_at)}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="flex justify-between pt-6 border-t border-white/20 relative z-10">
                      <Link href={`/user/${demand.id_user}`}>
                        <Button 
                          size="lg" 
                          variant="outline"
                          className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-amber-400 hover:bg-amber-50/50 transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-amber-300"
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
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
                            <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">
                              {demand.title}
                            </h3>
                            {isNewDemand(demand.created_at) && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg">
                                <Star className="h-3 w-3 mr-1" />
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 line-clamp-2 mb-6 text-lg leading-relaxed">
                            {demand.description}
                          </p>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-5 w-5 text-green-600" />
                              <span className="text-2xl font-bold text-green-600">
                                R$ {demand.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-300/50">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <span className="font-semibold text-slate-700">{demand.userName}</span>
                                <p className="text-sm text-slate-500">{demand.userEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-500">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(demand.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3 ml-6">
                          <Link href={`/users/${demand.id_user}`}>
                            <Button 
                              size="lg" 
                              variant="outline"
                              className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-amber-400 hover:bg-amber-50/50 transition-all duration-300 rounded-xl hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-amber-300"
                            >
                              Ver Contratante
                            </Button>
                          </Link>
                          <Link href={`/demand/${demand.id_demand}`}>
                            <Button 
                              size="lg"
                              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1 focus:ring-2 focus:ring-amber-300"
                            >
                              <Briefcase className="h-4 w-4 mr-2" />
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
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Search className="h-16 w-16 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-4">Nenhuma demanda encontrada</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Não encontramos demandas que correspondam aos seus critérios de busca. 
                  Tente ajustar os filtros ou usar termos diferentes.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSortBy("newest") 
                  }}>
                  </Button>
                    <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
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
                className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-blue-400 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-300"
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
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                        : "bg-white/80 backdrop-blur-sm border-white/30 hover:border-amber-400 transition-all duration-300 hover:scale-105 rounded-xl hover:shadow-lg focus:ring-2 focus:ring-amber-300"
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
                className="bg-white/80 backdrop-blur-sm border-white/30 hover:border-blue-400 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-300"
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

