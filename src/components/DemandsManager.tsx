// src/components/DemandsManager.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Edit2,
  Check,
  X,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Save,
} from "lucide-react";
import { Demand } from "@/lib/Interfaces"

export default function DemandsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loadingDemands, setLoadingDemands] = useState(false);
  const [errorDemands, setErrorDemands] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftDemand, setDraftDemand] = useState<{
    title: string;
    description: string;
    price: string;
  }>({ title: "", description: "", price: "" });

  const [isCreating, setIsCreating] = useState(false);
  const [creatingDemand, setCreatingDemand] = useState(false);
  const [newDemand, setNewDemand] = useState<{
    title: string;
    description: string;
    price: string;
  }>({ title: "", description: "", price: "" });

  // Carrega demandas na montagem (só se for contratante)
  useEffect(() => {
    if (user?.type !== "contratante") return;
    loadDemands();
  }, [user]);

  // Função para carregar demandas do usuário atual
  const loadDemands = async () => {
    setLoadingDemands(true);
    try {
      const res = await apiRequest("GET", `/demands`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }
      const body = await res.json();
      console.log("Demands response:", body);
      // usa `body.demand` e não `body.demands`
      setDemands(Array.isArray(body.demand) ? body.demand : []);
      setErrorDemands(null);
    } catch (err: any) {
      setErrorDemands(err.message);
    } finally {
      setLoadingDemands(false);
    }
  };
  // Criação de nova demanda
  const startCreating = () => {
    setIsCreating(true);
    setNewDemand({ title: "", description: "", price: "" });
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewDemand({ title: "", description: "", price: "" });
  };

  const createDemand = async () => {
    if (!newDemand.title || !newDemand.description || !newDemand.price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setCreatingDemand(true);
    try {
      const payload = {
        title: newDemand.title,
        description: newDemand.description,
        price: parseFloat(newDemand.price),
      };

      const res = await apiRequest("POST", "/demands", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }

      toast({ title: "Sucesso", description: "Demanda criada com sucesso!" });
      setIsCreating(false);
      setNewDemand({ title: "", description: "", price: "" });
      // Recarrega a lista de demandas
      await loadDemands();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreatingDemand(false);
    }
  };

  // Edição de demanda
  const startEditDemand = (demand: Demand) => {
    setEditingId(demand.id_demand);
    setDraftDemand({
      title: demand.title,
      description: demand.description,
      price: demand.price.toString(),
    });
  };

  const cancelEditDemand = () => {
    setEditingId(null);
  };

  const saveDemand = async () => {
    if (editingId == null) return;
    try {
      const payload = {
        title: draftDemand.title,
        description: draftDemand.description,
        price: parseFloat(draftDemand.price),
      };

      const res = await apiRequest("PUT", `/demands/${editingId}`, payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Status ${res.status}`);
      }

      toast({ title: "Sucesso", description: "Demanda atualizada com sucesso!" });
      setEditingId(null);
      // Recarrega a lista de demandas
      await loadDemands();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'em_andamento':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'concluida':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelada':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Se não for contratante, não renderiza nada
  if (user?.type !== "contratante") {
    return null;
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-600" />
            Minhas Demandas
          </CardTitle>
          {!isCreating && (
            <Button
              onClick={startCreating}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Demanda
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulário de criação de demanda */}
        {isCreating && (
          <Card className="mb-6 border-2 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-lg text-amber-800">Criar Nova Demanda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">
                  Título da Demanda *
                </label>
                <Input
                  value={newDemand.title}
                  onChange={(e) => setNewDemand(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Conserto de torneira com vazamento"
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">
                  Descrição *
                </label>
                <Textarea
                  value={newDemand.description}
                  onChange={(e) => setNewDemand(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva detalhadamente o serviço que você precisa..."
                  className="min-h-[100px] resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block">
                  Orçamento (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newDemand.price}
                  onChange={(e) => setNewDemand(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="120.00"
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={cancelCreating}
                  className="flex-1 border-slate-300 hover:bg-slate-50"
                  disabled={creatingDemand}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={createDemand}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={creatingDemand}
                >
                  {creatingDemand ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {creatingDemand ? "Criando..." : "Criar Demanda"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loadingDemands ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-amber-600 w-8 h-8 mr-3" />
            <span className="text-slate-600">Carregando demandas...</span>
          </div>
        ) : errorDemands ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" />
            <span>Erro ao carregar demandas: {errorDemands}</span>
          </div>
        ) : demands.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma demanda cadastrada</h3>
            <p className="text-slate-500 mb-4">Cadastre suas primeiras demandas para encontrar prestadores de serviço.</p>
            {!isCreating && (
              <Button
                onClick={startCreating}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Demanda
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {demands.map((demand) => {
              const isEditingDemand = demand.id_demand === editingId;

              return (
                <Card key={demand.id_demand} className="group hover:shadow-lg transition-all duration-200 border-slate-200">
                  <CardContent className="p-6">
                    {isEditingDemand ? (
                      <div className="space-y-4">
                        <Input
                          value={draftDemand.title}
                          onChange={(e) =>
                            setDraftDemand((d) => ({ ...d, title: e.target.value }))
                          }
                          placeholder="Título da demanda"
                          className="font-semibold border-amber-200 focus:border-amber-400"
                        />
                        <Textarea
                          value={draftDemand.description}
                          onChange={(e) =>
                            setDraftDemand((d) => ({ ...d, description: e.target.value }))
                          }
                          placeholder="Descrição da demanda"
                          className="min-h-[80px] resize-none border-amber-200 focus:border-amber-400"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={draftDemand.price}
                          onChange={(e) =>
                            setDraftDemand((d) => ({ ...d, price: e.target.value }))
                          }
                          placeholder="Orçamento"
                          className="border-amber-200 focus:border-amber-400"
                        />
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditDemand}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveDemand}
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
                            {demand.title}
                          </h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 ml-2"
                            onClick={() => startEditDemand(demand)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <p className="text-slate-600 line-clamp-3 leading-relaxed">
                          {demand.description}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                            R$ {demand.price}
                          </div>
                          <Badge className={getStatusColor(demand.status)}>
                            {demand.status === 'pendente' ? 'Pendente' :
                              demand.status === 'em_andamento' ? 'Em Andamento' :
                                demand.status === 'concluida' ? 'Concluída' :
                                  demand.status === 'cancelada' ? 'Cancelada' : demand.status}
                          </Badge>
                        </div>

                        <div className="text-xs text-slate-500">
                          Criada em: {new Date(demand.created_at).toLocaleDateString('pt-BR')}
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
  );
}
