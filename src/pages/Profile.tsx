
// src/pages/Profile.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AplicationLayout from "@/components/layouts/ApplicationLayout"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import DemandsManager from "@/components/DemandsManager";
import PortfolioModal from "@/components/PortfolioModal";
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
  CreditCard,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

type FieldKey =
  | "name"
  | "about"
  | "cpf"
  | "cnpj"
  | "endereco"
  | "experience"
  | "profession"
  | "cep"
  | "estado"
  | "cidade"
  | "bairro"
  | "rua"
  | "numero"

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
  image_path: string; 
  image_url: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressData {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Estado dos campos de edição do perfil
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [draftValue, setDraftValue] = useState("");

  // Estados para endereço
  const [addressData, setAddressData] = useState<AddressData>({
    cep: "",
    estado: "",
    cidade: "",
    bairro: "",
    rua: "",
    numero: "",
  });
  const [loadingCep, setLoadingCep] = useState(false);

  // Estados para dados pessoais
  const [personalData, setPersonalData] = useState({
    cpf: "",
    cnpj: "",
  });

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
  
  // Estados para o modal do portfólio
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para o processo de upload em duas etapas
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Estados para criação do item do portfólio (segunda etapa)
  const [isCreatingPortfolioItem, setIsCreatingPortfolioItem] = useState(false);
  const [creatingPortfolioItem, setCreatingPortfolioItem] = useState(false);
  const [portfolioItemData, setPortfolioItemData] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });

  // Estados para postagem de demanda
  const [newDemand, setNewDemand] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const [postingDemand, setPostingDemand] = useState(false);

  // Estado para taxa de conclusão
  const [completionRate, setCompletionRate] = useState(0);

  // Estado para dados do provider
  const [providerData, setProviderData] = useState<Provider | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(false);

  // Função para postar demanda
  const handlePostDemand = async () => {
    if (!user || user.type === "prestador") return;
    if (!newDemand.title || !newDemand.description) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, preencha o título e a descrição da demanda.",
        variant: "destructive",
      });
      return;
    }

    setPostingDemand(true);
    try {
      const payload = { ...newDemand, user_id: user.id };
      const res = await apiRequest("POST", "/demands", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }
      toast({
        title: "Sucesso",
        description: "Demanda postada com sucesso!",
      });
      setNewDemand({ title: "", description: "" });
    } catch (err: any) {
      toast({
        title: "Erro ao postar demanda",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPostingDemand(false);
    }
  };

  // Máscaras de formatação
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  // Buscar endereço via ViaCEP
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado e tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setAddressData(prev => ({
        ...prev,
        cep: formatCEP(cleanCep),
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));

      toast({
        title: "Endereço encontrado!",
        description: "Dados do endereço preenchidos automaticamente.",
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  // Função para buscar dados do provider
  const loadProviderData = async () => {
    if (!user || user.type !== "prestador") return;
    
    setLoadingProvider(true);
    try {
      // Primeiro buscar todos os providers para encontrar o provider_id do usuário atual
      const providersRes = await apiRequest("GET", "/providers");
      if (!providersRes.ok) {
        throw new Error("Erro ao buscar providers");
      }
      
      const providersData = await providersRes.json();
      const userProvider = providersData.providers?.find((p: Provider) => p.user_id === user.id);
      
      if (userProvider) {
        setProviderData(userProvider);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do provider:", error);
    } finally {
      setLoadingProvider(false);
    }
  };

  // Calcular taxa de conclusão
  const calculateCompletionRate = () => {
    const fields = [
      user?.name,
      personalData.cpf,
      addressData.cep,
      addressData.numero,
    ];

    // Adicionar campos específicos para prestadores
    if (user?.type === "prestador" && providerData) {
      fields.push(providerData.profession, providerData.about);
    }

    const filledFields = fields.filter(field => field && field.trim() !== "").length;
    const totalFields = fields.length;
    
    return Math.round((filledFields / totalFields) * 100);
  };

  // Atualizar taxa de conclusão quando dados mudarem
  useEffect(() => {
    setCompletionRate(calculateCompletionRate());
  }, [personalData, addressData, user, providerData]);

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
        key: "cpf" as const,
        label: "CPF",
        value: personalData.cpf || "Não informado",
        editable: true,
        icon: CreditCard,
        mask: true,
      },
      {
        key: "cnpj" as const,
        label: "CNPJ",
        value: personalData.cnpj || "Não informado",
        editable: true,
        icon: CreditCard,
        mask: true,
      },
      {
        key: "cep" as const,
        label: "CEP",
        value: addressData.cep || "Não informado",
        editable: true,
        icon: MapPin,
        mask: true,
      },
      {
        key: "endereco" as const,
        label: "Endereço Completo",
        value: addressData.rua && addressData.numero 
          ? `${addressData.rua}, ${addressData.numero} - ${addressData.bairro}, ${addressData.cidade}/${addressData.estado}`
          : "Não informado",
        editable: false,
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
    if (user.type === "prestador" && providerData) {
      base.push(
        {
          key: "profession" as FieldKey,
          label: "Profissão",
          value: providerData.profession || "Não informado",
          editable: true,
          icon: Briefcase,
        },
        {
          key: "about" as FieldKey,
          label: "Sobre Mim",
          value: providerData.about || "Conte um pouco sobre você...",
          editable: true,
          icon: User,
        }
      );
    }

    return base;
  }, [user, personalData, addressData, providerData]);

  // 1) Carrega serviços na montagem (só se for prestador)
  useEffect(() => {
    if (user?.type !== "prestador") return;
    loadServices();
    loadPortfolio();
    loadProviderData();
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

  // Função para obter URL da imagem
  const getImageUrl = (imageId: number) => {
    const image = images.find(img => img.id === imageId);
    return image ? image.image_url : null;
  };

  // Funções do modal do portfólio
  const openPortfolioModal = (item: PortfolioItem) => {
    setSelectedPortfolioItem(item);
    setIsModalOpen(true);
  };

  const closePortfolioModal = () => {
    setSelectedPortfolioItem(null);
    setIsModalOpen(false);
  };

  // Função para lidar com mudança de arquivo
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Função para upload de imagem
  const handleUploadImage = async () => {
    if (!selectedFile || !user) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('user_id', user.id.toString());

      const res = await apiRequest("POST", "/upload/image", formData, {
        'Content-Type': 'multipart/form-data'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }

      const result = await res.json();
      setUploadedImageId(result.image.id);
      setUploadedImageUrl(result.image.image_url);
      
      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      });

      // Fechar modal de upload e abrir modal de criação de item
      setIsUploadingImage(false);
      setIsCreatingPortfolioItem(true);
    } catch (err: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Função para criar item do portfólio
  const handleCreatePortfolioItem = async () => {
    if (!user || !uploadedImageId || !portfolioItemData.title || !portfolioItemData.description) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, preencha o título e a descrição.",
        variant: "destructive",
      });
      return;
    }

    setCreatingPortfolioItem(true);
    try {
      const payload = {
        image_id: uploadedImageId,
        user_id: user.id,
        title: portfolioItemData.title,
        description: portfolioItemData.description,
      };

      const res = await apiRequest("POST", "/portfolio", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }

      toast({
        title: "Sucesso",
        description: "Item de destaque criado com sucesso!",
      });

      // Resetar estados
      setIsCreatingPortfolioItem(false);
      setUploadedImageId(null);
      setUploadedImageUrl(null);
      setSelectedFile(null);
      setPortfolioItemData({ title: "", description: "" });

      // Recarregar portfólio
      loadPortfolio();
    } catch (err: any) {
      toast({
        title: "Erro ao criar item de destaque",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreatingPortfolioItem(false);
    }
  };

  // Função para criar serviço
  const handleCreateService = async () => {
    if (!user || !newService.title || !newService.description || !newService.price) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, preencha todos os campos do serviço.",
        variant: "destructive",
      });
      return;
    }

    setCreatingService(true);
    try {
      const payload = {
        title: newService.title,
        description: newService.description,
        price: parseFloat(newService.price),
        user_id: user.id,
      };

      const res = await apiRequest("POST", "/servicesfreelancer", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }

      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso!",
      });

      setNewService({ title: "", description: "", price: "" });
      setIsCreating(false);
      loadServices();
    } catch (err: any) {
      toast({
        title: "Erro ao criar serviço",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreatingService(false);
    }
  };

  // Função para iniciar edição de campo
  const startEditField = (key: FieldKey, currentValue: string) => {
    setEditingField(key);
    setDraftValue(currentValue === "Não informado" ? "" : currentValue);
  };

  // Função para salvar campo editado
  const saveField = async (key: FieldKey) => {
    if (!user) return;

    try {
      let payload: any = {};
      let endpoint = "";

      if (key === "name" || key === "experience") {
        payload = { [key]: draftValue };
        endpoint = `/users/${user.id}`;
      } else if (key === "cpf" || key === "cnpj") {
        setPersonalData(prev => ({ ...prev, [key]: draftValue }));
        setEditingField(null);
        return;
      } else if (key === "cep") {
        await fetchAddress(draftValue);
        setEditingField(null);
        return;
      } else if (key === "profession" || key === "about") {
        if (!providerData) return;
        payload = { [key]: draftValue };
        endpoint = `/providers/${providerData.provider_id}`;
      }

      const res = await apiRequest("PUT", endpoint, payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }

      toast({
        title: "Sucesso",
        description: "Campo atualizado com sucesso!",
      });

      // Atualizar dados locais
      if (key === "profession" || key === "about") {
        setProviderData(prev => prev ? { ...prev, [key]: draftValue } : null);
      }

      setEditingField(null);
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <AplicationLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AplicationLayout>
    );
  }

  return (
    <AplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header do Perfil */}
          <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-400"></div>
              <div className="absolute -bottom-16 left-8">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-20 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">{user.name}</h1>
                  <p className="text-slate-600 mt-1">
                    {user.type === "prestador" ? "Prestador de Serviços" : "Contratante"}
                  </p>
                  {user.type === "prestador" && providerData && (
                    <Badge variant="secondary" className="mt-2">
                      {providerData.profession}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{completionRate}%</div>
                    <div className="text-sm text-slate-600">Perfil Completo</div>
                    <Progress value={completionRate} className="w-24 mt-1" />
                  </div>
                  <Button
                    onClick={logout}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Postagem de Demanda (apenas para não-prestadores) */}
          {user?.type !== "prestador" && (
            <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Postar Nova Demanda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Título da demanda"
                  value={newDemand.title}
                  onChange={(e) => setNewDemand({ ...newDemand, title: e.target.value })}
                />
                <Textarea
                  placeholder="Descrição detalhada da demanda"
                  value={newDemand.description}
                  onChange={(e) => setNewDemand({ ...newDemand, description: e.target.value })}
                  rows={4}
                />
                <Button
                  onClick={handlePostDemand}
                  disabled={postingDemand}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-2 rounded-xl shadow-lg transition-all duration-300"
                >
                  {postingDemand ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {postingDemand ? 'Postando...' : 'Postar Demanda'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Seção de Gerenciamento de Demandas (apenas para não-prestadores) */}
          {user?.type !== "prestador" && (
            <DemandsManager userId={user?.id} />
          )}

          {/* Seções específicas para prestadores */}
          {user.type === "prestador" && (
            <>
              {/* Seção de Destaques (Portfólio) */}
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Meus Destaques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingPortfolio ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {portfolio.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                          <p>Nenhum item nos destaques ainda.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {portfolio.map((item) => (
                            <div 
                              key={item.id} 
                              className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                              onClick={() => openPortfolioModal(item)}
                            >
                              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                                {getImageUrl(item.image_id) ? (
                                  <img 
                                    src={getImageUrl(item.image_id)} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-12 h-12 text-slate-400" />
                                )}
                              </div>
                              <div className="p-4">
                                <h4 className="font-semibold">{item.title}</h4>
                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        onClick={() => setIsUploadingImage(true)}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-2 rounded-xl shadow-lg transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Destaque
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seção de Serviços */}
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    Meus Serviços
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
                  ) : (
                    <div className="space-y-4">
                      {services.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Briefcase className="w-12 h-12 mx-auto mb-4" />
                          <p>Nenhum serviço cadastrado ainda.</p>
                        </div>
                      ) : (
                        services.map((service) => (
                          <div key={service.id_serviceFreelancer} className="p-4 border rounded-lg">
                            <h4 className="font-semibold text-lg">{service.title}</h4>
                            <p className="text-slate-600 mt-2">{service.description}</p>
                            <p className="text-orange-600 font-bold mt-2">R$ {service.price}</p>
                          </div>
                        ))
                      )}
                      <Button
                        onClick={() => setIsCreating(!isCreating)}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-2 rounded-xl shadow-lg transition-all duration-300"
                      >
                        {isCreating ? "Cancelar" : "Adicionar Novo Serviço"}
                      </Button>
                      {isCreating && (
                        <div className="space-y-4 mt-4 p-4 border rounded-lg bg-slate-50">
                          <Input
                            placeholder="Título do Serviço"
                            value={newService.title}
                            onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                          />
                          <Textarea
                            placeholder="Descrição do Serviço"
                            value={newService.description}
                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                          />
                          <Input
                            placeholder="Preço (ex: 150.00)"
                            type="number"
                            value={newService.price}
                            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                          />
                          <Button
                            onClick={handleCreateService}
                            disabled={creatingService}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            {creatingService ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {creatingService ? "Criando..." : "Salvar Serviço"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Campos do perfil */}
          <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileFields.map((field, index) => (
                <div key={field.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <field.icon className="w-5 h-5 text-slate-500" />
                      <span className="font-medium text-slate-700">{field.label}</span>
                    </div>
                    {field.editable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditField(field.key, field.value)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  {editingField === field.key ? (
                    <div className="flex gap-2">
                      {field.key === "about" ? (
                        <Textarea
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          className="flex-1"
                          rows={3}
                        />
                      ) : (
                        <Input
                          value={draftValue}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (field.mask) {
                              if (field.key === "cpf") value = formatCPF(value);
                              else if (field.key === "cnpj") value = formatCNPJ(value);
                              else if (field.key === "cep") value = formatCEP(value);
                            }
                            setDraftValue(value);
                          }}
                          className="flex-1"
                        />
                      )}
                      <Button
                        size="sm"
                        onClick={() => saveField(field.key)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingField(null)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="ml-8 p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-700">{field.value}</span>
                    </div>
                  )}
                  
                  {index < profileFields.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Upload de Imagem */}
        {isUploadingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <CardTitle className="mb-4">Upload de Imagem</CardTitle>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              <Button 
                onClick={handleUploadImage} 
                disabled={uploadingImage || !selectedFile}
                className="mt-4 w-full"
              >
                {uploadingImage ? "Enviando..." : "Upload Imagem"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsUploadingImage(false)} 
                className="mt-2 w-full"
              >
                Cancelar
              </Button>
            </Card>
          </div>
        )}

        {/* Modal de Criação de Item do Portfólio */}
        {isCreatingPortfolioItem && uploadedImageId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <CardTitle className="mb-4">Criar Item de Destaque</CardTitle>
              <Input
                placeholder="Título do Destaque"
                value={portfolioItemData.title}
                onChange={(e) => setPortfolioItemData({ ...portfolioItemData, title: e.target.value })}
                className="mb-2"
              />
              <Textarea
                placeholder="Descrição do Destaque"
                value={portfolioItemData.description}
                onChange={(e) => setPortfolioItemData({ ...portfolioItemData, description: e.target.value })}
                className="mb-4"
              />
              <Button 
                onClick={handleCreatePortfolioItem} 
                disabled={creatingPortfolioItem}
                className="w-full"
              >
                {creatingPortfolioItem ? "Criando..." : "Salvar Destaque"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreatingPortfolioItem(false)} 
                className="mt-2 w-full"
              >
                Cancelar
              </Button>
            </Card>
          </div>
        )}

        {/* Modal do Portfólio */}
        {isModalOpen && selectedPortfolioItem && (
          <PortfolioModal
            item={selectedPortfolioItem}
            imageUrl={getImageUrl(selectedPortfolioItem.image_id)}
            onClose={closePortfolioModal}
            canDelete={true}
            onDelete={() => {
              closePortfolioModal();
              loadPortfolio();
            }}
          />
        )}
      </div>
    </AplicationLayout>
  );
}


