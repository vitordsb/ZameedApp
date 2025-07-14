
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
} from "lucide-react";

type FieldKey =
  | "name"
  | "cpf"
  | "cnpj"
  | "endereco"
  | "experience"
  | "about";

interface Service {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: string; // vem como string "180.00"
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
        key: "cpf" as const,
        label: "CPF",
        value: formatCPF(user.cpf),
        editable: false,
        icon: FileText,
      },
      {
        key: "cnpj" as const,
        label: "CNPJ (opcional)",
        value: user.cnpj ? formatCNPJ(user.cnpj) : "Não informado",
        editable: false,
        icon: Briefcase,
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
    // "Sobre mim"
    base.push({
      key: "about" as const,
      label: "Sobre Mim",
      value: (user as any).about || "Conte um pouco sobre você...",
      editable: true,
      icon: User,
    });
    return base;
  }, [user]);

  // 1) Carrega serviços na montagem (só se for prestador)
  useEffect(() => {
    if (user?.type !== "prestador") return;
    loadServices();
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
      await apiRequest("PUT", `/users/${user.id}`, {
        [editingField]: draftValue,
      });
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

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
                      {user.type === "prestador" ? "Prestador de Serviços" : "Cliente"}
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

        {/* Informações do Perfil */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                    {user.type === "prestador" ? "Serviços Ativos" : "Projetos"}
                  </div>
                </div>
                
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

