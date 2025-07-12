
import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Briefcase, Eye, MessageCircle, ArrowLeft } from "lucide-react";

interface ProviderEnvelope {
  code: number;
  provider: ProviderApi;
  message: string;
  success: boolean;
}
export interface ProviderApi {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
  rating_mid: string;
  created_at: string;
  updated_at: string;
}

interface UserEnvelope {
  code: number;
  user: UserApi;
  message: string;
  success: boolean;
}
export interface UserApi {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  // …demais campos
}

export default function ProviderProfile() {
  const { provider_id} = useParams<{ provider_id: string }>();
  const [, setLocation] = useLocation();

  const { data: provEnv, isLoading: loadingProv, isError: errProv } = useQuery<ProviderEnvelope>({
    queryKey: ["provider", provider_id],
    enabled: !!provider_id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/providers/${userId}`);
      if (!res.ok) throw new Error(`Provider não encontrado (${res.status})`);
      return res.json();
    },
  });
  const provider = provEnv?.provider;
  const providerUserId = provider?.user_id?.toString();

  const { data: userEnv, isLoading: loadingUser, isError: errUser } = useQuery<UserEnvelope>({
    queryKey: ["user", providerUserId],
    enabled: !!providerUserId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/users/${providerUserId}`);
      if (!res.ok) throw new Error(`Usuário não encontrado (${res.status})`);
      return res.json();
    },
  });
  const user = userEnv?.user;

  if (loadingProv || loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Button variant="ghost" disabled>
          Carregando...
        </Button>
      </div>
    );
  }
  if (errProv || errUser || !provider || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Erro ao carregar perfil.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      {/* Perfil Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-700 to-amber-500 p-6 text-white flex flex-col md:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 ring-4 ring-white">
            <AvatarFallback className="bg-amber-300 text-white text-3xl font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-sm opacity-80 mb-2">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/20 text-white px-3 py-1">{provider.profession}</Badge>
              <Badge className="bg-white/20 text-white px-3 py-1 flex items-center gap-1">
                <Star className="w-4 h-4" /> {provider.rating_mid}
              </Badge>
            </div>
            <p className="mt-2 text-white text-sm opacity-70">
              Membro desde: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-gray-700 leading-relaxed">{provider.about ?? "Sem descrição disponível."}</p>
        </CardContent>
      </Card>

      {/* Estatísticas e Detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase /> Profissão
            </CardTitle>
          </CardHeader>
          <CardContent>{provider.profession}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin /> Localização
            </CardTitle>
          </CardHeader>
          <CardContent>—</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star /> Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>{provider.rating_mid} ★ média</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye /> Visualizações
            </CardTitle>
          </CardHeader>
          <CardContent>{provider.views_profile} vezes</CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Provider ID:</strong> {provider.provider_id}</li>
            <li><strong>User ID:</strong> {provider.user_id}</li>
            <li><strong>Criado em:</strong> {new Date(provider.created_at).toLocaleDateString('pt-BR')}</li>
            <li><strong>Atualizado em:</strong> {new Date(provider.updated_at).toLocaleDateString('pt-BR')}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardFooter className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/home")}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button
            onClick={() => setLocation(`/messages?userId=${user.id}`)}
            className="flex items-center gap-1"
          >
            <MessageCircle className="w-4 h-4" /> Mensagem
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

