import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface Conversation {
  partner: {
    id: number;
    name: string;
    profileImage: string | null;
    userType: string;
  };
  lastMessage: {
    id: number;
    content: string;
    createdAt: Date;
    isFromUser: boolean;
  };
  unreadCount: number;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: Date | string;
  read: boolean;
}

export function useMessaging(initialPartnerId?: string | null) {
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingInitialPartner, setLoadingInitialPartner] = useState(!!initialPartnerId);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    
    try {
      // Pass the initialPartnerId as a query parameter if it exists
      const apiUrl = initialPartnerId 
        ? `/api/messages?initialUserId=${initialPartnerId}` 
        : '/api/messages';
        
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        // If there's an initial partner ID, find the matching conversation and select it
        if (initialPartnerId) {
          const initialConversation = data.find(
            (conv: Conversation) => conv.partner.id === parseInt(initialPartnerId)
          );
          
          if (initialConversation) {
            setCurrentConversation(initialConversation);
            fetchMessages(initialConversation.partner.id);
          }
          setLoadingInitialPartner(false);
        }
        
        // Calculate total unread messages
        const totalUnread = data.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
        setUnreadMessageCount(totalUnread);
        
        setLoadingConversations(false);
      } else {
        toast({
          title: 'Erro ao carregar conversas',
          description: 'Could not load your conversations. Please try again.',
          variant: 'destructive',
        });
        setLoadingConversations(false);
        setLoadingInitialPartner(false);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Network error',
        description: 'Could not connect to the server. Please check your connection.',
        variant: 'destructive',
      });
      setLoadingConversations(false);
      setLoadingInitialPartner(false);
    }
  }, [isLoggedIn, user, toast, initialPartnerId]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (partnerId: number) => {
    if (!isLoggedIn || !user) return;
    
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/messages/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // After fetching messages, refresh conversations to update unread counts
        fetchConversations();
      } else {
        toast({
          title: 'Error fetching messages',
          description: 'Could not load your messages. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Network error',
        description: 'Could not connect to the server. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [isLoggedIn, user, toast, fetchConversations]);

  // Send a message
  const sendMessage = useCallback(async () => {
    if (!currentConversation || !newMessage.trim() || !isLoggedIn || !user) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch(`/api/messages/${currentConversation.partner.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      });
      
      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
        
        // Update the conversation list
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        
        // Update current conversation's last message
        setConversations(prev => 
          prev.map(conv => 
            conv.partner.id === currentConversation.partner.id
              ? {
                  ...conv,
                  lastMessage: {
                    id: sentMessage.id,
                    content: sentMessage.content,
                    createdAt: sentMessage.createdAt,
                    isFromUser: true,
                  },
                }
              : conv
          )
        );
        
        // Refresh conversations to get updated unread counts
        setTimeout(() => {
          fetchConversations();
        }, 500);
      } else {
        toast({
          title: 'Error sending message',
          description: 'Could not send your message. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Network error',
        description: 'Could not connect to the server. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  }, [currentConversation, newMessage, isLoggedIn, user, toast, queryClient, fetchConversations]);

  // Select a conversation
  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    fetchMessages(conversation.partner.id);
  }, [fetchMessages]);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn || !user) return;
    
    try {
      const response = await fetch('/api/messages/unread/count');
      if (response.ok) {
        const data = await response.json();
        setUnreadMessageCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    }
  }, [isLoggedIn, user]);

  // Start a new conversation with a user
  const startConversation = useCallback(async (partnerId: number) => {
    if (!isLoggedIn || !user) return;
    
    try {
      // First check if the conversation already exists
      const existingConversation = conversations.find(
        conv => conv.partner.id === partnerId
      );
      
      if (existingConversation) {
        setCurrentConversation(existingConversation);
        fetchMessages(partnerId);
        return true;
      }
      
      // If not, fetch user info and create a new conversation
      const response = await fetch(`/api/messages?initialUserId=${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        
        const newConversation = data.find(
          (conv: Conversation) => conv.partner.id === partnerId
        );
        
        if (newConversation) {
          setCurrentConversation(newConversation);
          fetchMessages(partnerId);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Could not start a new conversation. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [isLoggedIn, user, conversations, toast, fetchMessages]);

  // Initial data fetch
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchConversations();
      
      // Poll for new messages every 15 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
        
        // If a conversation is selected, also update its messages
        if (currentConversation) {
          fetchMessages(currentConversation.partner.id);
        }
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user, fetchConversations, fetchUnreadCount, currentConversation, fetchMessages]);

  // Debug: Log when initialPartnerId changes
  useEffect(() => {
    if (initialPartnerId) {
      console.log(`Messaging hook received initialPartnerId: ${initialPartnerId}`);
    }
  }, [initialPartnerId]);

  return {
    conversations,
    currentConversation,
    messages,
    newMessage,
    loadingConversations,
    loadingMessages,
    loadingInitialPartner,
    sendingMessage,
    unreadMessageCount,
    setNewMessage,
    sendMessage,
    selectConversation,
    startConversation,
    fetchConversations,
    fetchMessages,
    fetchUnreadCount
  };
}
