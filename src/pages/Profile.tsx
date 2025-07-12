
// src/pages/Profile.tsx
import React, { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Edit2,
  Check,
  X,
  LogOut,
  AlertCircle,
  Briefcase,
  Star,
  MapPin,
} from "lucide-react";

type FieldKey =
  | "name"
  | "cpf"
  | "cnpj"
  | "endereco"
  | "experience"
  | "about";

interface RawProvider {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
  rating_mid: number;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [draft, setDraft] = useState<string>("");

  // 1) Se não há usuário logado, mostra loader
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-amber-50">
        <Loader2 className="animate-spin text-amber-600 w-12 h-12" />
      </div>
    );
  }

  // 2) Buscar TODOS os providers e filtrar pelo user_id
  const {
    data: allProvRes,
    isLoading: loadingProviders,
    isError: errProviders,
  } = useQuery<{ providers: RawProvider[] }>({
    queryKey: ["allProviders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/providers");
      if (!res.ok) throw new Error("Erro ao buscar prestadores");
      // a API retorna um objeto { code, providers, … }
      const json = await res.json();
      return { providers: json.providers as RawProvider[] };
    },
    // só precisamos disso se for prestador
    enabled: user.type === "prestador",
    staleTime: 5 * 60 * 1000,
  });

  // 3) Extrair o provider do usuário logado
  const provider = useMemo<RawProvider | undefined>(() => {
    return allProvRes?.providers.find((p) => p.user_id === user.id);
  }, [allProvRes, user.id]);
  console.log("provider:", provider);

  // 4) Formatações
  const formatCPF = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 11) return raw;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };
  const formatCNPJ = (raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 14) return raw;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  };

  // 5) Campos principais
  const block1 = [
    { key: "name" as const,     label: "Nome",        value: user.name,                   editable: true  },
    { key: "cpf" as const,      label: "CPF",         value: formatCPF(user.cpf),        editable: false },
    { key: "cnpj" as const,     label: "CNPJ (opcional)", value: user.cnpj ? formatCNPJ(user.cnpj) : "—", editable: false },
    { key: "endereco" as const, label: "Endereço",    value: user.endereco || "—",       editable: true  },
    { key: "experience" as const, label: "Experiência", value: user.exp || "—",          editable: true  },
  ];

  // Se for prestador e achou um provider, adiciona profissão
  if (user.type === "prestador" && provider) {
    block1.push({
      key: "profession" as const,
      label: "Especialidade",
      value: provider.profession,
      editable: false,
    });
  }

  // 6) Valor do campo “Sobre mim”
  const aboutValue =
    user.type === "prestador"
      ? provider?.about || ""
      : user.about || "";

  // 7) Funções de edição
  const startEdit = (key: FieldKey, current: string) => {
    setDraft(current);
    setEditing(key);
  };
  const cancelEdit = () => {
    setEditing(null);
    setDraft("");
  };
  const saveField = async () => {
    if (!editing) return;
    try {
      const payload: Record<string, unknown> = {};
      payload[editing] = draft;
      // PUT /users/{id}
      const res = await apiRequest("PUT", `/users/${user.id}`, payload);
      if (!res.ok) throw new Error("Falha ao salvar");
      toast({ title: "Sucesso", description: "Campo atualizado." });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // 8) Renderiza cada linha de campo
  const renderField = (
    key: FieldKey | "profession",
    label: string,
    value: string,
    editable: boolean
  ) => (
    <div key={key} className="flex items-center mb-4 group">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-600">{label}</div>
        {editing === key ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1 text-lg py-2 w-full"
          />
        ) : (
          <div className="mt-1 text-lg text-gray-900">{value || "—"}</div>
        )}
      </div>
      {editable && (
        <div className="ml-4">
          {editing === key ? (
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="icon" className="bg-amber-600 text-white" onClick={saveField}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100"
              onClick={() => startEdit(key as FieldKey, value)}
            >
              <Edit2 className="w-5 h-5 text-gray-500 hover:text-amber-600" />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // 9) Estados de loading / erro do provider
  if (user.type === "prestador" && loadingProviders) {
    return (
      <div className="flex items-center justify-center h-screen bg-amber-50">
        <Loader2 className="animate-spin text-amber-600 w-12 h-12" />
      </div>
    );
  }
  if (user.type === "prestador" && errProviders) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <AlertCircle className="text-red-600 w-12 h-12" />
        <p className="mt-4 text-red-600">Falha ao carregar dados do prestador.</p>
      </div>
    );
  }

  // 10) JSX final
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-amber-600">Meu Perfil</h1>
        <Button variant="outline" size="sm" onClick={logout}>
          Sair <LogOut className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Card className="shadow-lg rounded-xl p-6">
        <CardContent>
          <div className="flex items-start mb-8">
            <div className="mr-6 text-center">
              <div className="w-24 h-24 rounded-full bg-amber-200 flex items-center justify-center text-3xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              {block1.map((f) =>
                renderField(f.key, f.label, String(f.value), f.editable)
              )}
            </div>
          </div>

          {user.type === "prestador" && (
            <div className="group">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Sobre mim</h2>
              {editing === "about" ? (
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-32"
                  // @ts-ignore: multiline
                  multiline
                />
              ) : (
                <div className="w-full h-32 p-4 border rounded text-gray-900">
                  {aboutValue || "Sem descrição."}
                </div>
              )}
              <div className="mt-2 flex justify-end">
                {editing === "about" ? (
                  <>
                    <Button size="icon" variant="outline" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="icon" className="bg-amber-600 text-white" onClick={saveField}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => startEdit("about", aboutValue)}
                  >
                    <Edit2 className="w-5 h-5 text-gray-500 hover:text-amber-600" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

