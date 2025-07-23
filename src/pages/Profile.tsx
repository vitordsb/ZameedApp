
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

  // Estado para taxa de conclusão
  const [completionRate, setCompletionRate] = useState(0);

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

  // Calcular taxa de conclusão
  const calculateCompletionRate = () => {
    const fields = [
      user?.name,
      personalData.cpf,
      addressData.cep,
      addressData.numero,
    ];

    // Adicionar campos específicos para prestadores
    if (user?.type === "prestador") {
      fields.push((user as any).profession, (user as any).about);
    }

    const filledFields = fields.filter(field => field && field.trim() !== "").length;
    const totalFields = fields.length;
    
    return Math.round((filledFields / totalFields) * 100);
  };

  // Atualizar taxa de conclusão quando dados mudarem
  useEffect(() => {
    setCompletionRate(calculateCompletionRate());
  }, [personalData, addressData, user]);

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
  }, [user, personalData, addressData]);

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
    const image = images.find(img => img.id === imageId);
      if (image?.image_path) {
        const baseUrl = "https://zameed-backend.onrender.com";
        const imagePath = image.image_path.replace(/^uploads\//, '');
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
        } else if (editingField === "name" || editingField === "endereco" || editingField === "experience") {
          const payload: any = {};
          payload[editingField] = draftValue;
          const res = await apiRequest("PUT", `/providers/${user.id}`, payload);
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Status ${res.status}`);
          }
          const data = await res.json();
          console.log(data)
          toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
        } else if (editingField === "profession" || editingField === "about") {
          await apiRequest("PUT", `/providers/${user.id}`, {
            [editingField]: draftValue,
          });
          toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
        }
        setEditingField(null);
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      }
    };

    // Manipular mudança do CEP com busca automática
    const handleCepChange = (value: string) => {
      const formattedCep = formatCEP(value);
      setDraftValue(formattedCep);

      // Buscar endereço quando CEP estiver completo
      const cleanCep = value.replace(/\D/g, "");
      if (cleanCep.length === 8) {
        fetchAddress(cleanCep);
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
      
      // Verificar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 10MB.",
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
        
        console.log("Upload data:", uploadData);
        // Salvar o ID e URL da imagem - CORRIGIDO: acessar userImage.id
        const imageId = uploadData.userImage?.id || uploadData.id;
        const imageUrl = uploadData.userImage?.image_path || uploadData.image_url;
        
        setUploadedImageId(imageId);
        setUploadedImageUrl(imageUrl || URL.createObjectURL(file));
        
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

        setIsCreatingPortfolioItem(false);
        setPortfolioItemData({ title: "", description: "" });
        setUploadedImageId(null);
        setUploadedImageUrl(null);
        
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
        const date = new Date(dateString);
        
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
            <div className="relative">
              <Card className="shadow-xl border-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white overflow-hidden">
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

            {/* Taxa de Conclusão do Perfil */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    Taxa de Conclusão do Perfil
                  </h3>
                  <Badge 
                    variant={completionRate === 100 ? "default" : "secondary"}
                    className={completionRate === 100 ? "bg-green-600" : "bg-amber-600"}
                  >
                    {completionRate}%
                  </Badge>
                </div>
                <Progress value={completionRate} className="h-3 mb-2" />
                <p className="text-sm text-slate-600">
                  {completionRate === 100 
                    ? "Parabéns! Seu perfil está completo." 
                    : `Complete mais informações para melhorar sua visibilidade.`
                  }
                </p>
              </CardContent>
            </Card>

            {/* Portfólio do prestador - POSICIONADO APÓS O HEADER E ANTES DAS INFORMAÇÕES */}
            {user.type === "prestador" && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <Grid3X3 className="w-6 h-6 text-amber-600" />
                      Meus Destaques
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
                      {portfolio
                        .sort((a, b) => new Date(b.created_at || b.created_at).getTime() - new Date(a.created_at || a.created_at).getTime())
                        .map((item) => {
                          const imageUrl = getImageUrl(item.image_id);
                          return (
                            <Card key={item.id} className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                              <div 
                                className="aspect-square bg-gray-200 cursor-pointer"
                                onClick={() => openPortfolioModal(item)}
                              >
                                <img
                                  src={imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  onError={() => console.log("Erro ao carregar imagem:", imageUrl)}
                                />
                                {/* Overlay escurecido no hover */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePortfolioItem(item.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
                                  ) : f.key === "cpf" ? (
                                    <Input
                                      value={draftValue}
                                      onChange={(e) => {
                                        const formatted = formatCPF(e.target.value);
                                        if (formatted.length <= 14) {
                                          setDraftValue(formatted);
                                        }
                                      }}
                                      className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                      placeholder="000.000.000-00"
                                      maxLength={14}
                                    />
                                  ) : f.key === "cnpj" ? (
                                    <Input
                                      value={draftValue}
                                      onChange={(e) => {
                                        const formatted = formatCNPJ(e.target.value);
                                        if (formatted.length <= 18) {
                                          setDraftValue(formatted);
                                        }
                                      }}
                                      className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                      placeholder="00.000.000/0000-00"
                                      maxLength={18}
                                    />
                                  ) : f.key === "cep" ? (
                                    <div className="relative">
                                      <Input
                                        value={draftValue}
                                        onChange={(e) => handleCepChange(e.target.value)}
                                        className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                        placeholder="00000-000"
                                        maxLength={9}
                                      />
                                      {loadingCep && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                        </div>
                                      )}
                                    </div>
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

                  {/* Campos de endereço adicionais */}
                  {addressData.cep && (
                    <>
                      <Separator className="my-4" />
                      <div className="group">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <MapPin className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                                Número da Residência
                              </label>
                              {editingField !== "numero" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => startEditField("numero", addressData.numero)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            {editingField === "numero" ? (
                              <div className="space-y-3">
                                <Input
                                  value={draftValue}
                                  onChange={(e) => setDraftValue(e.target.value)}
                                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                                  placeholder="123"
                                />
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
                                {addressData.numero || "Não informado"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
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
                      <div className="text-sm text-slate-600">Projetos em Destaque</div>
                    </div>
                  )}
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">4.8</div>
                    <div className="text-sm text-slate-600">Avaliação Média</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{completionRate}%</div>
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

      {/* Modal do Portfólio */}
      <PortfolioModal
        isOpen={isModalOpen}
        onClose={closePortfolioModal}
        item={selectedPortfolioItem}
        imageUrl={selectedPortfolioItem ? getImageUrl(selectedPortfolioItem.image_id) : ""}
        userName={user.name}
        onDelete={handleDeletePortfolioItem}
      />
    </AplicationLayout> 
  );
}


