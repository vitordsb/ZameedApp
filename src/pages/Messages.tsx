
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Send, Users, MessageCircle, ArrowLeft, FileText, CheckCircle, XCircle, Plus, Minus, Clock, DollarSign, Eye, List, Info, PaperclipIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AplicationLayout from '@/components/layouts/ApplicationLayout';

export default function Messages() {
  const [location, setLocation] = useLocation();
  const { userId } = useParams<{ userId?: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Usar userId da URL como initialPartnerId
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
    hasActiveTicket,
    updateTicketStatus,
  } = useMessaging(initialPartnerId);

  // Estados para modal de proposta
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalSteps, setProposalSteps] = useState([{ title: '', price: 0 }]);
  const [sendingProposal, setSendingProposal] = useState(false);
  
  // Estados para visualização de propostas
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [showAllProposals, setShowAllProposals] = useState(false);
  const [selectedTicketSteps, setSelectedTicketSteps] = useState<any[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [ticketStepsMap, setTicketStepsMap] = useState<Record<number, any[]>>({});
  
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

  // FUNÇÃO PARA CALCULAR TOTAL DE UMA PROPOSTA
  const calculateProposalTotal = (steps: any[]) => {
    return steps.reduce((sum, step) => sum + (step.price || 0), 0);
  };

  // FUNÇÃO PARA FORMATAR MOEDA
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // FUNÇÃO PARA OBTER STATUS CONFIG
  const getStatusConfig = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'aceito':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Aceita',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
      case 'rejeitado':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Rejeitada',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'in_progress':
      case 'em_andamento':
        return {
          variant: 'default' as const,
          icon: Clock,
          label: 'Em Andamento',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'pending':
      case 'pendente':
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: 'Pendente',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
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

  const handleSendProposal = async () => {
    if (!currentConversation || !user || !canCreateProposal()) return;

    // Validar steps
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
      const success = await createProposal(validSteps);
      if (success) {
        setShowProposalModal(false);
        setProposalSteps([{ title: '', price: 0 }]);
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

  // Obter a última proposta
  const latestProposal = getLatestProposal();
  const latestProposalSteps = latestProposal ? (ticketStepsMap[latestProposal.id] || []) : [];
  const latestProposalTotal = calculateProposalTotal(latestProposalSteps);
  const latestProposalStatusConfig = getStatusConfig(latestProposal?.status);

  // COMPONENTE DE PROPOSTA BASEADO NA IMAGEM
  const ProposalCard = ({ ticket, steps, isLatest = false }: { ticket: any, steps: any[], isLatest?: boolean }) => {
    const total = calculateProposalTotal(steps);
    const statusConfig = getStatusConfig(ticket.status);
    const canInteract = user?.type === 'contratante' && ticket.status === 'pending';

    return (
      <div className={`rounded-lg p-4 shadow-md ${isLatest ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 'bg-gradient-to-br from-orange-300 to-amber-400'} text-white relative overflow-hidden`}>
        {/* Header com ícone de anexo */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1 rounded-md">
              <PaperclipIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Proposta de Projeto</h3>
              <p className="text-orange-100 text-xs">#{ticket.id}</p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs`}
          >
            <statusConfig.icon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Valor total destacado */}
        <div className="mb-4">
          <p className="text-orange-100 text-xs mb-1">Valor total:</p>
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </div>

        {/* Fases */}
        <div className="mb-4">
          <p className="text-orange-100 text-xs mb-2">Fases</p>
          <div className="space-y-1">
            {steps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="bg-white/10 rounded-md p-2 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-sm font-bold">{formatCurrency(step.price)}</span>
                </div>
              </div>
            ))}
            {steps.length > 3 && (
              <div className="bg-white/10 rounded-md p-2 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">+{steps.length - 3} Fases</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProposalDetails(ticket.id)}
                    className="text-white hover:bg-white/20 h-auto p-1 text-xs"
                  >
                    Ver mais
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {canInteract && (
            <>
              <Button
                onClick={() => updateTicketStatus(ticket.id, 'accepted')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 text-sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Aceitar
              </Button>
              <Button
                onClick={() => updateTicketStatus(ticket.id, 'rejected')}
                variant="outline"
                className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </>
          )}
          {!canInteract && (
            <Button
              onClick={() => handleViewProposalDetails(ticket.id)}
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver detalhes
            </Button>
          )}
        </div>

        {/* Mensagem de status final */}
        {ticket.status === 'accepted' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-100">
            <CheckCircle className="h-4 w-4 text-green-300" />
            Proposta Aceita!
          </div>
        )}
        {ticket.status === 'rejected' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-100">
            <XCircle className="h-4 w-4 text-red-300" />
            Proposta Rejeitada.
          </div>
        )}
        {ticket.status === 'pending' && user?.type === 'contratante' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-100">
            <Clock className="h-4 w-4" />
            Aguardando sua decisão.
          </div>
        )}
        {ticket.status === 'pending' && user?.type === 'prestador' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-100">
            <Clock className="h-4 w-4" />
            Aguardando resposta do cliente.
          </div>
        )}
      </div>
    );
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (conversationsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar conversas</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AplicationLayout>
      {/* CONTAINER PRINCIPAL COM ALTURA MÁXIMA DE 90VH */}
      <div className="px-4 py-4 max-h-[90vh] overflow-hidden">
        
        {/* GRID COM ALTURA CALCULADA PARA PERMITIR SCROLL INTERNO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(90vh-2rem)]">
          
          {/* PAINEL DE CONVERSAS */}
          <Card className="lg:col-span-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {canCreateProposal() ? 'Contatos com propostas' : 'Conversas'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              {/* SCROLLAREA COM ALTURA ESPECÍFICA PARA ATIVAR SCROLL */}
              <ScrollArea className="h-[calc(90vh-8rem)]">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-sm">
                      {canCreateProposal() 
                        ? 'Inicie uma conversa visitando o perfil de um cliente no menu principal'
                        : 'Inicie uma conversa visitando o perfil de um prestador no menu principal'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          currentConversation?.id === conversation.id
                            ? 'bg-orange-50 border-l-4 border-orange-500'
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.otherUser.name}`} 
                              />
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {getInitials(conversation.otherUser.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {conversation.otherUser.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={conversation.otherUser.type === 'prestador' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {conversation.otherUser.type === 'prestador' ? 'Prestador' : 'Cliente'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {formatConversationTime(conversation.updated_at)}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 truncate mt-1">
                              {conversation.lastMessage?.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* PAINEL DE MENSAGENS */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {currentConversation ? (
              <>
                {/* HEADER DA CONVERSA */}
                <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentConversation.otherUser.name}`} 
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {getInitials(currentConversation.otherUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {currentConversation.otherUser.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={currentConversation.otherUser.type === 'prestador' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {currentConversation.otherUser.type === 'prestador' ? 'Prestador' : 'Cliente'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-500">Online</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicador de Proposta Ativa */}
                    {hasActiveTicket() && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <FileText className="h-3 w-3 mr-1" />
                        Proposta Ativa
                      </Badge>
                    )}

                    {/* BOTÃO NOVA PROPOSTA - APENAS PARA PRESTADORES QUE NÃO ESTÃO CONVERSANDO COM OUTROS PRESTADORES */}
                    {canCreateProposal() && (
                      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="h-4 w-4 mr-1" />
                            Nova Proposta
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle>Criar Nova Proposta</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[70vh] pr-4">
                            <div className="space-y-4">
                              <div className="space-y-3">
                                {proposalSteps.map((step, index) => (
                                  <div key={index} className="flex gap-3 items-end">
                                    <div className="flex-1">
                                      <Label htmlFor={`step-title-${index}`}>Título da Etapa</Label>
                                      <Input
                                        id={`step-title-${index}`}
                                        value={step.title}
                                        onChange={(e) => updateProposalStep(index, 'title', e.target.value)}
                                        placeholder="Ex: Análise inicial do projeto"
                                      />
                                    </div>
                                    <div className="w-32">
                                      <Label htmlFor={`step-price-${index}`}>Preço (R$)</Label>
                                      <Input
                                        id={`step-price-${index}`}
                                        type="number"
                                        value={step.price}
                                        onChange={(e) => updateProposalStep(index, 'price', parseFloat(e.target.value) || 0)}
                                        placeholder="0,00"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
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
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Etapa
                              </Button>

                              <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-lg font-semibold">
                                  Total: R$ {calculateProposalTotal(proposalSteps).toFixed(2)}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => setShowProposalModal(false)}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={handleSendProposal}
                                    disabled={sendingProposal}
                                  >
                                    {sendingProposal ? 'Enviando...' : 'Enviar Proposta'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                
                <Separator />

                {/* ÁREA DE PROPOSTA - EXIBIDA PARA TODOS OS USUÁRIOS QUANDO HÁ PROPOSTAS */}
                {latestProposal && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        {canCreateProposal() ? 'Última Proposta Enviada' : 'Proposta Recebida'}
                        {tickets.length > 1 && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {tickets.length} total
                          </Badge>
                        )}
                      </h4>
                      
                      {tickets.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllProposals(true)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <List className="h-3 w-3 mr-1" />
                          Ver Todas
                        </Button>
                      )}
                    </div>
                    
                    {/* CARD DA PROPOSTA BASEADO NA IMAGEM */}
                    <ProposalCard 
                      ticket={latestProposal} 
                      steps={latestProposalSteps} 
                      isLatest={true}
                    />
                  </div>
                )}

                {/* ÁREA DE MENSAGENS */}
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-[calc(90vh-20rem)] p-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Inicie a conversa enviando uma mensagem</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender_id === user?.id
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.sender_id === user?.id
                                    ? 'text-orange-100'
                                    : 'text-gray-500'
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
                </CardContent>

                {/* ÁREA DE INPUT DE MENSAGEM */}
                <div className="p-4 border-t flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      size="icon"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Selecione uma conversa</p>
                  <p className="text-sm">Escolha uma conversa para começar a trocar mensagens</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* MODAL DE DETALHES DA PROPOSTA */}
        <Dialog open={showProposalDetails} onOpenChange={setShowProposalDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Proposta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTicketSteps.map((step, index) => (
                <div key={step.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-gray-500">Etapa {index + 1}</p>
                  </div>
                  <p className="font-bold text-lg">{formatCurrency(step.price)}</p>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold">Total:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateProposalTotal(selectedTicketSteps))}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL DE TODAS AS PROPOSTAS */}
        <Dialog open={showAllProposals} onOpenChange={setShowAllProposals}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Todas as Propostas</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="grid gap-4">
                {tickets.map((ticket) => {
                  const steps = ticketStepsMap[ticket.id] || [];
                  return (
                    <ProposalCard 
                      key={ticket.id}
                      ticket={ticket} 
                      steps={steps} 
                      isLatest={false}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AplicationLayout>
  );
}


