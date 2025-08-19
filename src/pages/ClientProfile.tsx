
// src/pages/ClientProfile.tsx - Versão Unificada
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
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
  Loader2,
} from "lucide-react";

export interface UserApi {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  type: string;
}

export interface Demand {
  id_demand: number;
  id_user: number;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ClientProfile() {
  const { user_id } = useParams<{ user_id: string }>();
  const [, setLocation] = useLocation();

  // 1) Busca todos os usuários e filtra pelo ID
  const { data: usersEnv, isLoading: loadingUsers } = useQuery<{ users: UserApi[] }>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/users");
      if (!res.ok) throw new Error("Erro ao buscar usuários");
      return res.json();
    },
  });

  const user = usersEnv?.users.find(u => String(u.id) === user_id);

  // 2) Carrega e filtra demandas
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loadingDm, setLoadingDm] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/demands/getall");
        const body = await res.json();
        setDemands(
          (Array.isArray(body.demand) ? body.demand : []).filter(
            (d: Demand) => String(d.id_user) === user_id
          )
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDm(false);
      }
    })();
  }, [user_id]);

  // Loading state unificado
  if (loadingUsers || !user) {
    return (
      <ApplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto">
              {loadingUsers ? (
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
              ) : (
                <User className="h-10 w-10 text-orange-500" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">
                {loadingUsers ? "Carregando perfil..." : "Perfil não encontrado"}
              </h3>
              <p className="text-slate-500">
                {loadingUsers 
                  ? "Aguarde enquanto buscamos as informações mais recentes."
                  : "O perfil que você está procurando não existe ou foi removido."
                }
              </p>
            </div>
            {!loadingUsers && (
              <Button 
                onClick={() => setLocation("/home")}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            )}
          </div>
        </div>
      </ApplicationLayout>
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

  return (
    <ApplicationLayout>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 scroll-smooth">
      <motion.div
        className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* HEADER HERO SECTION - Design Unificado */}
        <Card className="relative overflow-hidden shadow-2xl border-0 rounded-3xl">
          {/* Background com gradiente unificado */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-600 to-amber-500" />
          
          {/* Padrão decorativo removido para simplicidade */}
          
          <CardContent className="relative p-6 sm:p-8 lg:p-12 text-white">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
              {/* Avatar - Design Unificado */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative flex-shrink-0"
              >
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-white shadow-2xl">
                  <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-4xl sm:text-5xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </motion.div>

              {/* Informações principais - Layout Unificado */}
              <div className="flex-1 text-center lg:text-left space-y-4 min-w-0">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words">{user.name}</h1>
                  <p className="text-lg sm:text-xl lg:text-2xl text-white/90 font-medium">
                    Contratante
                  </p>
                </motion.div>

                {/* Badges de estatísticas - Design Unificado */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3"
                >
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {demands.length} demandas ativas
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Membro desde {getSince(user.createdAt)}
                  </Badge>
                </motion.div>

                {/* Botões de ação rápida - Design Unificado */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 pt-4"
                >
                  <Button
                    onClick={() => setLocation(`/messages/${user.id}`)}
                    className="bg-white text-amber-600 hover:bg-white/90 font-semibold px-4 py-2 sm:px-6 sm:py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Enviar Mensagem
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Seção Sobre - Removida para contratante mas mantém estrutura */}

            {/* Demandas - Design Unificado */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Demandas Publicadas
                    <Badge className="bg-amber-100 text-amber-700 ml-auto text-xs sm:text-sm">
                      {demands.length} {demands.length === 1 ? 'demanda' : 'demandas'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDm ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin h-12 w-12 text-amber-600" />
                    </div>
                  ) : demands.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-10 w-10 sm:h-12 sm:w-12 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma demanda publicada</h3>
                      <p className="text-slate-500 text-sm sm:text-base">Este contratante ainda não publicou nenhuma demanda.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {demands.map((d, index) => (
                        <motion.div
                          key={d.id_demand}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        >
                          <Card className="border border-white/30 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] bg-white/60 backdrop-blur-sm rounded-2xl">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2 break-words">{d.title}</h3>
                                  <p className="text-slate-600 leading-relaxed mb-4 text-sm sm:text-base break-words">
                                    {d.description}
                                  </p>
                                  <div className="flex items-center text-xs sm:text-sm text-slate-500">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Publicada em {formatDate(d.created_at)}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="flex items-center text-xl sm:text-2xl font-bold text-green-600 mb-2">
                                      R$ {parseFloat(d.price as any).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-amber-600 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
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

          <div className="space-y-6">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">
                        {demands.length}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500">Demandas Publicadas</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">
                        {getSince(user.createdAt)}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500">Tempo na Plataforma</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
    </ApplicationLayout>
  );
}


