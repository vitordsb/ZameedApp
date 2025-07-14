
// src/pages/ClientProfile.tsx
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

  if (loadingUsers || !user) {
    return (
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
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <ApplicationLayout>
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 scroll-smooth">
      <motion.div
        className="max-w-6xl mx-auto px-6 py-8 space-y-8"
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

          <CardContent className="relative p-8 lg:p-12 text-white">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative"
              >
                <Avatar className="w-40 h-40 border-4 border-white shadow-2xl">
                  <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-5xl font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </motion.div>

              {/* Informações principais */}
              <div className="flex-1 text-center lg:text-left space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2">{user.name}</h1>
                  <p className="text-xl lg:text-2xl text-white/90 font-medium">Contratante</p>
                </motion.div>

                {/* Badges de estatísticas */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-3"
                >
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Eye className="w-4 h-4 mr-2" />
                    {demands.length} demandas ativas
                  </Badge>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-all duration-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Membro desde {formatDate(user.createdAt)}
                  </Badge>
                </motion.div>

                {/* Botões de ação rápida */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-3 pt-4"
                >
                  <Button
                    onClick={() => setLocation(`/messages?userId=${user.id}`)}
                    className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white text-orange-600 hover:bg-white hover:text-orange-600 font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Favoritar
                  </Button>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sobre mim - Removido para contratante */}

            {/* Demandas */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    Demandas Publicadas
                    <Badge className="bg-orange-100 text-orange-700 ml-auto">
                      {demands.length} {demands.length === 1 ? 'demanda' : 'demandas'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingDm ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-300 border-t-orange-600"></div>
                    </div>
                  ) : demands.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-12 w-12 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma demanda publicada</h3>
                      <p className="text-slate-500">Este contratante ainda não publicou nenhuma demanda.</p>
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
                          <Card className="border border-white/30 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] bg-white/60 backdrop-blur-sm rounded-2xl">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <h3 className="font-bold text-xl text-slate-800 mb-2">{d.title}</h3>
                                  <p className="text-slate-600 leading-relaxed mb-4">
                                    {d.description}
                                  </p>
                                  <div className="flex items-center text-sm text-slate-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    Publicada em {formatDate(d.created_at)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center text-2xl font-bold text-green-600 mb-2">
                                      R$ {parseFloat(d.price as any).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105"
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
            {/* Informações de contato */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    Informações de Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                    <Mail className="w-5 h-5 text-orange-600" />
                    <span className="text-slate-700 font-medium">{user.email}</span>
                  </div>
                  <Separator className="bg-orange-100" />
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="text-slate-700 font-medium">Membro desde</span>
                      <p className="text-sm text-slate-500">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Estatísticas */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">
                        {demands.length}
                      </div>
                      <div className="text-sm text-slate-500">Demandas Publicadas</div>
                    </div>
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
                <CardContent className="p-6 space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    onClick={() => setLocation(`/messages?userId=${user.id}`)}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Enviar Mensagem
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    <Heart className="w-5 h-5 mr-2" /> 
                    Favoritar Perfil
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105"
                    onClick={() => setLocation("/home")}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" /> 
                    Voltar ao Início
                  </Button>
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
