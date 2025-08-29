
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Conversation, Message, CreateMessageRequest, Ticket, Step, CreateConversationRequest, CreateStepRequest, CreateTicketRequest, SignDocumentRequest, UpdateStepRequest } from '@/lib/Interfaces';

export function useMessaging(initialPartnerId?: string | null) {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);

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

  const userIds = useMemo(() => {
    if (!conversationsData?.conversations || !user) return [];
    const ids = conversationsData.conversations.map((conv: any) => {
      return conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
    });
    return ids;
  }, [conversationsData, user]);

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};

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

  const getStepsForTicket = useCallback(async (ticketId: number): Promise<Step[]> => {
    try {
      const response = await apiRequest('GET', `/step/${ticketId}`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar steps: ${response.status}`);
      }
      const data = await response.json();
      console.log(data)
      return data.steps || [];
    } catch (error) {
      console.error('❌ Erro ao buscar steps:', error);
      return [];
    }
  }, []);

  const updateStep = useCallback(async (stepId: number, updateData: UpdateStepRequest) => {
    try {
      const response = await apiRequest('PUT', `/step/${stepId}`, updateData);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao atualizar step:', errorText);
        throw new Error(`Erro ao atualizar step: ${errorText}`);
      }
      const data = await response.json();
      console.log('✅ Step atualizado:', data);
      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation?.id] });

      toast({
        title: 'Step atualizado',
        description: 'Step atualizado com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar step:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar step',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentConversation, queryClient, toast]);

  const deleteStep = useCallback(async (stepId: number) => {
    try {
      const response = await apiRequest('DELETE', `/step/${stepId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao deletar step:', errorText);
        throw new Error(`Erro ao deletar step: ${errorText}`);
      }
      else if (!currentConversation?.id) {
        console.error('ERRO: Tentativa de deletar step sem conversa selecionada');
        return false;
      }
      // se a quantidade de step for 0 o ticket deve ser deletado
      else if (tickets.length === 0) {
        await deleteTicket(currentConversation.id);
      }

      const data = await response.json();
      console.log('🗑️ Step deletado com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation?.id] });

      toast({
        title: 'Step removido',
        description: 'Step removido com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar step:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar step',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentConversation, queryClient, toast]);
  // se a quantidade de step for 0 o ticket deve ser deletado

  const deleteTicket = async (ticketId: number) => {
    try {
      const response = await apiRequest('DELETE', `/ticket/${ticketId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao deletar ticket:', errorText);
        throw new Error(`Erro ao deletar ticket: ${errorText}`);
      }
      else if (!currentConversation?.id) {
        console.error('ERRO: Tentativa de deletar ticket sem conversa selecionada');
        return false;
      }

      const data = await response.json();
      console.log('🗑️ Ticket deletado com sucesso:', data);
      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation?.id] });

      toast({
        title: 'Ticket removido',
        description: 'Ticket removido com sucesso!',
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar ticket:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar ticket',
        variant: 'destructive',
      });
      return false;
    }
  };


  // ✅ aceita File | Blob
  const uploadPDF = async (ticketId: number, file: File | Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", file, (file as File).name || `ticket-${ticketId}.pdf`);

      // IMPORTANTE: apiRequest não deve forçar "Content-Type: application/json" quando body é FormData
      const response = await apiRequest("POST", `/upload/pdf/${ticketId}`, formData);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro no upload: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ["tickets", currentConversation?.id] });
      toast({ title: "Contrato enviado", description: "Contrato PDF enviado com sucesso!" });

      // opcional: já puxa o PDF para cache/local
      await buscarPDF(ticketId);

      return result;
    } catch (error) {
      console.error("❌ Erro no upload do PDF:", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro ao enviar contrato PDF",
        variant: "destructive",
      });
      return null;
    }
  };

  function parseFilenameFromDisposition(disposition?: string | null) {
    if (!disposition) return null;
    // filename*=UTF-8''nome.pdf OU filename="nome.pdf"
    const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
    return m ? decodeURIComponent(m[1]) : null;
  }
  const buscarPDF = async (ticketId: number) => {
    try {
      // 1) Buscar a lista de anexos (JSON)
      const listRes = await apiRequest("GET", `/attchment/ticket/${ticketId}`);
      if (!listRes.ok) {
        const t = await listRes.text();
        throw new Error(`Erro ao listar anexos: ${listRes.status} - ${t}`);
      }

      const listJson = await listRes.json();
      const attachments: Array<{ id: number; ticket_id: number; pdf_path: string; date?: string }> =
        listJson?.attachments || [];

      if (!attachments.length) {
        throw new Error("Nenhum PDF anexado a este ticket.");
      }

      const chosen =
        attachments
          .slice()
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
      const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";
      const pdfUrlAbs = `${base}/${chosen.pdf_path.replace(/^\/+/, "")}`;

      // 4) Buscar o PDF real
      const fileRes = await fetch(pdfUrlAbs, {
        method: "GET",
      });
      if (!fileRes.ok) {
        const t = await fileRes.text();
        throw new Error(`Erro ao baixar PDF: ${fileRes.status} - ${t}`);
      }

      const blob = await fileRes.blob();
      const blobUrl = URL.createObjectURL(blob);

      // tenta extrair filename (se houver header; com estático pode não ter)
      const disp = fileRes.headers.get("Content-Disposition") || "";
      const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disp);
      const filename =
        (m ? decodeURIComponent(m[1]) : null) ||
        `contrato-ticket-${ticketId}.pdf`;

      return { blob, blobUrl, filename };
    } catch (error) {
      console.error("❌ Erro ao buscar PDF:", error);
      return null;
    }
  }; // Função para buscar e PDF do ticket ativo da conversa atual
  const openTicketPdfInNewTab = async (ticketId: number) => {
    const res = await fetchTicketPDF(ticketId);
    if (!res) return false;

    const { blobUrl } = res;
    // abrir imediatamente em resposta a clique de usuário evita bloqueio de popup
    window.open(blobUrl, "_blank", "noopener,noreferrer");

    // libera memória depois de um tempo
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return true;
  };

  // ✅ baixar com nome correto
  const downloadTicketPdf = async (ticketId: number) => {
    const res = await fetchTicketPDF(ticketId);
    if (!res) return false;

    const { blobUrl, filename } = res;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    return true;
  };
  const getActiveTicket = useCallback(() => {
    if (!currentConversation || !tickets) return null;
    const activeTicket = tickets.find(ticket =>
      ticket.conversation_id === currentConversation.id &&
      (!ticket.status || ticket.status === 'concluída' || ticket.status === 'cancelada' || ticket.status === 'em andamento' || ticket.status === 'pendente')
    );

    return activeTicket || null;
  }, [currentConversation, tickets]);

  // FUNÇÃO MELHORADA PARA CRIAR PROPOSTA COMO MENSAGEM
  const createProposal = useCallback(async (steps: Omit<CreateStepRequest, 'ticket_id'>[], contractFile?: string) => {
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
        console.log(ticketId)
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
          console.log(`✅ Step ${i + 1} criado com sucesso:`, stepResult);
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

      // Upload do PDF APÓS criar o ticket e steps
      let uploadSuccess = true;
      if (contractFile) {
        console.log('📎 Fazendo upload do contrato...');
        const uploadResult = await uploadPDF(ticketId, contractFile);
        uploadSuccess = !!uploadResult;

        if (!uploadSuccess) {
          console.warn('⚠️ Upload do PDF falhou, mas continuando com a proposta...');
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
        content: `📋 Nova proposta enviada! Ticket #${ticketId} - Total: R$ ${totalPrice.toFixed(2)}${contractFile ? (uploadSuccess ? ' (Contrato anexado)' : ' (Erro no upload do contrato)') : ''}`,
        type: 'proposal',
        proposal_data: proposalData
      });

      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      toast({
        title: 'Proposta enviada',
        description: contractFile && !uploadSuccess
          ? 'Proposta enviada, mas houve erro no upload do contrato. Você pode tentar anexar novamente.'
          : 'Sua proposta foi enviada com sucesso!',
        variant: contractFile && !uploadSuccess ? 'destructive' : 'default',
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
  }, [currentConversation, user, getActiveTicket, uploadPDF, sendMessageMutation, queryClient, toast]);

  const updateTicketStatus = useCallback(async (ticketId: number, status: 'accepted' | 'rejected' | 'signed') => {
    if (!currentConversation) {
      toast({
        title: 'Erro',
        description: 'Nenhuma conversa selecionada.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const updateData: any = { status: status };

      // Se for assinatura, adicionar dados de assinatura
      if (status === 'signed' && user) {
        updateData.signed_at = new Date().toISOString();
        updateData.signed_by = user.id;
      }

      const response = await apiRequest('PATCH', `/ticket/${ticketId}`, updateData);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro ao atualizar status do ticket:', errorText);
        throw new Error(`Erro ao atualizar proposta: ${errorText}`);
      }

      // Se a proposta foi aceita, iniciar o primeiro step
      if (status === 'accepted') {
        const steps = await getStepsForTicket(ticketId);
        if (steps.length > 0) {
          await updateStep(steps[0].id, { status: 'in_progress' });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['tickets', currentConversation.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', currentConversation.id] });

      let successMessage = '';
      switch (status) {
        case 'accepted':
          successMessage = 'A proposta foi aceita e o primeiro passo foi iniciado!';
          break;
        case 'rejected':
          successMessage = 'A proposta foi rejeitada.';
          break;
        case 'signed':
          successMessage = 'O documento foi assinado digitalmente com sucesso!';
          break;
      }

      toast({
        title: status === 'accepted' ? 'Proposta aceita' :
          status === 'rejected' ? 'Proposta rejeitada' :
            'Documento assinado',
        description: successMessage,
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
  }, [currentConversation, getStepsForTicket, updateStep, queryClient, toast, user]);

  const signDocument = useCallback(async (ticketId: number, password: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const validateResponse = await apiRequest('POST', '/auth/validate-password', {
        email: user.email,
        password: password
      });

      if (!validateResponse.ok) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha informada não confere com a sua senha de login.',
          variant: 'destructive',
        });
        return false;
      }

      const success = await updateTicketStatus(ticketId, 'signed');

      if (success) {
        await sendMessageMutation.mutateAsync({
          conversation_id: currentConversation!.id,
          content: `✅ Documento assinado digitalmente por ${user.name} em ${new Date().toLocaleString('pt-BR')}`,
          type: 'text'
        });
      }

      return success;
    } catch (error) {
      console.error('❌ Erro ao assinar documento:', error);
      toast({
        title: 'Erro na assinatura',
        description: 'Não foi possível assinar o documento. Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, updateTicketStatus, sendMessageMutation, currentConversation, toast]);

  // FUNÇÃO PARA MARCAR STEP COMO CONCLUÍDO (PRESTADOR)
  const markStepCompleted = useCallback(async (stepId: number) => {
    return await updateStep(stepId, {
      provider_completed: true,
      status: 'awaiting_confirmation'
    });
  }, [updateStep]);

  // FUNÇÃO PARA CONFIRMAR CONCLUSÃO DO STEP (CLIENTE)
  const confirmStepCompletion = useCallback(async (stepId: number, ticketId: number) => {
    const success = await updateStep(stepId, {
      client_confirmed: true,
      status: 'completed'
    });

    if (success) {
      // Verificar se há próximo step para iniciar
      const steps = await getStepsForTicket(ticketId);
      const currentStepIndex = steps.findIndex(s => s.id === stepId);
      const nextStep = steps[currentStepIndex + 1];

      if (nextStep && nextStep.status !== 'in_progress') {
        await updateStep(nextStep.id, { status: 'in_progress' });
      }
    }

    return success;
  }, [updateStep, getStepsForTicket]);

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
    getActiveTicket,
    updateTicketStatus,
    updateStep,
    deleteStep,
    uploadPDF,
    buscarPDF,        // retorna { blobUrl, filename }
    openTicketPdfInNewTab, // abre nova aba
    downloadTicketPdf,
    markStepCompleted,
    confirmStepCompletion,
    signDocument,

    // Errors
    conversationsError,
    messagesError,
  };
}


