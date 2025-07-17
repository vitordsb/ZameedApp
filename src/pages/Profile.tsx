
// src/pages/Profile.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AplicationLayout from "@/components/layouts/ApplicationLayout"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DemandsManager from "@/components/DemandsManager";
import {
  Loader2,
  Edit2,
  Check,
  X,
  LogOut,
  AlertCircle,
  User,
  MapPin,
  Briefcase,
  FileText,
  DollarSign,
  Calendar,
  Star,
  Plus,
  Save,
  Upload,
  Image as ImageIcon,
  Grid3X3,
  Trash2,
} from "lucide-react";

type FieldKey =
  | "name"
  | "about"
  | "cpf"
  | "cnpj"
  | "endereco"
  | "experience"
  | "profession"

interface Service {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: string; // vem como string "180.00"
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
  rating_mid: string;
  created_at: string;
  updated_at: string;
}

interface PortfolioItem {
  id: number;
  image_id: number;
  user_id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ImageItem {
  id: number;
  user_id: number;
  image_url: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Estado dos campos de edição do perfil
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [draftValue, setDraftValue] = useState("");

  // Estados de serviço
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [errorServices, setErrorServices] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftSvc, setDraftSvc] = useState<{
    title: string;
    description: string;
    price: string;
  }>({ title: "", description: "", price: "" });

  // Estados para criação de novo serviço
  const [isCreating, setIsCreating] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [newService, setNewService] = useState<{
    title: string;
    description: string;
    price: string;
  }>({ title: "", description: "", price: "" });

  // Estados para portfólio
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  
  // Estados para o processo de upload em duas etapas
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  // Estados para criação do item do portfólio (segunda etapa)
  const [isCreatingPortfolioItem, setIsCreatingPortfolioItem] = useState(false);
  const [creatingPortfolioItem, setCreatingPortfolioItem] = useState(false);
  const [portfolioItemData, setPortfolioItemData] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });

  // Formatação CPF/CNPJ
  const formatCPF = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    return d.length === 11
      ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
      : raw;
  };
  const formatCNPJ = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    return d.length === 14
      ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(
          8,
          12
        )}-${d.slice(12)}`
      : raw;
  };

  // Dados estáticos do perfil
  const profileFields = useMemo(() => {
    if (!user) return [];
    const base = [
      {
        key: "name" as const,
        label: "Nome Completo",
        value: user.name,
        editable: true,
        icon: User,
      },
      {
        key: "endereco" as const,
        label: "Endereço",
        value: (user as any).endereco || "Não informado",
        editable: true,
        icon: MapPin,
      },
      {
        key: "experience" as const,
        label: "Experiência Profissional",
        value: (user as any).experience || "Não informado",
        editable: true,
        icon: Star,
      },
    ];

    // Adiciona campos específicos para prestadores
    if (user.type === "prestador") {
      base.push(
        {
          key: "profession" as FieldKey,
          label: "Profissão",
          value: (user as any).profession || "Não informado",
          editable: true,
          icon: Briefcase,
        },
        {
          key: "about" as FieldKey,
          label: "Sobre Mim",
          value: (user as any).about || "Conte um pouco sobre você...",
          editable: true,
          icon: User,
        }
      );
    }

    return base;
  }, [user]);

  // 1) Carrega serviços na montagem (só se for prestador)
  useEffect(() => {
    if (user?.type !== "prestador") return;
    loadServices();
    loadPortfolio();
  }, [user]);

  // Função para carregar serviços
  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const res = await apiRequest("GET", "/servicesfreelancer");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }
      const body = await res.json();
      setServices(Array.isArray(body.servicesFreelancer) ? body.servicesFreelancer : []);
      setErrorServices(null);
    } catch (err: any) {
      setErrorServices(err.message);
    } finally {
      setLoadingServices(false);
    }
  };

  // Função para carregar portfólio
  const loadPortfolio = async () => {
    if (!user) return;
    
    setLoadingPortfolio(true);
    try {
      console.log("Carregando portfólio para usuário:", user.id); // Debug
      
      // Buscar portfólio
      const portfolioRes = await apiRequest("GET", `/portfolio?user=${user.id}`);
      console.log("Portfolio response status:", portfolioRes.status); // Debug
      
      if (portfolioRes.ok) {
        try {
          const portfolioData = await portfolioRes.json();
          console.log("Portfolio data:", portfolioData); // Debug
          
          // CORREÇÃO: Acessar portfolioData.posts em vez de portfolioData diretamente
          const portfolioItems = portfolioData.posts || portfolioData;
          console.log("Portfolio items:", portfolioItems); // Debug
          
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
      const imagesRes = await apiRequest("GET", `/upload/images?user=${user.id}`);
      console.log("Images response status:", imagesRes.status); // Debug
      
      if (imagesRes.ok) {
        try {
          const imagesData = await imagesRes.json();
          console.log("Images data:", imagesData); // Debug
          
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
    console.log("Buscando imagem com ID:", imageId); // Debug
    console.log("Imagens disponíveis:", images); // Debug
    
    const image = images.find(img => img.id === imageId);
    console.log("Imagem encontrada:", image); // Debug
    
    if (image?.image_path) {
      // Construir URL completa baseada no backend
      const baseUrl = "https://zameed-backend.onrender.com"; // Ajuste conforme necessário
      const imageUrl = image.image_path.startsWith('http') 
        ? image.image_path 
        : `${baseUrl}/${image.image_path}`;
      
      console.log("URL final da imagem:", imageUrl); // Debug
      return imageUrl;
    }
    
    console.log("Imagem não encontrada, usando placeholder"); // Debug
    return "/placeholder-image.jpg";
  };

  // Edição de campo de perfil
  const startEditField = (key: FieldKey, current: string) => {
    setEditingField(key);
    setDraftValue(current === "Não informado" || current === "Conte um pouco sobre você..." ? "" : current);
  };
  
  const cancelEditField = () => {
    setEditingField(null);
  };
  
  const saveField = async () => {
    if (!editingField || !user) return;
    try {
      // Para campos de usuário (profession e about), usa o endpoint de usuários
      if (editingField === "profession" || editingField === "about") {
        const payload: any = {};
        payload[editingField] = draftValue;
        
        await apiRequest("PUT", `/users/${user.id}`, payload);
      } else {
        // Para outros campos, usa o endpoint de providers
        await apiRequest("PUT", `/providers/${user.id}`, {
          [editingField]: draftValue,
        });
      }
      
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Criação de novo serviço
  const startCreating = () => {
    setIsCreating(true);
    setNewService({ title: "", description: "", price: "" });
  };
  const cancelCreating = () => {
    setIsCreating(false);
    setNewService({ title: "", description: "", price: "" });
  };
  const createService = async () => {
    if (!newService.title || !newService.description || !newService.price) {
      toast({ 
        title: "Erro", 
        description: "Preencha todos os campos obrigatórios.", 
        variant: "destructive" 
      });
      return;
    }

    setCreatingService(true);
    try {
      const payload = {
        title: newService.title,
        description: newService.description,
        price: parseFloat(newService.price),
      };
      
      const res = await apiRequest("POST", "/servicesfreelancer", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }
      
      toast({ title: "Sucesso", description: "Serviço criado com sucesso!" });
      setIsCreating(false);
      setNewService({ title: "", description: "", price: "" });
      // Recarrega a lista de serviços
      await loadServices();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreatingService(false);
    }
  };

  // Edição de serviço
  const startEditSvc = (svc: Service) => {
    setEditingId(svc.id_serviceFreelancer);
    setDraftSvc({
      title: svc.title,
      description: svc.description,
      price: svc.price,
    });
  };
  const cancelEditSvc = () => {
    setEditingId(null);
  };
  const saveSvc = async () => {
    if (editingId == null) return;
    try {
      const payload = {
        title: draftSvc.title,
        description: draftSvc.description,
        price: parseFloat(draftSvc.price),
      };
      const res = await apiRequest("PUT", `/servicesfreelancer/${editingId}`, payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }
      toast({ title: "Sucesso", description: "Serviço atualizado com sucesso!" });
      setEditingId(null);
      // Recarrega a lista de serviços
      await loadServices();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Funções do portfólio - ETAPA 1: Upload da imagem
  const startImageUpload = () => {
    setIsUploadingImage(true);
    setUploadedImageId(null);
    setUploadedImageUrl(null);
  };

  const cancelImageUpload = () => {
    setIsUploadingImage(false);
    setUploadedImageId(null);
    setUploadedImageUrl(null);
  };

  const handleImageUpload = async (file: File) => {
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'portfolio');

      const uploadRes = await apiRequest("POST", "/upload", formData);

      if (!uploadRes.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const uploadData = await uploadRes.json();
      
      // Salvar o ID e URL da imagem - CORRIGIDO: acessar userImage.id
      const imageId = uploadData.userImage?.id || uploadData.id;
      const imageUrl = uploadData.userImage?.image_path || uploadData.image_url;
      
      setUploadedImageId(imageId);
      setUploadedImageUrl(imageUrl || URL.createObjectURL(file));
      
      console.log("Upload data:", uploadData); // Debug
      console.log("Image ID:", imageId); // Debug
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso! Agora adicione o título e descrição."
      });

      // Avançar para a segunda etapa
      setIsUploadingImage(false);
      setIsCreatingPortfolioItem(true);

    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // ETAPA 2: Criação do item do portfólio
  const cancelPortfolioItemCreation = () => {
    setIsCreatingPortfolioItem(false);
    setPortfolioItemData({ title: "", description: "" });
    setUploadedImageId(null);
    setUploadedImageUrl(null);
  };

  const createPortfolioItem = async () => {
    if (!portfolioItemData.title || !uploadedImageId) {
      toast({
        title: "Erro",
        description: "Título é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    setCreatingPortfolioItem(true);
    try {
      const portfolioPayload = {
        image_id: uploadedImageId,
        title: portfolioItemData.title,
        description: portfolioItemData.description || ""
      };

      const portfolioRes = await apiRequest("POST", "/portfolio", portfolioPayload);

      if (!portfolioRes.ok) {
        throw new Error("Erro ao criar item do portfólio");
      }

      toast({
        title: "Sucesso",
        description: "Item adicionado ao portfólio com sucesso!"
      });

      // Resetar estados
      setIsCreatingPortfolioItem(false);
      setPortfolioItemData({ title: "", description: "" });
      setUploadedImageId(null);
      setUploadedImageUrl(null);
      
      // Recarregar portfólio
      await loadPortfolio();

    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setCreatingPortfolioItem(false);
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      // O backend retorna datas no formato "2025-07-17T13:20:17.000Z"
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn("Data inválida:", dateString);
        return "Data inválida";
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString);
      return "Data inválida";
    }
  };

  // — render —

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-600 w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <AplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header do Perfil */}
          <div className="relative">
            <Card className="shadow-xl border-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <CardContent className="relative p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <Avatar className="w-24 h-24 border-4 border-white/20 shadow-lg">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {user.type === "prestador" ? "Prestador de Serviços" : "Contratante"}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        <Calendar className="w-3 h-3 mr-1" />
                        Membro desde 2024
                      </Badge>
                    </div>
                    <p className="text-white/90 text-lg">
                      {(user as any).about || "Bem-vindo ao seu perfil! Complete suas informações para uma melhor experiência."}
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={logout}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfólio do prestador - POSICIONADO APÓS O HEADER E ANTES DAS INFORMAÇÕES */}
          {user.type === "prestador" && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Grid3X3 className="w-6 h-6 text-amber-600" />
                    Meu Portfólio
                  </CardTitle>
                  {!isUploadingImage && !isCreatingPortfolioItem && (
                    <Button 
                      onClick={startImageUpload}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Projeto
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* ETAPA 1: Upload da imagem */}
                {isUploadingImage && (
                  <Card className="mb-6 border-2 border-amber-200 bg-amber-50/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-800">Etapa 1: Enviar Imagem do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                          Selecione a imagem do projeto *
                        </label>
                        <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            className="hidden"
                            id="image-upload-input"
                            disabled={uploadingImage}
                          />
                          <label
                            htmlFor="image-upload-input"
                            className={`cursor-pointer flex flex-col items-center gap-2 ${uploadingImage ? 'opacity-50' : ''}`}
                          >
                            {uploadingImage ? (
                              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            ) : (
                              <Upload className="w-8 h-8 text-amber-500" />
                            )}
                            <span className="text-sm text-slate-600">
                              {uploadingImage ? "Enviando imagem..." : "Clique para selecionar uma imagem"}
                            </span>
                            <span className="text-xs text-slate-400">
                              Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={cancelImageUpload}
                          className="flex-1 border-slate-300 hover:bg-slate-50"
                          disabled={uploadingImage}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ETAPA 2: Adicionar título e descrição */}
                {isCreatingPortfolioItem && uploadedImageId && (
                  <Card className="mb-6 border-2 border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-green-800">Etapa 2: Adicionar Informações do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Preview da imagem enviada */}
                      {uploadedImageUrl && (
                        <div className="mb-4">
                          <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Imagem enviada:
                          </label>
                          <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-green-300">
                            <img
                              src={uploadedImageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                          Título do Projeto *
                        </label>
                        <Input
                          value={portfolioItemData.title}
                          onChange={(e) => setPortfolioItemData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Projeto de design de interiores"
                          className="border-green-200 focus:border-green-400 focus:ring-green-400"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                          Descrição (opcional)
                        </label>
                        <Textarea
                          value={portfolioItemData.description}
                          onChange={(e) => setPortfolioItemData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o projeto, técnicas utilizadas, resultados obtidos... (opcional)"
                          className="min-h-[100px] resize-none border-green-200 focus:border-green-400 focus:ring-green-400"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={cancelPortfolioItemCreation}
                          className="flex-1 border-slate-300 hover:bg-slate-50"
                          disabled={creatingPortfolioItem}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button 
                          onClick={createPortfolioItem}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={creatingPortfolioItem}
                        >
                          {creatingPortfolioItem ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {creatingPortfolioItem ? "Salvando..." : "Salvar Projeto"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loadingPortfolio ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-amber-600 w-8 h-8 mr-3" />
                    <span className="text-slate-600">Carregando portfólio...</span>
                  </div>
                ) : portfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum projeto no portfólio</h3>
                    <p className="text-slate-500 mb-4">Adicione seus primeiros projetos para mostrar seu trabalho aos clientes.</p>
                    {!isUploadingImage && !isCreatingPortfolioItem && (
                      <Button 
                        onClick={startImageUpload}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Projeto
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {console.log("Renderizando portfólio com", portfolio.length, "itens:", portfolio)}
                    {/* Mostrar apenas os 3 últimos itens, ordenados por data de criação */}
                    {portfolio
                      .sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
                      .slice(0, 3)
                      .map((item) => {
                        console.log("Renderizando item:", item);
                        const imageUrl = getImageUrl(item.image_id);
                        console.log("URL da imagem para item", item.id, ":", imageUrl);
                        
                        return (
                          <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 border-slate-200 overflow-hidden">
                            <div className="aspect-video bg-gradient-to-br from-amber-100 to-amber-200 relative overflow-hidden">
                              <img
                                src={imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  console.log("Erro ao carregar imagem:", imageUrl);
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder-image.jpg";
                                }}
                                onLoad={() => {
                                  console.log("Imagem carregada com sucesso:", imageUrl);
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-3">
                                {item.description || "Sem descrição"}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-xs text-slate-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(item.createdAt || item.created_at)}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Layout principal com sidebar */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Conteúdo principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações do Perfil */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <User className="w-6 h-6 text-amber-600" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileFields.map((f, index) => {
                    const isEditing = editingField === f.key;
                    const Icon = f.icon;
                    
                    return (
                      <div key={f.key}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="group">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-50 rounded-lg">
                              <Icon className="w-5 h-5 text-amber-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                  {f.label}
                                </label>
                                {f.editable && !isEditing && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => startEditField(f.key, String(f.value))}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              
                              {isEditing ? (
                                <div className="space-y-3">
                                  {f.key === "about" ? (
                                    <Textarea
                                      value={draftValue}
                                      onChange={(e) => setDraftValue(e.target.value)}
                                      className="min-h-[100px] resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                      placeholder="Conte um pouco sobre você, suas habilidades e experiências..."
                                    />
                                  ) : (
                                    <Input
                                      value={draftValue}
                                      onChange={(e) => setDraftValue(e.target.value)}
                                      className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                      placeholder={`Digite seu ${f.label.toLowerCase()}`}
                                    />
                                  )}
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={cancelEditField}
                                      className="border-slate-300 hover:bg-slate-50"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Cancelar
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={saveField}
                                      className="bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Salvar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-800 text-lg leading-relaxed">
                                  {f.value}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar com estatísticas */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-3xl font-bold text-amber-600">
                      {user.type === "prestador" ? services.length : "0"}
                    </div>
                    <div className="text-sm text-slate-600">
                      {user.type === "prestador" ? "Serviços Ativos" : "Demandas Ativas"}
                    </div>
                  </div>
                  
                  {user.type === "prestador" && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{portfolio.length}</div>
                      <div className="text-sm text-slate-600">Projetos no Portfólio</div>
                    </div>
                  )}
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">4.8</div>
                    <div className="text-sm text-slate-600">Avaliação Média</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <div className="text-sm text-slate-600">Taxa de Conclusão</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Demandas do contratante */}
          {user.type === "contratante" && <DemandsManager />}

          {/* Serviços do freelancer */}
          {user.type === "prestador" && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-amber-600" />
                    Meus Serviços
                  </CardTitle>
                  {!isCreating && (
                    <Button 
                      onClick={startCreating}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Serviço
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Formulário de criação de serviço */}
                {isCreating && (
                  <Card className="mb-6 border-2 border-amber-200 bg-amber-50/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-amber-800">Criar Novo Serviço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                          Título do Serviço *
                        </label>
                        <Input
                          value={newService.title}
                          onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: Instalação de ventilador de teto"
                          className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                          Descrição *
                        </label>
                        <Textarea
                          value={newService.description}
                          onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva detalhadamente o serviço que você oferece..."
                          className="min-h-[100px] resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                          Preço (R$) *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newService.price}
                          onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="180.00"
                          className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={cancelCreating}
                          className="flex-1 border-slate-300 hover:bg-slate-50"
                          disabled={creatingService}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button 
                          onClick={createService}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                          disabled={creatingService}
                        >
                          {creatingService ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {creatingService ? "Criando..." : "Criar Serviço"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loadingServices ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-amber-600 w-8 h-8 mr-3" />
                    <span className="text-slate-600">Carregando serviços...</span>
                  </div>
                ) : errorServices ? (
                  <div className="flex items-center justify-center py-12 text-red-600">
                    <AlertCircle className="w-6 h-6 mr-2" />
                    <span>Erro ao carregar serviços: {errorServices}</span>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum serviço cadastrado</h3>
                    <p className="text-slate-500 mb-4">Cadastre seus primeiros serviços para começar a receber clientes.</p>
                    {!isCreating && (
                      <Button 
                        onClick={startCreating}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Primeiro Serviço
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {services.map((svc) => {
                      const isEditingSvc = svc.id_serviceFreelancer === editingId;
                      
                      return (
                        <Card key={svc.id_serviceFreelancer} className="group hover:shadow-lg transition-all duration-200 border-slate-200">
                          <CardContent className="p-6">
                            {isEditingSvc ? (
                              <div className="space-y-4">
                                <Input
                                  value={draftSvc.title}
                                  onChange={(e) =>
                                    setDraftSvc((d) => ({ ...d, title: e.target.value }))
                                  }
                                  placeholder="Título do serviço"
                                  className="font-semibold border-amber-200 focus:border-amber-400"
                                />
                                <Textarea
                                  value={draftSvc.description}
                                  onChange={(e) =>
                                    setDraftSvc((d) => ({ ...d, description: e.target.value }))
                                  }
                                  placeholder="Descrição do serviço"
                                  className="min-h-[80px] resize-none border-amber-200 focus:border-amber-400"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={draftSvc.price}
                                  onChange={(e) =>
                                    setDraftSvc((d) => ({ ...d, price: e.target.value }))
                                  }
                                  placeholder="Preço"
                                  className="border-amber-200 focus:border-amber-400"
                                />
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={cancelEditSvc}
                                    className="flex-1"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={saveSvc}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <h3 className="text-lg font-bold text-slate-800 line-clamp-2 flex-1">
                                    {svc.title}
                                  </h3>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 ml-2"
                                    onClick={() => startEditSvc(svc)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <p className="text-slate-600 line-clamp-3 leading-relaxed">
                                  {svc.description}
                                </p>
                                
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                  <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                                    <DollarSign className="w-5 h-5" />
                                    R$ {parseFloat(svc.price).toFixed(2)}
                                  </div>
                                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                                    Ativo
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AplicationLayout> 
  );
}
