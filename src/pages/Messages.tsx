
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Users, MessageCircle, ArrowLeft, FileText, CheckCircle, XCircle, Plus, Minus, Clock, DollarSign, Eye, List, Upload, Trash2, Edit2, Check, X, ExternalLink, Download, Shield, AlertTriangle, Sparkles, Star, Maximize2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AplicationLayout from '@/components/layouts/ApplicationLayout';
import { apiRequest } from '@/lib/queryClient'
import { savePdf, getPdf, deletePdf } from '@/lib/pdfStore';

export default function Messages() {
  const [location, setLocation] = useLocation();
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialPartnerId = userId;

  const {
    conversations,
    currentConversation,
    messages,
    newMessage,
    tickets,
    unreadMessageCount,
    loadingConversations,
    loadingMessages,
    loadingTickets,
    sendingMessage,
    setNewMessage,
    sendMessage,
    selectConversation,
    conversationsError,
    messagesError,
    createProposal,
    getStepsForTicket,
    updateTicketStatus,
    updateStep,
    deleteStep,
    uploadPDF,
    buscarPDF,
    markStepCompleted,
    confirmStepCompletion,
    signDocument,
  } = useMessaging(initialPartnerId);

  // Estados para modal de proposta
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalSteps, setProposalSteps] = useState([{ title: '', price: 0 }]);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);

  // Estados para visualização de propostas
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [showAllProposals, setShowAllProposals] = useState(false);
  const [selectedTicketSteps, setSelectedTicketSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [ticketStepsMap, setTicketStepsMap] = useState<Record<number, any[]>>({});

  // Estados para gerenciamento de steps
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editStepData, setEditStepData] = useState({ title: '', price: 0 });

  // Estados para visualização de PDF - MELHORADOS
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfFilename, setPdfFilename] = useState<string>('');
  const [selectedTicketForPdf, setSelectedTicketForPdf] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string>('');
  const [fullscreenPdf, setFullscreenPdf] = useState(false);

  // Estados para assinatura digital
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedTicketForSignature, setSelectedTicketForSignature] = useState<any>(null);
  const [signaturePassword, setSignaturePassword] = useState('');
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [signingDocument, setSigningDocument] = useState(false);

  // Estados para aceitar/rejeitar proposta
  const [showProposalActionModal, setShowProposalActionModal] = useState(false);
  const [selectedTicketForAction, setSelectedTicketForAction] = useState<any>(null);
  const [proposalAction, setProposalAction] = useState<'accept' | 'reject' | null>(null);

  const canCreateProposal = () => {
    // Apenas prestadores podem criar propostas, e não podem criar para outros prestadores
    return user?.type === 'prestador' && currentConversation?.otherUser.type !== 'prestador';
  };

  useEffect(() => {
    const loadAllTicketSteps = async () => {
      if (tickets.length === 0) return;
      const stepsMap: Record<number, any[]> = {};
      for (const ticket of tickets) {
        try {
          const steps = await getStepsForTicket(ticket.id);
          stepsMap[ticket.id] = steps;
        } catch (error) {
          console.error(`Erro ao carregar steps do ticket ${ticket.id}:`, error);
          stepsMap[ticket.id] = [];
        }
      }
      setTicketStepsMap(stepsMap);
    };

    loadAllTicketSteps();
  }, [tickets, getStepsForTicket]);

  // FUNÇÃO PARA OBTER A ÚLTIMA PROPOSTA
  const getLatestProposal = () => {
    if (tickets.length === 0) return null;
    const sortedTickets = [...tickets].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sortedTickets[0];
  };

  const calculateProposalTotal = (steps: any[]) => {
    return steps.reduce((sum, step) => sum + (step.price || 0), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // FUNÇÃO PARA OBTER STATUS CONFIG COM CORES MELHORADAS
  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'aceita':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Aceita',
          color: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'completed':
      case 'concluída':
      case 'concluida':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Aceita',
          color: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };

      case 'rejected':
      case 'rejeitado':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Rejeitada',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeClass: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'in_progress':
      case 'em_andamento':
        return {
          variant: 'default' as const,
          icon: Clock,
          label: 'Em Andamento',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'awaiting_confirmation':
        return {
          variant: 'default' as const,
          icon: Clock,
          label: 'Aguardando Confirmação',
          color: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'signed':
      case 'assinado':
        return {
          variant: 'default' as const,
          icon: Shield,
          label: 'Assinado',
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-300'
        };
      case 'pending':
      case 'pendente':
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: 'Pendente',
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-300'
        };
    }
  };

  const pdfLocalKey = (id: number) => `ticket:${id}`;
  const handleViewPdf = async (ticketOrId: any) => {
    try {
      setLoadingPdf(true);
      setPdfError('');

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }

      // normaliza: pode vir id ou objeto
      const ticket =
        typeof ticketOrId === 'number'
          ? tickets.find((t) => t.id === ticketOrId)
          : ticketOrId;

      if (!ticket) throw new Error('Ticket inválido.');

      const ticketId = ticket.id as number;
      setSelectedTicketForPdf(ticketId);

      // helpers

      const toAbsolute = (maybeRelative: string) => {
        const base = (import.meta.env.VITE_API_BASE_URL || '')
          .trim()
          .replace(/\/+$/, '');
        if (!base) throw new Error('VITE_API_BASE_URL não configurado.');
        return maybeRelative.startsWith('http')
          ? maybeRelative
          : `${base}/${maybeRelative.replace(/^\/+/, '')}`;
      };

      const fetchPdfBlob = async (absoluteUrl: string) => {
        console.log('[PDF] GET =>', absoluteUrl);
        const res = await fetch(absoluteUrl, { method: 'GET' });
        const ct = (res.headers.get('Content-Type') || '').toLowerCase();

        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(`Erro HTTP ${res.status} ao baixar PDF: ${t || absoluteUrl}`);
        }

        // aceita application/pdf e octet-stream (muitos storages servem assim).
        // recusa text/html para evitar pegar um index.html do dev server.
        const isPdf =
          ct.includes('application/pdf') ||
          ct.includes('application/octet-stream') ||
          ct === ''; // alguns servidores não enviam CT

        if (!isPdf) {
          const preview = await res.text().catch(() => '');
          throw new Error(
            `A URL não retornou PDF (Content-Type: ${ct || 'desconhecido'}). Resposta: ${preview.slice(0, 200)}...`
          );
        }

        const disp = res.headers.get('Content-Disposition') || '';
        const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disp);
        const filename = (m ? decodeURIComponent(m[1]) : null) || `contrato-ticket-${ticketId}.pdf`;

        const blob = await res.blob();
        return { blob, filename };
      };

      // 0) tenta localmente (IndexedDB) antes de buscar na rede
      try {
        const localBlob = await getPdf(pdfLocalKey(ticketId));
        if (localBlob) {
          const localUrl = URL.createObjectURL(localBlob);
          setPdfBlob(localBlob);
          setPdfUrl(localUrl);
          setPdfFilename(`contrato-ticket-${ticketId}.pdf`);
          setShowPdfViewer(true);
          setFullscreenPdf(true);
          setLoadingPdf(false);
          return;
        }
      } catch {
        // se IndexedDB falhar, ignora e segue
      }

      let finalBlob: Blob | null = null;
      let finalFilename = `contrato-ticket-${ticketId}.pdf`;

      // 1) tenta usar contract_pdf_url (se vier no ticket)
      if (ticket.contract_pdf_url) {
        try {
          const r = await fetchPdfBlob(toAbsolute(ticket.contract_pdf_url));
          finalBlob = r.blob;
          finalFilename = r.filename;
        } catch (e) {
          console.warn('[PDF] Falhou contract_pdf_url, tentando via attachments...', e);
        }
      }

      // 2) fallback: lista de anexos /attchment/ticket/:id (aceita attachments ou attchments)
      if (!finalBlob) {
        const listRes = await apiRequest('GET', `/attchment/ticket/${ticketId}`);
        if (!listRes.ok) {
          const t = await listRes.text().catch(() => '');
          throw new Error(`Erro ao listar anexos: ${listRes.status} - ${t}`);
        }

        const json = await listRes.json().catch(() => ({} as any));
        console.log('[PDF] listJson keys =>', Object.keys(json));

        const attachments:
          | Array<{ id: number; ticket_id: number; pdf_path: string; date?: string }>
          | [] =
          (Array.isArray(json?.attachments) && json.attachments) ||
          (Array.isArray(json?.attchments) && json.attchments) || // <- backend atual
          (Array.isArray(json?.data?.attachments) && json.data.attachments) ||
          (Array.isArray(json?.data?.attchments) && json.data.attchments) ||
          (Array.isArray(json?.result?.attachments) && json.result.attachments) ||
          (Array.isArray(json?.result?.attchments) && json.result.attchments) ||
          [];

        console.log('[PDF] attachments =>', attachments);

        if (!attachments.length) throw new Error('PDF não encontrado.');

        // pega o mais recente
        const chosen = [...attachments].sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        )[0];

        if (!chosen?.pdf_path) throw new Error('Anexo sem caminho do PDF (pdf_path).');

        const r = await fetchPdfBlob(toAbsolute(chosen.pdf_path));
        finalBlob = r.blob;
        finalFilename = r.filename || `contrato-ticket-${ticketId}.pdf`;
      }

      // 3) exibir + salvar localmente para próximos acessos
      const blobUrl = URL.createObjectURL(finalBlob!);
      setPdfBlob(finalBlob!);
      setPdfUrl(blobUrl);
      setPdfFilename(finalFilename);
      setShowPdfViewer(true);
      setFullscreenPdf(true);

      try {
        await savePdf(pdfLocalKey(ticketId), finalBlob!);
      } catch (err) {
        console.warn('Não foi possível salvar o PDF localmente:', err);
      }
    } catch (e: any) {
      console.error('[PDF] Erro:', e);
      setPdfError(e?.message || 'Falha ao carregar o PDF.');
      setShowPdfViewer(true);
    } finally {
      setLoadingPdf(false);
    }
  };
  // FUNÇÃO PARA FECHAR VISUALIZADOR DE PDF
  const closePdfViewer = async () => {
    setShowPdfViewer(false);
    setFullscreenPdf(false);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl('');
    setPdfBlob(null);
    setPdfFilename('');
    if (selectedTicketForPdf) {
      // opcional: manter salvo é útil; se quiser apagar, descomente:
      // await deletePdf(pdfLocalKey(selectedTicketForPdf));
    }
    setSelectedTicketForPdf(null);
    setPdfError('');
  };

  // FUNÇÃO PARA DOWNLOAD DO PDF
  const downloadPdf = () => {
    if (!pdfBlob || !selectedTicketForPdf) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFilename || `contrato-ticket-${selectedTicketForPdf}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // FUNÇÃO PARA INICIAR PROCESSO DE ASSINATURA
  const handleStartSignature = (ticket: any) => {
    if (!ticket.contract_pdf_url) {
      toast({
        title: 'Documento não encontrado',
        description: 'Este ticket não possui um documento para assinar.',
        variant: 'destructive',
      });
      return;
    }

    if (ticket.status === 'signed' || ticket.status === 'assinado') {
      toast({
        title: 'Documento já assinado',
        description: 'Este documento já foi assinado digitalmente.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedTicketForSignature(ticket);
    setSignaturePassword('');
    setAgreementChecked(false);
    setShowSignatureModal(true);
  };

  const handleConfirmSignature = async () => {
    if (!selectedTicketForSignature) return;
    if (!agreementChecked) {
      toast({
        title: 'Confirmação necessária',
        description: 'Você deve concordar com os termos para assinar o documento.',
        variant: 'destructive',
      });
      return;
    }

    if (!signaturePassword.trim()) {
      toast({
        title: 'Senha necessária',
        description: 'Digite sua senha para confirmar a assinatura.',
        variant: 'destructive',
      });
      return;
    }

    setSigningDocument(true);
    try {
      const success = await signDocument(selectedTicketForSignature.id, signaturePassword);
      if (success) {
        setShowSignatureModal(false);
        setSelectedTicketForSignature(null);
        setSignaturePassword('');
        setAgreementChecked(false);
      }
    } finally {
      setSigningDocument(false);
    }
  };

  // FUNÇÃO PARA INICIAR AÇÃO NA PROPOSTA (ACEITAR/REJEITAR)
  const handleProposalAction = (ticket: any, action: 'accept' | 'reject') => {
    setSelectedTicketForAction(ticket);
    setProposalAction(action);
    setShowProposalActionModal(true);
  };

  // FUNÇÃO PARA CONFIRMAR AÇÃO NA PROPOSTA
  const handleConfirmProposalAction = async () => {
    if (!selectedTicketForAction || !proposalAction) return;

    try {
      const success = await updateTicketStatus(
        selectedTicketForAction.id,
        proposalAction === 'accept' ? 'accepted' : 'rejected'
      );

      if (success) {
        setShowProposalActionModal(false);
        setSelectedTicketForAction(null);
        setProposalAction(null);
      }
    } catch (error) {
      console.error('Erro ao processar ação da proposta:', error);
    }
  };

  // Funções para gerenciar propostas (apenas para prestadores)
  const addProposalStep = () => {
    setProposalSteps([...proposalSteps, { title: '', price: 0 }]);
  };

  const removeProposalStep = (index: number) => {
    if (proposalSteps.length > 1) {
      setProposalSteps(proposalSteps.filter((_, i) => i !== index));
    }
  };

  const updateProposalStep = (index: number, field: 'title' | 'price', value: string | number) => {
    const updated = [...proposalSteps];
    updated[index] = { ...updated[index], [field]: value };
    setProposalSteps(updated);
  };

  const handleContractFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Erro', description: 'Selecione um PDF válido.', variant: 'destructive' });
      return;
    }
    setContractFile(file);
    const maybeTicketId = selectedTicketForPdf ?? getLatestProposal()?.id;
    if (maybeTicketId) {
      try {
        await savePdf(pdfLocalKey(maybeTicketId), file);
      } catch (err) {
        console.warn('Falha ao salvar PDF local:', err);
      }
    }
  };
  const handleSendProposal = async () => {
    if (!currentConversation || !user || !canCreateProposal()) return;
    const validSteps = proposalSteps.filter(step => step.title.trim() && step.price > 0);
    if (validSteps.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos uma etapa válida à proposta.',
        variant: 'destructive',
      });
      return;
    }

    setSendingProposal(true);
    try {
      const success = await createProposal(validSteps, contractFile || undefined);
      if (success) {
        setShowProposalModal(false);
        setProposalSteps([{ title: '', price: 0 }]);
        setContractFile(null);
      }
    } finally {
      setSendingProposal(false);
    }
  };

  const handleViewProposalDetails = async (ticketId: number) => {
    setLoadingSteps(true);
    try {
      const steps = await getStepsForTicket(ticketId);
      setSelectedTicketSteps(steps);
      setShowProposalDetails(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes da proposta.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSteps(false);
    }
  };

  // FUNÇÕES PARA GERENCIAR STEPS
  const handleEditStep = (step: any) => {
    setEditingStep(step.id);
    setEditStepData({ title: step.title, price: step.price });
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;

    const success = await updateStep(editingStep, {
      title: editStepData.title,
      price: editStepData.price
    });

    if (success) {
      setEditingStep(null);
      // Recarregar steps
      const updatedSteps = await getStepsForTicket(selectedTicketSteps[0]?.ticket_id);
      setSelectedTicketSteps(updatedSteps);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    const success = await deleteStep(stepId);
    if (success) {
      // Recarregar steps
      const updatedSteps = await getStepsForTicket(selectedTicketSteps[0]?.ticket_id);
      setSelectedTicketSteps(updatedSteps);
    }
  };

  const handleMarkStepCompleted = async (stepId: number) => {
    await markStepCompleted(stepId);
  };

  const handleConfirmStepCompletion = async (stepId: number, ticketId: number) => {
    await confirmStepCompletion(stepId, ticketId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentConversation?.id) {
      console.error('ERRO: Tentativa de enviar mensagem sem conversa selecionada');
      return;
    }
    await sendMessage();
  };

  const handleConversationClick = (conversation: any) => {
    if (!conversation.id) {
      console.error('ERRO: Conversa sem ID válido');
      return;
    }

    selectConversation(conversation);

    const newUrl = `/messages/${conversation.otherUser.id}`;
    setLocation(newUrl);
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  const formatConversationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: ptBR });
      } else {
        return format(date, 'dd/MM', { locale: ptBR });
      }
    } catch (error) {
      return '';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  const [localPdfFlags, setLocalPdfFlags] = useState<Record<number, boolean>>({});

  useEffect(() => {
    (async () => {
      const flags: Record<number, boolean> = {};
      for (const t of tickets) {
        try {
          const b = await getPdf(pdfLocalKey(t.id)); // IndexedDB
          flags[t.id] = !!b || !!t.contract_pdf_url;
        } catch {
          flags[t.id] = !!t.contract_pdf_url;
        }
      }
      setLocalPdfFlags(flags);
    })();
  }, [tickets]);
  // Obter a última proposta
  const latestProposal = getLatestProposal();
  const latestProposalSteps = latestProposal ? (ticketStepsMap[latestProposal.id] || []) : [];
  const latestProposalTotal = calculateProposalTotal(latestProposalSteps);
  const latestProposalStatusConfig = getStatusConfig(latestProposal?.status);

  // COMPONENTE DE PROPOSTA COMPACTO COM UX MELHORADA E TEMA LARANJA
  const ProposalCard = ({ ticket, steps, isLatest = false, hasPdf }: { ticket: any, steps: any[], isLatest?: boolean; hasPdf: boolean }) => {
    const total = calculateProposalTotal(steps);
    const statusConfig = getStatusConfig(ticket.status);
    const canInteract = user?.type === 'contratante' && ticket.status === 'pending';
    const isSigned = ticket.status === 'signed' || ticket.status === 'assinado';
    const canSign = user?.type === 'contratante' && ticket.status === 'accepted' && ticket.contract_pdf_url && !isSigned;
    const isAccepted = ticket.status === 'accepted';

    return (
      <div className={`group rounded-xl p-5 shadow-sm border transition-all duration-200 hover:shadow-md ${statusConfig.bgColor} ${statusConfig.borderColor} ${isLatest ? 'ring-2 ring-orange-200' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <statusConfig.icon className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Proposta #{ticket.id}
                {isLatest && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recente
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-gray-600">
              </p>
            </div>
          </div>
          <Badge className={statusConfig.badgeClass}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{steps.length} etapas</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProposalDetails(ticket.id)}
              className="flex-1 min-w-[120px]"
            >
              <Eye className="h-4 w-4 mr-2" />
              Detalhes
            </Button>

            {hasPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewPdf(ticket)}
                className="flex-1 min-w-[120px]"
              >
                Ver PDF
              </Button>
            )}

            {canInteract && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleProposalAction(ticket, 'accept')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 min-w-[100px]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aceitar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleProposalAction(ticket, 'reject')}
                  className="flex-1 min-w-[100px]"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </>
            )}

            {canSign && (
              <Button
                size="sm"
                onClick={() => handleStartSignature(ticket)}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 min-w-[120px]"
              >
                <Shield className="h-4 w-4 mr-2" />
                Assinar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // COMPONENTE DE VISUALIZAÇÃO DE PDF MELHORADO
  const PdfViewer = () => {
    if (!showPdfViewer) return null;

    return (
      <Dialog open={showPdfViewer} onOpenChange={closePdfViewer}>
        <DialogContent className={`${fullscreenPdf ? 'max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[80vh] w-full h-[80vh]'} p-0`} >
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedTicketForPdf ? `Contrato - Ticket #${selectedTicketForPdf}` : 'Contrato'}
                </DialogTitle>
                <DialogDescription id="pdf-desc" className="sr-only">
                  Visualizador de PDF do contrato deste ticket.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadPdf} disabled={!pdfBlob}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFullscreenPdf(!fullscreenPdf)}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4">
            {loadingPdf ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Carregando PDF...</p>
                </div>
              </div>
            ) : pdfError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">Erro ao carregar PDF</p>
                  <p className="text-gray-600 mt-2">{pdfError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedTicketForPdf && handleViewPdf(selectedTicketForPdf)}
                    className="mt-4"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-lg"
                title={`Contrato - Ticket #${selectedTicketForPdf ?? ''}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum PDF disponível</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <AplicationLayout>
      <div className="flex h-screen bg-gray-50">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </h1>
              {unreadMessageCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadMessageCount}
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Carregando conversas...</p>
              </div>
            ) : conversationsError ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600">Erro ao carregar conversas</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationClick(conversation)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${currentConversation?.id === conversation.id
                      ? 'bg-orange-50 border border-orange-200'
                      : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {getInitials(conversation.otherUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">
                            {conversation.otherUser.name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatConversationTime(conversation.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage?.content || 'Nenhuma mensagem'}
                          </p>
                          <Badge
                            variant={conversation.otherUser.type === 'prestador' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conversation.otherUser.type === 'prestador' ? 'Prestador' : 'Cliente'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {getInitials(currentConversation.otherUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {currentConversation.otherUser.name}
                      </h2>
                      <Badge
                        variant={currentConversation.otherUser.type === 'prestador' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {currentConversation.otherUser.type === 'prestador' ? 'Prestador' : 'Cliente'}
                      </Badge>
                    </div>
                  </div>

                  {canCreateProposal() && (
                    <Button
                      onClick={() => setShowProposalModal(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Proposta
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex">
                <div className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Carregando mensagens...</p>
                      </div>
                    ) : messagesError ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-red-600">Erro ao carregar mensagens</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Nenhuma mensagem ainda</p>
                        <p className="text-xs text-gray-500 mt-1">Envie uma mensagem para começar a conversa</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender_id === user?.id
                                ? 'bg-orange-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                                }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${message.sender_id === user?.id ? 'text-orange-100' : 'text-gray-500'
                                  }`}
                              >
                                {formatMessageTime(message.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                        disabled={sendingMessage}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Sidebar de propostas */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Propostas
                    </h3>
                  </div>

                  <ScrollArea className=" p-4">
                    {loadingTickets ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Carregando propostas...</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Nenhuma proposta ainda</p>
                        {canCreateProposal() && (
                          <p className="text-xs text-gray-500 mt-1">Crie uma proposta para começar</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tickets
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((ticket, index) => (
                            <ProposalCard
                              key={ticket.id}
                              ticket={ticket}
                              steps={ticketStepsMap[ticket.id] || []}
                              isLatest={index === 0}
                              hasPdf={!!localPdfFlags[ticket.id]}
                            />
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                <p className="text-gray-600">Escolha uma conversa da lista para começar a trocar mensagens</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Proposta */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Proposta</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Etapas da Proposta</Label>
              <p className="text-sm text-gray-600 mb-4">Defina as etapas e valores do seu serviço</p>

              <div className="space-y-3">
                {proposalSteps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`step-title-${index}`}>Etapa {index + 1}</Label>
                      <Input
                        id={`step-title-${index}`}
                        value={step.title}
                        onChange={(e) => updateProposalStep(index, 'title', e.target.value)}
                        placeholder="Descrição da etapa"
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`step-price-${index}`}>Valor (R$)</Label>
                      <Input
                        id={`step-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={step.price}
                        onChange={(e) => updateProposalStep(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeProposalStep(index)}
                      disabled={proposalSteps.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addProposalStep}
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Etapa
              </Button>
            </div>

            <div>
              <Label htmlFor="contract-file">Contrato (PDF - Opcional)</Label>
              <Input
                id="contract-file"
                type="file"
                accept=".pdf"
                onChange={handleContractFileChange}
                className="mt-1"
              />
              {contractFile && (
                <p className="text-sm text-green-600 mt-1">
                  Arquivo selecionado: {contractFile.name}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total da Proposta:</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(proposalSteps.reduce((sum, step) => sum + (step.price || 0), 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProposalModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendProposal}
                disabled={sendingProposal}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {sendingProposal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Proposta
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Proposta */}
      <Dialog open={showProposalDetails} onOpenChange={setShowProposalDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
          </DialogHeader>

          {loadingSteps ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Carregando detalhes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedTicketSteps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Etapa {index + 1}</h4>
                    <Badge variant="outline">
                      {step.status === 'completed' ? 'Concluída' :
                        step.status === 'in_progress' ? 'Em Andamento' :
                          step.status === 'awaiting_confirmation' ? 'Aguardando Confirmação' :
                            'Pendente'}
                    </Badge>
                  </div>

                  {editingStep === step.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editStepData.title}
                        onChange={(e) => setEditStepData({ ...editStepData, title: e.target.value })}
                        placeholder="Título da etapa"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editStepData.price}
                        onChange={(e) => setEditStepData({ ...editStepData, price: parseFloat(e.target.value) || 0 })}
                        placeholder="Valor"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveStep}>
                          <Check className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingStep(null)}>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 mb-2">{step.title}</p>
                      <p className="font-semibold text-lg">{formatCurrency(step.price)}</p>

                      {user?.type === 'prestador' && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => handleEditStep(step)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteStep(step.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </Button>
                          {step.status === 'in_progress' && !step.provider_completed && (
                            <Button size="sm" onClick={() => handleMarkStepCompleted(step.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Concluído
                            </Button>
                          )}
                        </div>
                      )}

                      {user?.type === 'contratante' && step.provider_completed && !step.client_confirmed && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirmStepCompletion(step.id, step.ticket_id)}
                          className="mt-3"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmar Conclusão
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(calculateProposalTotal(selectedTicketSteps))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Ação na Proposta */}
      <Dialog open={showProposalActionModal} onOpenChange={setShowProposalActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {proposalAction === 'accept' ? 'Aceitar Proposta' : 'Rejeitar Proposta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>
              Tem certeza que deseja {proposalAction === 'accept' ? 'aceitar' : 'rejeitar'} esta proposta?
            </p>

            {proposalAction === 'accept' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Ao aceitar esta proposta, o primeiro passo será automaticamente iniciado.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowProposalActionModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmProposalAction}
                className={`flex-1 ${proposalAction === 'accept'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {proposalAction === 'accept' ? 'Aceitar' : 'Rejeitar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Assinatura Digital */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinatura Digital</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900">Assinatura Digital Segura</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Sua assinatura será registrada com timestamp e validação de senha.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="signature-password">Confirme sua senha</Label>
              <Input
                id="signature-password"
                type="password"
                value={signaturePassword}
                onChange={(e) => setSignaturePassword(e.target.value)}
                placeholder="Digite sua senha de login"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreement"
                checked={agreementChecked}
                onCheckedChange={(checked) => setAgreementChecked(checked as boolean)}
              />
              <Label htmlFor="agreement" className="text-sm">
                Concordo com os termos do contrato e autorizo a assinatura digital
              </Label>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSignatureModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSignature}
                disabled={signingDocument || !agreementChecked || !signaturePassword.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {signingDocument ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assinando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Assinar Documento
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Componente de Visualização de PDF */}
      <PdfViewer />
    </AplicationLayout>
  );
}


