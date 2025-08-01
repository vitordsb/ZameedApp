
import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Users, MessageCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AplicationLayout from '@/components/layouts/ApplicationLayout';

export default function Messages() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Extrair userId da URL se presente
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const initialPartnerId = urlParams.get('userId');

  const {
    conversations,
    currentConversation,
    messages,
    newMessage,
    unreadMessageCount,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    setNewMessage,
    sendMessage,
    selectConversation,
    conversationsError,
    messagesError,
  } = useMessaging(initialPartnerId);

  // Log para debug
  useEffect(() => {
    console.log('=== MESSAGES COMPONENT DEBUG ===');
    console.log('initialPartnerId:', initialPartnerId);
    console.log('currentConversation:', currentConversation);
    console.log('currentConversation?.id:', currentConversation?.id);
    console.log('conversations:', conversations);
  }, [initialPartnerId, currentConversation, conversations]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMIT ===');
    console.log('currentConversation no handleSendMessage:', currentConversation);
    console.log('currentConversation.id no handleSendMessage:', currentConversation?.id);
    
    if (!currentConversation?.id) {
      console.error('ERRO: Tentativa de enviar mensagem sem conversa selecionada');
      return;
    }
    
    await sendMessage();
  };

  const handleConversationClick = (conversation: any) => {
    console.log('=== CLIQUE NA CONVERSA ===');
    console.log('Conversa clicada:', conversation);
    console.log('ID da conversa clicada:', conversation.id);
    
    // CORREÇÃO: Garantir que o objeto conversation tenha a estrutura correta
    if (!conversation.id) {
      console.error('ERRO: Conversa sem ID válido');
      return;
    }
    
    selectConversation(conversation);
    
    // Atualizar URL para refletir a conversa selecionada
    const newUrl = `/messages?userId=${conversation.otherUser.id}`;
    console.log('Atualizando URL para:', newUrl);
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
    <div className="bg-gray-50">
      <div className="max-w-8px px-10 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
              Contatos com propostas 
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-sm">
                      Inicie uma conversa visitando o perfil de um prestador no menu principal
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
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
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
                              {conversation.lastMessage?.content }
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

          {/* Área de Mensagens */}
          <Card className="lg:col-span-2">
            {currentConversation ? (
              <>
                {/* Header da Conversa */}
                <CardHeader className="pb-3">
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
                  </div>
                </CardHeader>
                
                <Separator />

                {/* Mensagens */}
                <CardContent className="p-0 flex flex-col h-[calc(100vh-250px)]">
                  <ScrollArea className="flex-1 p-4">
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
                                    ? 'text-orange-200'
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

                  {/* Input de Mensagem */}
                  <div className="p-4 border-t">
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
                        disabled={!newMessage.trim() || sendingMessage || !currentConversation?.id}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-2 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                    
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
                  <p>Inicie a conversa enviando uma mensagem</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
    </AplicationLayout>
  );
}


