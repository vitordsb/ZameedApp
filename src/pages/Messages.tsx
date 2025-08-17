
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
import { Send, Users, MessageCircle, ArrowLeft, FileText, CheckCircle, XCircle, Plus, Minus, Clock, DollarSign, Eye, List, Info } from 'lucide-react';
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
    return user?.type === 'prestador';
  };

  useEffect(() => {
  }, [initialPartnerId, currentConversation, conversations, tickets, user]);

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
          label: 'Aceito',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
      case 'rejeitado':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Rejeitado',
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
                  </div>
                </CardHeader>
                
                <Separator />

                {/* ÁREA DE PROPOSTA - EXIBIDA PARA TODOS OS USUÁRIOS QUANDO HÁ PROPOSTAS */}
                {latestProposal && (
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        {canCreateProposal() ? 'Última Proposta Enviada' : 'Proposta Recebida'}
                        {tickets.length > 1 && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {tickets.length} total
                          </Badge>
                        )}
                      </h4>
                      
                      <div className="flex items-center gap-2">
                        {tickets.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllProposals(true)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <List className="h-3 w-3 mr-1" />
                            Ver Mais Propostas
                          </Button>
                        )}
                        
                        {/* BOTÃO NOVA PROPOSTA - APENAS PARA PRESTADORES */}
                        {canCreateProposal() && !hasActiveTicket() && (
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

                        {/* INFORMAÇÃO PARA CONTRATANTES */}
                        {!canCreateProposal() && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span>Apenas prestadores podem criar propostas</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* CARD DA ÚLTIMA PROPOSTA - VISÍVEL PARA TODOS */}
                    <Card className={`${latestProposalStatusConfig.bgColor} ${latestProposalStatusConfig.borderColor} border-2`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${latestProposalStatusConfig.bgColor}`}>
                              <FileText className={`h-4 w-4 ${latestProposalStatusConfig.color}`} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                Proposta #{latestProposal.id}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={latestProposalStatusConfig.variant} className="text-xs">
                                  <latestProposalStatusConfig.icon className="h-3 w-3 mr-1" />
                                  {latestProposalStatusConfig.label}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-bold text-lg">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">{formatCurrency(latestProposalTotal)}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {latestProposalSteps.length} etapa{latestProposalSteps.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 flex-1 min-w-0 mr-2">
                            {latestProposalSteps.length > 0 ? (
                              <span className="truncate">
                                Primeira etapa: {latestProposalSteps[0]?.title}
                                {latestProposalSteps.length > 1 && ` +${latestProposalSteps.length - 1} mais`}
                              </span>
                            ) : (
                              <span>Carregando detalhes...</span>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProposalDetails(latestProposal.id)}
                            disabled={loadingSteps}
                            className={`${latestProposalStatusConfig.color} hover:bg-white/50 flex-shrink-0`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ÁREA DE MENSAGENS COM SCROLL ESPECÍFICO */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <ScrollArea className={latestProposal ? "h-[calc(90vh-20rem)]" : "h-[calc(90vh-12rem)]"}>
                    <div className="p-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                        </div>
                      ) : messagesError ? (
                        <div className="text-center text-red-600 p-4">
                          Erro ao carregar mensagens
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 p-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
                          <p className="text-sm">
                            {canCreateProposal() 
                              ? 'Inicie a conversa enviando uma mensagem ou criando uma proposta'
                              : 'Inicie a conversa enviando uma mensagem'
                            }
                          </p>
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
                                    : 'bg-gray-200 text-gray-900'
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
                    </div>
                  </ScrollArea>

                  {/* INPUT DE MENSAGEM */}
                  <div className="p-4 border-t bg-white flex-shrink-0">
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
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                  <p className="text-sm">
                    Escolha uma conversa da lista para começar a trocar mensagens
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* MODAL PARA VER TODAS AS PROPOSTAS - DISPONÍVEL PARA TODOS */}
        <Dialog open={showAllProposals} onOpenChange={setShowAllProposals}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {canCreateProposal() ? 'Todas as Propostas Enviadas' : 'Todas as Propostas Recebidas'} ({tickets.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const steps = ticketStepsMap[ticket.id] || [];
                  const total = calculateProposalTotal(steps);
                  const statusConfig = getStatusConfig(ticket.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={ticket.id} className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                              <FileText className={`h-4 w-4 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                Proposta #{ticket.id}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={statusConfig.variant} className="text-xs">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-1 font-bold text-lg">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">{formatCurrency(total)}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {steps.length} etapa{steps.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowAllProposals(false);
                                handleViewProposalDetails(ticket.id);
                              }}
                              className={`${statusConfig.color} hover:bg-white/50`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={showProposalDetails} onOpenChange={setShowProposalDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Detalhes da Proposta
              </DialogTitle>
            </DialogHeader>
            <Separator />
            <ScrollArea className="flex-1 p-6">
              {loadingSteps ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-gray-600">Carregando detalhes...</span>
                </div>
              ) : selectedTicketSteps.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma etapa encontrada
                  </h3>
                  <p className="text-gray-500">
                    Esta proposta ainda não possui etapas definidas.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Etapas do Projeto ({selectedTicketSteps.length})
                    </h3>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateProposalTotal(selectedTicketSteps))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedTicketSteps.map((step, index) => (
                      <Card key={step.id} className="bg-white border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {step.title}
                              </h4>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Etapa {index + 1} de {selectedTicketSteps.length}
                                </span>
                                <div className="flex items-center gap-1 font-bold text-lg">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600">{formatCurrency(step.price)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AplicationLayout>
  );
}


