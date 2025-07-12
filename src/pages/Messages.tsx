
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Send, ChevronLeft, Plus, FileEdit, MessageCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocation } from 'wouter';
import { useMessaging, Conversation } from '@/hooks/use-messaging';
import { ContractDialog, ContractData } from '@/components/ContractDialog';
import { ContractMessage } from '@/components/ContractMessage';
import { Badge } from '@/components/ui/badge';

export default function Messages() {
  const { user, isLoggedIn } = useAuth();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialUserId = searchParams.get('userId');
  
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'detail'>(initialUserId ? 'detail' : 'list');
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contracts, setContracts] = useState<Array<{
    id: string;
    serviceDescription: string;
    price: number;
    terms: string;
    status: 'pending' | 'accepted' | 'rejected' | 'paid';
    createdAt: Date;
    isFromCurrentUser: boolean;
  }>>([]);
  
  const {
    conversations,
    currentConversation,
    messages,
    newMessage,
    loadingConversations,
    loadingMessages,
    loadingInitialPartner: loadingInitialUser,
    sendingMessage,
    setNewMessage,
    sendMessage: handleSendMessage,
    selectConversation: selectConversationBase,
    startConversation: startConversationBase,
  } = useMessaging(initialUserId);

  // Handle contract creation
  const handleSubmitContract = async (contractData: ContractData) => {
    if (!currentConversation) return;
    
    const newContract = {
      id: `contract-${Date.now()}`,
      ...contractData,
      status: 'pending' as const,
      createdAt: new Date(),
      isFromCurrentUser: true
    };
    
    setContracts(prev => [...prev, newContract]);
    
    setNewMessage(`I've sent you a contract proposal for $${contractData.price} - ${contractData.serviceDescription}`);
    await handleSendMessage();
  };
  
  // Simulate accepting a contract
  const handleAcceptContract = async (contractId: string) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: 'accepted' as const } 
          : contract
      )
    );
    
    setNewMessage("I've accepted your contract proposal. Let's proceed!");
    await handleSendMessage();
    
    return Promise.resolve();
  };
  
  // Simulate rejecting a contract
  const handleRejectContract = async (contractId: string) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: 'rejected' as const } 
          : contract
      )
    );
    
    setNewMessage("I've declined your contract proposal. Let's discuss further.");
    await handleSendMessage();
    
    return Promise.resolve();
  };
  
  // Simulate paying for a contract
  const handlePayContract = async (contractId: string) => {
    setContracts(prev => 
      prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: 'paid' as const } 
          : contract
      )
    );
    
    setNewMessage("I've processed the payment for our contract. Looking forward to working together!");
    await handleSendMessage();
    
    return Promise.resolve();
  };

  // Process message input for contract keyword
  useEffect(() => {
    if (newMessage.toLowerCase().includes("contract please")) {
      handleSendMessage();
      
      setTimeout(() => {
        if (currentConversation) {
          const designerContract = {
            id: `contract-designer-${Date.now()}`,
            serviceDescription: "Interior Design Consultation and Implementation",
            price: 2500,
            terms: "50% payment upfront\n25% after design approval\n25% upon completion\nDelivery in 4 weeks\nUp to 3 revisions included",
            status: 'pending' as const,
            createdAt: new Date(),
            isFromCurrentUser: false
          };
          
          setContracts(prev => [...prev, designerContract]);
        }
      }, 1500);
    }
  }, [newMessage, currentConversation, handleSendMessage]);

  const selectConversation = (conversation: Conversation) => {
    selectConversationBase(conversation);
    setMobileViewMode('detail');
  };

  const handleBackToList = () => {
    setMobileViewMode('list');
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Necessário</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para acessar suas mensagens</p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens</h1>
          <p className="text-gray-600">Gerencie suas conversas com clientes e freelancers</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-200px)]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full md:w-96 border-r border-gray-200 ${mobileViewMode === 'detail' ? 'hidden md:block' : 'block'}`}>
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-500 text-amber-600 hover:bg-amber-500 hover:border-amber-300 rounded-xl"
                    onClick={() => window.location.href = '/home?showDesigners=true'}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Buscar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
                    onClick={() => startConversationBase(1)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Emma
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
                    onClick={() => startConversationBase(2)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Jack
                  </Button>
                </div>
              </div>
              
              {/* Conversations List */}
              <ScrollArea className="h-[calc(100%-140px)]">
                {loadingConversations ? (
                  <div className="flex justify-center items-center h-full py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-2">Nenhuma conversa ainda</p>
                    <p className="text-sm text-gray-400">Clique nos botões acima para começar</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversations.map(conversation => (
                      <div 
                        key={conversation.partner.id} 
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                          currentConversation?.partner.id === conversation.partner.id 
                            ? 'bg-amber-50 border-l-4 border-amber-500 shadow-sm' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectConversation(conversation)}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            <Avatar className="h-12 w-12 mr-3 ring-2 ring-white shadow-sm">
                              <AvatarImage src={conversation.partner.profileImage || undefined} alt={conversation.partner.name} />
                              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
                                {getInitials(conversation.partner.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{conversation.partner.name}</h3>
                              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {formatRelativeTime(conversation.lastMessage.createdAt.toString())}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate flex-1">
                                {conversation.lastMessage.isFromUser ? 'Você: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge className="ml-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-2 py-1 rounded-full">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                {conversation.partner.userType === 'designer' ? 'Arquiteto' : 'Cliente'}
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
            
            {/* Message Thread */}
            <div className={`flex-1 flex flex-col ${mobileViewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
              {loadingInitialUser ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-4" />
                  <p className="text-gray-500">Carregando conversas...</p>
                </div>
              ) : currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center">
                      {mobileViewMode === 'detail' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleBackToList} 
                          className="mr-3 md:hidden hover:bg-gray-100 rounded-xl"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      )}
                      <div className="relative">
                        <Avatar className="h-12 w-12 mr-4 ring-2 ring-white shadow-sm">
                          <AvatarImage 
                            src={currentConversation.partner.profileImage || undefined} 
                            alt={currentConversation.partner.name} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
                            {getInitials(currentConversation.partner.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{currentConversation.partner.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                            {currentConversation.partner.userType === 'designer' ? 'Arquiteto' : 'Cliente'}
                          </Badge>
                          <span className="text-sm text-green-600 font-medium">● Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages Area */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-6">
                      {loadingMessages ? (
                        <div className="flex justify-center items-center h-full py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                        </div>
                      ) : messages.length === 0 && contracts.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full text-center">
                          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-amber-600" />
                          </div>
                          <p className="text-gray-500 font-medium mb-2">Nenhuma mensagem ainda</p>
                          <p className="text-sm text-gray-400 max-w-sm">
                            Inicie a conversa enviando uma mensagem ou proposta de contrato
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Regular messages */}
                          {messages.map(message => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="flex items-end gap-2 max-w-[80%]">
                                {message.senderId !== user.id && (
                                  <Avatar className="h-8 w-8 mb-1">
                                    <AvatarImage src={currentConversation.partner.profileImage || undefined} />
                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                      {getInitials(currentConversation.partner.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                                    message.senderId === user.id
                                      ? 'bg-amber-600 text-white rounded-br-md'
                                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                  <div className={`text-xs mt-2 ${
                                    message.senderId === user.id ? 'text-amber-100' : 'text-gray-500'
                                  }`}>
                                    {formatRelativeTime(message.createdAt.toString())}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Contract messages */}
                          {contracts.map(contract => (
                            <div
                              key={contract.id}
                              className={`flex ${contract.isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="max-w-[80%]">
                                <ContractMessage
                                  contract={contract}
                                  onAccept={handleAcceptContract}
                                  onReject={handleRejectContract}
                                  onPay={handlePayContract}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    {/* Message Input */}
                    <div className="p-6 border-t border-gray-100 bg-white">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex items-end gap-3"
                      >
                        <div className="flex-1 relative">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            disabled={sendingMessage}
                            className="pr-12 py-3 rounded-xl border-gray-200 focus:border-amber-500 focus:ring-amber-500 resize-none"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsContractDialogOpen(true)}
                          disabled={sendingMessage}
                          className="p-3 border-gray-200 hover:bg-gray-50 rounded-xl"
                          title="Criar Contrato"
                        >
                          <FileEdit className="h-5 w-5 text-gray-600" />
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={sendingMessage || !newMessage.trim()}
                          className="p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sendingMessage ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-center p-8">
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="w-12 h-12 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Selecione uma conversa</h3>
                  <p className="text-gray-500 max-w-sm">
                    Escolha uma conversa da lista ao lado para começar a trocar mensagens
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Contract Dialog */}
      <ContractDialog
        currentConversation={currentConversation}
        onClose={() => setIsContractDialogOpen(false)}
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        onSubmit={handleSubmitContract}
      />
    </div>
  );
}


