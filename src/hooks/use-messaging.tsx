
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface Conversation {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
  // Dados do outro usuário na conversa
  otherUser: {
    id: number;
    name: string;
    email: string;
    type: "prestador" | "contratante";
  };
  // Última mensagem da conversa
  lastMessage?: {
    id: number;
    content: string;
    created_at: string;
    sender_id: number;
  };
  unreadCount: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationRequest {
  user1_id: number;
  user2_id: number;
}

export interface CreateMessageRequest {
  conversation_id: number;
  content: string;
}

export function useMessaging(initialPartnerId?: string | null) {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');

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
      console.log('=== DADOS BRUTOS DA API ===');
      console.log('Resposta completa da API:', data);
      console.log('Conversas recebidas:', data.conversations);
      
      if (data.conversations) {
        data.conversations.forEach((conv: any, index: number) => {
          console.log(`Conversa ${index}:`, conv);
          console.log(`  - conversation_id: ${conv.conversation_id} (tipo: ${typeof conv.conversation_id})`);
          console.log(`  - user1_id: ${conv.user1_id}`);
          console.log(`  - user2_id: ${conv.user2_id}`);
          
          if (!conv.conversation_id || typeof conv.conversation_id !== 'number') {
            console.error(`ERRO CRÍTICO: Conversa ${index} sem conversation_id válido!`, conv);
          }
        });
      }
      
      return data;
    },
    enabled: isLoggedIn && !!user,
    staleTime: 10000, // 10 segundos
    refetchInterval: 2000, // Refetch a cada 2 segundos 
  });

  // Buscar dados de usuários para as conversas
  const userIds = useMemo(() => {
    if (!conversationsData?.conversations || !user) return [];
    
    const ids = conversationsData.conversations.map((conv: any) => {
      return conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    });
    
    console.log('IDs de usuários para buscar:', ids);
    return ids;
  }, [conversationsData, user]);

  // Query para buscar dados dos usuários
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      
      console.log('Buscando dados dos usuários:', userIds);
      
      const userPromises = userIds.map(async (userId: number) => {
        try {
          const response = await apiRequest('GET', `/users/${userId}`);
          if (!response.ok) {
            console.error(`Erro ao buscar usuário ${userId}: Status ${response.status}`);
            return { id: userId, data: null };
          }
          const data = await response.json();
          console.log(`Dados do usuário ${userId}:`, data);
          return { id: userId, data: data.user };
        } catch (error) {
          console.error(`Erro ao buscar usuário ${userId}:`, error);
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
          type: 'contratante'
        };
      });

      console.log('Mapa de usuários processado:', usersMap);
      return usersMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Processar conversas com dados dos usuários
  const processedConversations: Conversation[] = useMemo(() => {
    if (!conversationsData?.conversations || !user || !usersData) {
      console.log('Dados insuficientes para processar conversas:', {
        hasConversations: !!conversationsData?.conversations,
        hasUser: !!user,
        hasUsersData: !!usersData
      });
      return [];
    }

    console.log('=== PROCESSANDO CONVERSAS ===');
    console.log('Conversas brutas da API:', conversationsData.conversations);

    const tempProcessed = conversationsData.conversations
      .map((conv: any) => {
        console.log(`=== PROCESSANDO CONVERSA ${conv.conversation_id} ===`);
        console.log('Conversa bruta:', conv);
        
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        const otherUser = usersData[otherUserId];

        const processedConv: Conversation = {
          id: conv.conversation_id, 
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
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

        console.log(`Conversa ${conv.conversation_id} processada:`, processedConv);
        console.log(`  - ID mapeado: ${processedConv.id} (tipo: ${typeof processedConv.id})`);
        console.log(`  - otherUser: ${processedConv.otherUser.name} (ID: ${processedConv.otherUser.id})`);
        
        if (!processedConv.id || typeof processedConv.id !== 'number') {
          console.error('ERRO CRÍTICO: Conversa processada sem ID válido!', processedConv);
          return null; // Retorna null para conversas inválidas
        }
        
        return processedConv;
      })
      .filter((conv: Conversation | null) => conv !== null) as Conversation[]; // Filtra os nulls

    console.log('=== CONVERSAS FINAIS PROCESSADAS ===');
    console.log('Total de conversas:', tempProcessed.length);
    tempProcessed.forEach((conv, index) => {
      console.log(`Conversa ${index}: ID=${conv.id}, otherUser=${conv.otherUser.name}`);
    });
    
    return tempProcessed;
  }, [conversationsData, user, usersData]);

  // Mutation para criar nova conversa
  const createConversationMutation = useMutation({
    mutationFn: async (data: CreateConversationRequest) => {
      console.log('Criando conversa com dados:', data);
      const response = await apiRequest('POST', '/conversation', data);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao criar conversa:', errorText);
        throw new Error(`Erro ao criar conversa: ${response.status}`);
      }
      const result = await response.json();
      console.log('Resposta da criação de conversa:', result);
      return result;
    },
    onSuccess: async (data, variables) => {
      console.log('Conversa criada com sucesso:', data);
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      await refetchConversations(); // Garante que a lista esteja atualizada
      
      toast({
        title: 'Conversa criada',
        description: 'Nova conversa iniciada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conversa. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async (data: CreateMessageRequest) => {
      console.log('Enviando mensagem com dados:', data);
      
      // Validação dos dados antes de enviar
      if (!data.conversation_id || !data.content?.trim()) {
        throw new Error('Dados inválidos para envio de mensagem');
      }
      
      const response = await apiRequest('POST', '/message', {
        conversation_id: data.conversation_id,
        content: data.content.trim()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao enviar mensagem:', errorText);
        throw new Error(`Erro ao enviar mensagem: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Mensagem enviada com sucesso:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Mensagem enviada com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setNewMessage('');
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // CORREÇÃO: Definir startConversation antes do useEffect
  const startConversation = useCallback(async (targetUserId: number) => {
    if (!user || !isLoggedIn) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para iniciar uma conversa.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      console.log('Iniciando conversa com usuário:', targetUserId);
      console.log('Conversas disponíveis:', processedConversations);
      
      // Verificar se já existe uma conversa com este usuário
      const existingConversation = processedConversations.find(conv => 
        conv.otherUser.id === targetUserId
      );

      if (existingConversation) {
        console.log('Conversa existente encontrada:', existingConversation);
        console.log('ID da conversa existente:', existingConversation.id);
        
        if (!existingConversation.id || typeof existingConversation.id !== 'number') {
          console.error('ERRO: Conversa existente sem ID válido!', existingConversation);
          toast({
            title: 'Erro',
            description: 'Conversa inválida encontrada. Tente novamente.',
            variant: 'destructive',
          });
          return false;
        }
        
        setCurrentConversation(existingConversation);
        return true;
      }

      // Criar nova conversa
      console.log('Criando nova conversa com usuário:', targetUserId);
      await createConversationMutation.mutateAsync({
        user1_id: user.id,
        user2_id: targetUserId,
      });

      return true;
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      return false;
    }
  }, [user, isLoggedIn, processedConversations, createConversationMutation, toast]);

  // Função para iniciar uma nova conversa e navegar
  const startConversationAndNavigate = useCallback(async (targetUserId: number, setLocation: (path: string) => void) => {
    const success = await startConversation(targetUserId);
    if (success) {
      setLocation(`/messages?userId=${targetUserId}`);
    }
    return success;
  }, [startConversation]);

  // CORREÇÃO: useEffect agora pode usar startConversation sem erro
  useEffect(() => {
    console.log('=== ESTADO ATUAL DO HOOK ===');
    console.log('currentConversation:', currentConversation);
    console.log('currentConversation?.id:', currentConversation?.id);
    console.log('conversations.length:', processedConversations.length);
    console.log('loadingConversations:', loadingConversations);
    console.log('loadingUsers:', loadingUsers);

    if (!loadingConversations && !loadingUsers && processedConversations.length > 0 && !currentConversation) {
      console.log('Tentando selecionar a conversa mais recente ou a inicial...');
      if (initialPartnerId) {
        const conversationFromUrl = processedConversations.find(conv => 
          conv.otherUser.id === parseInt(initialPartnerId)
        );
        if (conversationFromUrl) {
          console.log('Selecionando conversa da URL:', conversationFromUrl);
          setCurrentConversation(conversationFromUrl);
        } else {
          console.log('Nenhuma conversa encontrada para o initialPartnerId. Tentando criar...');
          startConversation(parseInt(initialPartnerId));
        }
      } else {
        // Seleciona a conversa mais recente se não houver initialPartnerId
        const mostRecentConversation = processedConversations.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )[0];
        if (mostRecentConversation) {
          console.log('Selecionando a conversa mais recente:', mostRecentConversation);
          setCurrentConversation(mostRecentConversation);
        }
      }
    }

    // Se a lista de conversas mudar e a conversa atual não estiver mais nela, resetar
    if (currentConversation && !processedConversations.some(conv => conv.id === currentConversation.id)) {
      console.log('Conversa atual não encontrada na lista processada. Resetando currentConversation.');
      setCurrentConversation(null);
    }

  }, [initialPartnerId, processedConversations, loadingConversations, loadingUsers, currentConversation, startConversation]);

  // Efeito adicional para definir currentConversation após criação de conversa
  useEffect(() => {
    if (!loadingConversations && !loadingUsers && processedConversations.length > 0 && !currentConversation && initialPartnerId) {
      // Aguardar um pouco após o refetch para encontrar a conversa criada
      const timer = setTimeout(() => {
        const newConversation = processedConversations.find((conv) => 
          conv.otherUser.id === parseInt(initialPartnerId)
        );

        if (newConversation) {
          console.log('Conversa encontrada após criação:', newConversation);
          setCurrentConversation(newConversation);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [processedConversations, loadingConversations, loadingUsers, currentConversation, initialPartnerId]);

  // Buscar mensagens de uma conversa específica
  const { 
    data: messages = [], 
    isLoading: loadingMessages,
    error: messagesError,
    refetch: refetchMessages 
  } = useQuery<Message[]>({
    queryKey: ['messages', currentConversation?.id],
    queryFn: async () => {
      if (!currentConversation?.id) {
        console.warn('Tentativa de buscar mensagens sem ID de conversa válido:', currentConversation);
        return [];
      }
      
      console.log(`Buscando mensagens para conversa ${currentConversation.id}`);
      const response = await apiRequest('GET', `/message/conversation/${currentConversation.id}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar mensagens: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Mensagens recebidas para conversa ${currentConversation.id}:`, data);
      return data.messages || [];
    },
    enabled: !!currentConversation?.id && isLoggedIn && typeof currentConversation.id === 'number',
    staleTime: 10000, // 10 segundos
    refetchInterval: 15000, // Refetch a cada 15 segundos
  });

  // Função para selecionar uma conversa da lista
  const selectConversation = useCallback((conversation: Conversation) => {
    console.log('=== SELECIONANDO CONVERSA ===');
    console.log('Conversa a ser selecionada:', conversation);
    if (!conversation || !conversation.id || typeof conversation.id !== 'number') {
      console.error('ERRO: Tentativa de selecionar conversa sem ID válido!', conversation);
      toast({
        title: 'Erro',
        description: 'Não foi possível selecionar a conversa. ID inválido.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentConversation(conversation);
    console.log('currentConversation definido como:', conversation);
  }, [setCurrentConversation, toast]);

  // Função para enviar mensagem
  const sendMessage = useCallback(async () => {
    console.log('=== TENTANDO ENVIAR MENSAGEM ===');
    console.log('currentConversation completo:', currentConversation);
    console.log('currentConversation.id:', currentConversation?.id);
    console.log('Tipo de currentConversation.id:', typeof currentConversation?.id);
    console.log('newMessage:', newMessage);
    console.log('user:', user);

    if (!currentConversation) {
      console.error('ERRO: currentConversation é null/undefined');
      toast({
        title: 'Erro',
        description: 'Nenhuma conversa selecionada. Selecione uma conversa primeiro.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentConversation.id || typeof currentConversation.id !== 'number') {
      console.error('ERRO: currentConversation.id é undefined/null ou não é um número');
      console.error('Objeto currentConversation:', JSON.stringify(currentConversation, null, 2));
      toast({
        title: 'Erro',
        description: 'ID da conversa não encontrado ou inválido. Tente selecionar a conversa novamente.',
        variant: 'destructive',
      });
      return;
    }

    if (!newMessage.trim()) {
      console.warn('AVISO: Mensagem vazia. Não será enviada.');
      toast({
        title: 'Aviso',
        description: 'A mensagem não pode ser vazia.',
        variant: 'warning',
      });
      return;
    }

    if (!user?.id) {
      console.error('ERRO: ID do usuário logado não encontrado.');
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar o remetente da mensagem.',
        variant: 'destructive',
      });
      return;
    }

    await sendMessageMutation.mutateAsync({
      conversation_id: currentConversation.id,
      content: newMessage,
    });
  }, [currentConversation, newMessage, user, sendMessageMutation, toast]);

  return {
    conversations: processedConversations,
    currentConversation,
    messages,
    newMessage,
    unreadMessageCount: 0, // TODO: Implementar contagem de mensagens não lidas
    loadingConversations,
    loadingMessages,
    sendingMessage: sendMessageMutation.isLoading,
    setNewMessage,
    sendMessage,
    selectConversation,
    startConversation,
    startConversationAndNavigate,
    conversationsError,
    messagesError,
  };
}

// Serviço para ser usado por outros componentes
export const MessagingService = {
  startConversationAndNavigate: (targetUserId: number, setLocation: (path: string) => void) => {
    // Esta função será implementada dentro do useMessaging hook
    // e exposta através do contexto ou de uma forma que permita o acesso
    // por componentes externos sem recriar o hook.
    console.error('MessagingService.startConversationAndNavigate deve ser usado via hook useMessaging.');
  }
};


