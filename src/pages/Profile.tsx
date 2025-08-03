
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

  // Função para obter URL da imagem pelo image_id
  const getImageUrl = (imageId: number) => {
    const image = images.find(img => img.id === imageId);
      if (image?.image_path) {
        const baseUrl = "https://zameed-backend.onrender.com";
        const imagePath = image.image_path.replace(/^uploads\//, "");
        const imageUrl = `${baseUrl}/uploads/${imagePath}`;
        return imageUrl;
      }
      return "";
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

    const handleDeletePortfolioItem = async (id: number) => {
      try {
        const res = await apiRequest("DELETE", `/portfolio/${id}`);
        if (!res.ok) {
          throw new Error("Erro ao deletar item do portfólio");
        }
        toast({
          title: "Sucesso",
          description: "Item removido do portfólio com sucesso!"
        });
        closePortfolioModal();
        await loadPortfolio();
      } catch (err: any) {
        toast({
          title: "Erro",
          description: err.message,
          variant: "destructive"
        });
      }
    };

    // Funções de criação de serviço
    const handleCreateService = async () => {
      if (!user || user.type !== "prestador") return;
      if (!newService.title || !newService.description || !newService.price) {
        toast({
          title: "Campos incompletos",
          description: "Por favor, preencha todos os campos do serviço.",
          variant: "destructive",
        });
        return;
      }

      setCreatingService(true);
      try {
        const res = await apiRequest("POST", "/servicesfreelancer", newService);
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
        await loadServices();
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

    // Edição de campo de perfil
    const startEditField = (key: FieldKey, current: string) => {
      setEditingField(key);
      if (key === "cpf" || key === "cnpj" || key === "cep") {
        // Para campos com máscara, usar o valor sem formatação
        setDraftValue(current === "Não informado" ? "" : current);
      } else {
        setDraftValue(current === "Não informado" || current === "Conte um pouco sobre você..." ? "" : current);
      }
    };
    
    const cancelEditField = () => {
      setEditingField(null);
    };
    
    const saveField = async () => {
      if (!editingField || !user) return;
      try {
        if (editingField === "cpf") {
          setPersonalData(prev => ({ ...prev, cpf: draftValue }));
          setEditingField(null);
          toast({ title: "Sucesso", description: "CPF atualizado!" });
        } else if (editingField === "cnpj") {
          setPersonalData(prev => ({ ...prev, cnpj: draftValue }));
          setEditingField(null);
          toast({ title: "Sucesso", description: "CNPJ atualizado!" });
        } else if (editingField === "cep") {
          const cleanCep = draftValue.replace(/\D/g, "");
          if (cleanCep.length === 8) {
            await fetchAddress(cleanCep);
          } else {
            setAddressData(prev => ({ ...prev, cep: formatCEP(draftValue) }));
          }
          setEditingField(null);
        } else if (editingField === "numero") {
          setAddressData(prev => ({ ...prev, numero: draftValue }));
          setEditingField(null);
          toast({ title: "Sucesso", description: "Número atualizado!" });
        } else if (editingField === "name") {
          // Atualizar nome do usuário via PUT /users/{id}
          const payload = { name: draftValue };
          const res = await apiRequest("PUT", `/users/${user.id}`, payload);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Status ${res.status}`);
          }
          const data = await res.json();
          console.log("User updated:", data);
          toast({ title: "Sucesso", description: "Nome atualizado com sucesso!" });
          setEditingField(null);
        } else if (editingField === "profession" || editingField === "about") {
          // Atualizar dados do provider via PUT /providers/{id}
          if (!providerData) {
            throw new Error("Dados do provider não encontrados");
          }
          
          const payload = { ...providerData, [editingField]: draftValue };
          const res = await apiRequest("PUT", `/providers/${providerData.provider_id}`, payload);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Status ${res.status}`);
          }
          const data = await res.json();
          console.log("Provider updated:", data);
          
          // Atualizar estado local do provider
          setProviderData(prev => prev ? { ...prev, [editingField]: draftValue } : null);
          
          toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
          setEditingField(null);
        } else {
          // Para outros campos, manter a lógica original
          const payload: any = {};
          payload[editingField] = draftValue;
          const res = await apiRequest("PUT", `/users/${user.id}`, payload);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Status ${res.status}`);
          }
          const data = await res.json();
          console.log(data);
          toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
          setEditingField(null);
        }
      } catch (err: any) {
        toast({
          title: "Erro",
          description: err.message,
          variant: "destructive",
        });
      }
    };

  if (!user) {
    return (
      <AplicationLayout>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
          <div className="text-center space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-200 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700">Carregando perfil...</h3>
              <p className="text-slate-500">Aguarde enquanto carregamos suas informações.</p>
            </div>
          </div>
        </div>
      </AplicationLayout>
    );
  }

  return (
    <AplicationLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Header do perfil */}
          <Card className="relative overflow-hidden shadow-2xl border-0 rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500" />
            <div className="absolute inset-0 bg-black/10" />
            
            <CardContent className="relative p-6 sm:p-8 lg:p-12 text-white">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
                <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-white shadow-2xl">
                  <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-4xl sm:text-5xl font-bold">
                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center lg:text-left space-y-4 min-w-0">
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 break-words">{user.name}</h1>
                    <p className="text-lg sm:text-xl lg:text-2xl text-white/90 font-medium break-words">
                      {user.type === "prestador" && providerData ? providerData.profession || "Prestador de Serviços" : "Usuário"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      {completionRate}% completo
                    </Badge>
                    {user.type === "prestador" && providerData && (
                      <>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 fill-current" />
                          {providerData.rating_mid} estrelas
                        </Badge>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium">
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          {providerData.views_profile} visualizações
                        </Badge>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 pt-4">
                    <Button
                      onClick={logout}
                      variant="outline"
                      className="border-white text-amber-600 hover:bg-white hover:text-orange-600 font-semibold px-4 py-2 sm:px-6 sm:py-2 rounded-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress bar */}
          <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-700">Completude do Perfil</h3>
                  <span className="text-sm font-medium text-slate-600">{completionRate}%</span>
                </div>
               <Progress value={completionRate} className="w-[60%]" />
        </div>

        {user.type === "contratante" && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold mb-4">Postar Nova Demanda</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="demandTitle">
                Título da Demanda:
              </label>
              <input
                type="text"
                id="demandTitle"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newDemand.title}
                onChange={(e) => setNewDemand({ ...newDemand, title: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="demandDescription">
                Descrição:
              </label>
              <textarea
                id="demandDescription"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newDemand.description}
                onChange={(e) => setNewDemand({ ...newDemand, description: e.target.value })}
              ></textarea>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handlePostDemand}
              disabled={postingDemand}
            >
              {postingDemand ? 'Postando...' : 'Postar Demanda'}
            </button>
          </div>
        )}
            </CardContent>
          </Card>

          {/* Seção de Postar Demanda (apenas para não-prestadores) */}
          {user?.type !== "prestador" && (
            <Card className="w-full max-w-4xl mx-auto mb-8 shadow-lg rounded-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-orange-600 flex items-center">
                  <TrendingUp className="mr-2" /> Postar Nova Demanda
                </CardTitle>
                <CardDescription>Descreva o serviço que você precisa e encontre os melhores profissionais.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="demand-title" className="block text-sm font-medium text-gray-700 mb-1">Título da Demanda</label>
                  <Input
                    id="demand-title"
                    placeholder="Ex: Projeto de Interiores para Apartamento"
                    value={newDemand.title}
                    onChange={(e) => setNewDemand({ ...newDemand, title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="demand-description" className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
                  <Textarea
                    id="demand-description"
                    placeholder="Descreva o escopo, requisitos, prazos e qualquer detalhe importante."
                    value={newDemand.description}
                    onChange={(e) => setNewDemand({ ...newDemand, description: e.target.value })}
                    rows={5}
                  />
                </div>
                <Button
                  onClick={handlePostDemand}
                  disabled={postingDemand}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-md transition-colors"
                >
                  {postingDemand ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Postando Demanda...</>
                  ) : (
                    "Postar Demanda"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Seção de Gerenciamento de Demandas (apenas para não-prestadores) */}
          {user?.type !== "prestador" && (
            <DemandsManager userId={user?.id} />
          )}

          {/* Seção de Portfólio (apenas para prestadores) */}
          {user.type === "prestador" && (
            <>
              {/* Seção de Portfólio */}
              <Card className="shadow-xl border-0 rounded-3xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
                      <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                   Meus destaques 
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
                          <p>Nenhum item no portfólio ainda.</p>
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
                        onClick={saveField}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditField}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-slate-600 ml-8">{field.value}</p>
                  )}
                  
                  {index < profileFields.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Modal do Portfólio */}
        {isModalOpen && selectedPortfolioItem && (
          <PortfolioModal 
            isOpen={isModalOpen}
            item={selectedPortfolioItem}
            imageUrl={getImageUrl(selectedPortfolioItem.image_id)}
            onClose={closePortfolioModal}
            onDelete={handleDeletePortfolioItem}
          />
        )}
      </div>
    </AplicationLayout>
  );
}


