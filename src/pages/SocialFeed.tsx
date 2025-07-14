
// src/pages/SocialFeed.tsx
import { useState, useMemo } from "react";
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

export default function SocialFeed() {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const { user: currentUser } = useAuth();

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

  // 3) Combina providers + users
  const combined = useMemo(() => {
    if (loadingProv || loadingUsers) return [];
    return providers
      .map((provider) => {
        const user = userQueries.find((q) => q.data?.id === provider.user_id)?.data;
        return user ? { provider, user } : null;
      })
      .filter((x): x is { provider: Provider; user: User } => !!x);
  }, [providers, userQueries, loadingProv, loadingUsers]);

  // 4) Filtra apenas prestadores + aplica filtros de busca, serviço, avaliação
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
          const matchRating =
            !ratingFilter || provider.rating_mid >= Number(ratingFilter);
          return matchSearch && matchService && matchRating;
        }),
    [combined, search, serviceFilter, ratingFilter]
  );

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {/* Rating */}
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="pl-10 w-full border p-2 rounded focus:border-amber-500"
                    >
                      <option value="">Avaliação mínima</option>
                      {["3", "4", "4.5"].map((r) => (
                        <option key={r} value={r}>
                          {r}+ estrelas
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(search || locationFilter || serviceFilter || ratingFilter) && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filtros ativos:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setLocationFilter("");
                        setServiceFilter("");
                        setRatingFilter("");
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
              <Card className="shadow-lg hover:shadow-2xl transition">
                <CardHeader className="flex items-center gap-4 p-6 bg-amber-50">
                  <Avatar className="w-16 h-16 ring-4 ring-white">
                    <AvatarFallback>{user.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl font-bold">{user.name}</CardTitle>
                    <Badge className="mt-1 bg-amber-100 text-amber-800">
                      {provider.profession}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <p>
                    <strong>E-mail:</strong> {user.email}
                  </p>
                  {user.cnpj && (
                    <p>
                      <strong>CNPJ:</strong> {user.cnpj}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4 text-amber-600" />{" "}
                    {provider.rating_mid} 
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" /> Cidade ID: {user.cidade_id}
                  </div>
                </CardContent>
                <CardDescription className="px-6 pb-4 text-gray-700">
                  {provider.about ?? "— sem descrição —"}
                </CardDescription>
                <div className="px-6 pb-6 flex gap-2">
                  <Link href={`/providers/${provider.provider_id}`}>
                    <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                      Ver Perfil
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}              </div>
            </section>

            {/* Sidebar */}
            <aside className="space-y-6">
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

              {/* Destaques */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <Card className="shadow-lg border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                      <CardTitle className="text-amber-900">
                        Destaques da Semana
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        id: 1,
                        titulo: "Projeto Residencial Premium",
                        descricao: "20% de desconto...",
                      },
                      {
                        id: 2,
                        titulo: "Consultoria Gratuita",
                        descricao: "Primeira consulta sem custo.",
                      },
                      {
                        id: 3,
                        titulo: "Pacote Comercial",
                        descricao: "Soluções para ambientes corporativos.",
                      },
                    ].map((a) => (
                      <div
                        key={a.id}
                        className="p-3 bg-amber-50 rounded-lg border border-amber-100"
                      >
                        <h4 className="font-semibold text-amber-900 mb-1 text-sm">
                          {a.titulo}
                        </h4>
                        <p className="text-amber-700 text-xs">{a.descricao}</p>
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

