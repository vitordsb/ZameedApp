
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ApplicationLayout from "@/components/layouts/ApplicationLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Tag,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// shape de ServiceFreelancer conforme Swagger
export interface ServiceFreelancer {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export default function ServicesFeed() {
  // filtros e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  // 1) Busca serviços via API
  const {
    data: services,
    isLoading,
    isError,
  } = useQuery<ServiceFreelancer[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/servicesfreelancer", );
      if (!res.ok) throw new Error("Erro ao buscar serviços");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2) Filtra e ordena
  const filtered = useMemo(() => {
    if (!services) return [];
    let list = services.filter(s =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    switch (sortBy) {
      case "newest":
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "priceAsc":
        return list.sort((a, b) => a.price - b.price);
      case "priceDesc":
        return list.sort((a, b) => b.price - a.price);
    }
  }, [services, searchTerm, sortBy]);

  // 3) Paginação
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (isLoading) return <ApplicationLayout><div>Carregando serviços...</div></ApplicationLayout>;
  if (isError || !services) return <ApplicationLayout><div>Erro ao carregar serviços.</div></ApplicationLayout>;

  return (
    <ApplicationLayout>
      <div className="space-y-6">
        {/* Barra de busca e filtros */}
        <div className="flex gap-4">
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => setSortBy(sortBy === 'priceAsc' ? 'priceDesc' : 'priceAsc')}>
            {sortBy === 'newest' ? <SortDesc /> : sortBy === 'priceAsc' ? <SortDesc /> : <SortAsc />} Ordem
          </Button>
          <Button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List /> : <Grid3X3 />}
          </Button>
        </div>

        {/* Lista de serviços */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {paginated.map(service => (
            <Card key={service.id_serviceFreelancer} className="hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  <Link href={`servicefreelancer/${service.id_serviceFreelancer}`}>
                    {service.title}
                  </Link>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  R$ {service.price.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-gray-700">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}

