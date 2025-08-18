
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  isNegotiation: boolean;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: number;
    name: string;
    email: string;
    type: "prestador" | "contratante";
  };
  lastMessage?: {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
    type?: string;
  };
  unreadCount: number;
}

// INTERFACE MELHORADA PARA MENSAGENS COM SUPORTE A PROPOSTAS
export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  type?: 'text' | 'proposal'; // Novo campo para tipo de mensagem
  proposal_data?: {
    ticket_id: number;
    steps: Array<{
      id: number;
      title: string;
      price: number;
      status?: string;
    }>;
    total: number;
    status?: string;
  };
}

export interface Ticket {
  id: number;
  conversation_id: number;
  created_at: string;
  updated_at: string;
  status?: string;
}

export interface Step {
  id: number;
  ticket_id: number;
  title: string;
  price: number;
  created_at: string;
  updated_at: string;
  status?: string;
}

export interface CreateConversationRequest {
  user1_id: number;
  user2_id: number;
}

export interface CreateMessageRequest {
  conversation_id: number;
  content: string;
  type?: 'text' | 'proposal';
  proposal_data?: any;
}

export interface CreateTicketRequest {
  conversation_id: number;
}

export interface CreateStepRequest {
  ticket_id: number;
  title: string;
  price: number;
}

export function useMessaging(initialPartnerId?: string | null) {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Buscar todas as conversas do usuário
  const { 
    data: conversationsData, 
    isLoading: loadingConversations, 
    error: conversationsError,
    refetch: refetchConversations 
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/conversation');
      if (!response.ok) {
        throw new Error('Erro ao buscar conversas');
      }
      const data = await response.json();
      return data;
    },
    enabled: isLoggedIn && !!user,
    staleTime: 10000,
    refetchInterval: 100000,
  });

  // Buscar dados de usuários para as conversas
  const userIds = useMemo(() => {
    if (!conversationsData?.conversations || !user) return [];
    
    const ids = conversationsData.conversations.map((conv: any) => {
      return conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    });
    
    return ids;
  }, [conversationsData, user]);

  // Query para buscar dados dos usuários
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      console.log('🔍 Buscando dados dos usuários:', userIds);
      
      const userPromises = userIds.map(async (userId: number) => {
        try {
          const response = await apiRequest('GET', `/users/${userId}`);
          if (!response.ok) {
            console.error(`❌ Erro ao buscar usuário ${userId}: Status ${response.status}`);
            return { id: userId, data: null };
          }
          const data = await response.json();
          return { id: userId, data: data.user };
        } catch (error) {
          console.error(`❌ Erro ao buscar usuário ${userId}:`, error);
          return { id: userId, data: null };
        }
      });

      const results = await Promise.all(userPromises);
      const usersMap: Record<number, any> = {};
      
      results.forEach(({ id, data }) => {
        usersMap[id] = data || {
          id,
          name: 'Usuário',
          email: '',
          type: 'contratante' as const
        };
      });
      return usersMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Processar conversas com dados dos usuários
  const processedConversations: Conversation[] = useMemo(() => {
    if (!conversationsData?.conversations || !user || !usersData) {
      return [];
    }
    const tempProcessed = conversationsData.conversations
      .map((conv: any) => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        const otherUser = usersData[otherUserId];

        const processedConv: Conversation = {
          id: conv.conversation_id, 
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          isNegotiation: true,
          created_at: conv.createdAt, 
          updated_at: conv.updatedAt, 
          otherUser: otherUser || {
            id: otherUserId,
            name: 'Usuário',
            email: '',
            type: 'contratante' as const
          },
          unreadCount: 0 
        };

        if (!processedConv.id || typeof processedConv.id !== 'number') {
          console.error('❌ Conversa processada sem ID válido!', processedConv);
          return null;
        }
        
        return processedConv;
      })
      .filter((conv: Conversation | null) => conv !== null) as Conversation[];

    return tempProcessed;
  }, [conversationsData, user, usersData]);

  const createConversationMutation = useMutation({
    mutationFn: async (data: CreateConversationRequest) => {
      const response = await apiRequest('POST', '/conversation', data);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao criar conversa:', errorText);
        throw new Error(`Erro ao criar conversa: ${response.status}`);
      }
      const result = await response.json();
      return result;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // Aguardar um pouco para garantir que os dados sejam atualizados
      setTimeout(async () => {
        await refetchConversations();
      }, 500);
      
      toast({
        title: 'Conversa criada',
        description: 'Nova conversa iniciada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao criar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conversa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // MUTATION MELHORADA PARA ENVIAR MENSAGENS COM SUPORTE A PROPOSTAS
  const sendMessageMutation = useMutation({
    mutationFn: async (data: CreateMessageRequest) => {
      if (!data.conversation_id || !data.content?.trim()) {
        throw new Error('Dados inválidos para envio de mensagem');
      }
      
      const response = await apiRequest('POST', '/message', {
        conversation_id: data.conversation_id,
        content: data.content.trim(),
        type: data.type || 'text',
        proposal_data: data.proposal_data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao enviar mensagem:', errorText);
        throw new Error(`Erro ao enviar mensagem: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Função para iniciar conversa
  const startConversation = useCallback(async (targetUserId: number) => {
    if (!user || !isLoggedIn) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para iniciar uma conversa.',
        variant: 'destructive',
      });
      return false;
    }

    if (isInitializing) {
      return false;
    }

    try {
      setIsInitializing(true);
      const existingConversation = processedConversations.find(conv => 
        conv.otherUser.id === targetUserId
      );
      if (existingConversation) {
        setCurrentConversation(existingConversation);
        return true;
      }
      await createConversationMutation.mutateAsync({
        user1_id: user.id,
        user2_id: targetUserId,
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao iniciar conversa:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [user, isLoggedIn, processedConversations, createConversationMutation, toast, isInitializing]);

  // Função para iniciar conversa e navegar (simplificada)
  const startConversationAndNavigate = useCallback(async (targetUserId: number, setLocation: (path: string) => void) => {
    const conversation = await startConversation(targetUserId);
    if (conversation) {
      setLocation(`/messages/${targetUserId}`);
    }
  }, [startConversation]);

  useEffect(() => {
    if (loadingConversations || loadingUsers || isInitializing) {
      return;
    }

    if (initialPartnerId) {
      const targetId = parseInt(initialPartnerId);
      
      const targetConversation = processedConversations.find(conv => {
        return conv.otherUser.id === targetId;
      });

      if (targetConversation) {
        setCurrentConversation(targetConversation);
      } else {
        console.log("❌ Nenhuma conversa encontrada para initialPartnerId, tentando criar...");
        if (!isInitializing) {
          startConversation(targetId);
        }
      }
    } else if (!currentConversation && processedConversations.length > 0) {
      const mostRecentConversation = processedConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      if (mostRecentConversation) {
        setCurrentConversation(mostRecentConversation);
      }
    }

  }, [initialPartnerId, processedConversations, loadingConversations, loadingUsers, isInitializing, startConversation]);

  useEffect(() => {
    if (initialPartnerId && !loadingConversations && !loadingUsers && processedConversations.length > 0) {
      const targetId = parseInt(initialPartnerId);
      const newConversation = processedConversations.find(conv => conv.otherUser.id === targetId);
      
      if (newConversation && (!currentConversation || currentConversation.id !== newConversation.id)) {
        setCurrentConversation(newConversation);
      }
    }
  }, [processedConversations, initialPartnerId, currentConversation, loadingConversations, loadingUsers]);

  const { 
    data: messages = [], 
    isLoading: loadingMessages,
    error: messagesError,
    refetch: refetchMessages 
  } = useQuery<Message[]>({
    queryKey: ['messages', currentConversation?.id],
    queryFn: async () => {
      if (!currentConversation?.id) {
        console.warn('⚠️ Tentativa de buscar mensagens sem ID de conversa válido');
        return [];
      }
      
      const response = await apiRequest('GET', `/message/conversation/${currentConversation.id}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar mensagens: ${response.status}`);
      }
      const data = await response.json();
      const processedMessages = (data.messages || []).map((msg: any) => {
        if (msg.content.includes('📋') && msg.content.includes('**') && msg.content.includes('Total:')) {
          return {
            ...msg,
            type: 'proposal'
          };
        }
        return {
          ...msg,
          type: 'text'
        };
      });
      
      return processedMessages;
    },
    enabled: !!currentConversation?.id && isLoggedIn && typeof currentConversation.id === 'number',
    staleTime: 1000,
    refetchInterval: 1500,
  });

  const selectConversation = useCallback((conversation: Conversation) => {
    if (!conversation || !conversation.id || typeof conversation.id !== 'number') {
      console.error('❌ Tentativa de selecionar conversa inválida:', conversation);
      return;
    }
    setCurrentConversation(conversation);
  }, []);

  // Função para enviar mensagem
  const sendMessage = useCallback(async () => {
    if (!currentConversation || !newMessage.trim()) {
      console.warn('⚠️ Tentativa de enviar mensagem sem conversa ou conteúdo');
      return;
    }

    await sendMessageMutation.mutateAsync({
      conversation_id: currentConversation.id,
      content: newMessage.trim(),
      type: 'text'
    });
  }, [currentConversation, newMessage, sendMessageMutation]);

  // Query para buscar tickets de uma conversa - MELHORADA
  const { 
    data: tickets = [], 
    isLoading: loadingTickets 
  } = useQuery<Ticket[]>({
    queryKey: ['tickets', currentConversation?.id],
    queryFn: async () => {
      if (!currentConversation?.id) return [];
      
      const response = await apiRequest('GET', `/ticket/conversation/${currentConversation.id}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar tickets: ${response.status}`);
      }
      const data = await response.json();
      return data.tickets || [];
    },
    enabled: !!currentConversation?.id && isLoggedIn,
    staleTime: 30000,
  });

  // Query para buscar steps de um ticket específico - MELHORADA
  const getStepsForTicket = useCallback(async (ticketId: number): Promise<Step[]> => {
    try {
      const response = await apiRequest('GET', `/step/${ticketId}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar steps: ${response.status}`);
      }
      const data = await response.json();
      return data.steps || [];
    } catch (error) {
      console.error('❌ Erro ao buscar steps:', error);
      return [];
    }
  }, []);

  // Função para verificar se já existe um ticket ativo na conversa atual
  const hasActiveTicket = useCallback(() => {
    if (!currentConversation || !tickets) return false;
    const activeTicket = tickets.find(ticket => 
      ticket.conversation_id === currentConversation.id && 
      (!ticket.status || ticket.status === 'open' || ticket.status === 'in_progress' || ticket.status === 'pending')
    );
    
    return !!activeTicket;
  }, [currentConversation, tickets]);

  // Função para buscar ticket ativo da conversa atual
  const getActiveTicket = useCallback(() => {
    if (!currentConversation || !tickets) return null;
    const activeTicket = tickets.find(ticket => 
      ticket.conversation_id === currentConversation.id && 
      (!ticket.status || ticket.status === 'open' || ticket.status === 'in_progress' || ticket.status === 'pending')
    );
    
    return activeTicket || null;
  }, [currentConversation, tickets]);

  // FUNÇÃO MELHORADA PARA CRIAR PROPOSTA COMO MENSAGEM
  const createProposal = useCallback(async (steps: Omit<CreateStepRequest, 'ticket_id'>[]) => {
    if (!currentConversation) {
      toast({
        title: 'Erro',
        description: 'Nenhuma conversa selecionada.',
        variant: 'destructive',
      });
      return false;
    }

    if (!user || user.type !== 'prestador') {
      toast({
        title: 'Erro',
        description: 'Apenas prestadores podem enviar propostas.',
        variant: 'destructive',
      });
      return false;
    }

    let ticketId: number;
    
    try {
      const existingActiveTicket = getActiveTicket();
      if (existingActiveTicket) {
        ticketId = existingActiveTicket.id;
      } else {
        console.log('🎫 Criando novo ticket...');
        const ticketResponse = await apiRequest('POST', '/ticket', {
          conversation_id: currentConversation.id
        });
        if (!ticketResponse.ok) {
          const errorText = await ticketResponse.text();
          console.error('❌ Erro ao criar ticket:', errorText);
          throw new Error(`Erro ao criar ticket: ${errorText}`);
        }
        const ticketResult = await ticketResponse.json();
        ticketId = ticketResult.ticketService?.id || ticketResult.ticket?.id;
        if (!ticketId) {
          throw new Error('ID do ticket não retornado pela API');
        }
      }

      const createdSteps = [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        try {
          const stepResponse = await apiRequest('POST', '/step', {
            ticket_id: ticketId,
            title: step.title,
            price: step.price,
          });

          if (!stepResponse.ok) {
            const errorText = await stepResponse.text();
            console.error(`❌ Erro ao criar step ${i + 1}:`, errorText);
            throw new Error(`Erro ao criar etapa ${i + 1}: ${errorText}`);
          }

          const stepResult = await stepResponse.json();
          createdSteps.push({
            id: stepResult.step?.id || stepResult.id,
            title: step.title,
            price: step.price,
            status: 'pending'
          });
        } catch (stepError) {
          console.error(`❌ Erro ao criar step ${i + 1}:`, stepError);
          throw new Error(`Falha ao criar etapa ${i + 1}: ${step.title}`);
        }
      }

      const totalPrice = steps.reduce((sum, s) => sum + s.price, 0);
      
      const proposalData = {
        ticket_id: ticketId,
        steps: createdSteps,
        total: totalPrice,
        status: 'pending'
      };

      // Enviar mensagem de proposta
      await sendMessageMutation.mutateAsync({
        conversation_id: currentConversation.id,
        content: `📋 Nova proposta enviada! Ticket #${ticketId} - Total: R$ ${totalPrice.toFixed(2)}`, 
        type: 'proposal',
        proposal_data: proposalData
      });

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      toast({
        title: 'Proposta enviada',
        description: 'Sua proposta foi enviada com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao criar proposta:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar proposta',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentConversation, user, getActiveTicket, sendMessageMutation, queryClient, toast]);

  // NOVA FUNÇÃO PARA ACEITAR/REJEITAR PROPOSTA
  const updateTicketStatus = useCallback(async (ticketId: number, status: 'accepted' | 'rejected') => {
    if (!currentConversation) {
      toast({
        title: 'Erro',
        description: 'Nenhuma conversa selecionada.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const response = await apiRequest('PATCH', `/ticket/${ticketId}`, {
        status: status
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao atualizar status do ticket:', errorText);
        throw new Error(`Erro ao atualizar proposta: ${errorText}`);
      }

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation.id] });

      toast({
        title: status === 'accepted' ? 'Proposta aceita' : 'Proposta rejeitada',
        description: status === 'accepted' 
          ? 'A proposta foi aceita com sucesso!' 
          : 'A proposta foi rejeitada.',
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar proposta',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentConversation, queryClient, toast]);

  return {
    // Estados
    conversations: processedConversations,
    currentConversation,
    messages,
    newMessage,
    tickets,
    unreadMessageCount: 0,
    
    // Loading states
    loadingConversations,
    loadingMessages,
    loadingTickets,
    sendingMessage: sendMessageMutation.isPending,
    
    // Funções
    setNewMessage,
    sendMessage,
    selectConversation,
    startConversation,
    startConversationAndNavigate,
    createProposal,
    getStepsForTicket,
    hasActiveTicket,
    getActiveTicket,
    updateTicketStatus, // Nova função
    
    // Errors
    conversationsError,
    messagesError,
  };
}


