export interface LoginInterface {
  email: string;
  password: string;
}
export interface RegisterInterface {
  name: string;
  email: string;
  gender: string;
  birth: string;
  cpf?: string;
  cnpj?: string;
  type: "contratante" | "prestador";
  password: string;
  about?: string;
  profession?: string;
  confirmPassword: string;
  termos_aceitos: boolean;

}
export interface User {
  id: number;
  name: string;
  email: string;
  cpf?: string;
  payload: string;
  birth: string;
  gender: string;
  cnpj?: string;
  provider_id?: number;
  cidade_id: number;
  type: "contratante" | "prestador";
  termos_aceitos: boolean;
}
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isInitialized: boolean;
  login: (data: LoginInterface) => Promise<void>;
  register: (data: RegisterInterface) => Promise<void>;
  logout: () => Promise<void>;
}
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
  };
}

export interface Ticket {
  id: number;
  conversation_id: number;
  created_at: string;
  updated_at: string;
  status?: string;
  contract_pdf_url?: string; // Campo para PDF do contrato
  signed_at?: string; // NOVO: Campo para data de assinatura
  signed_by?: number; // NOVO: Campo para ID do usuário que assinou
}

export interface Step {
  id: number;
  ticket_id: number;
  title: string;
  price: number;
  created_at: string;
  updated_at: string;
  status?: string;
  provider_completed?: boolean; // Prestador marcou como concluído
  client_confirmed?: boolean;   // Cliente confirmou conclusão
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

// INTERFACE PARA ATUALIZAR STEP
export interface UpdateStepRequest {
  title?: string;
  price?: number;
  status?: string;
  provider_completed?: boolean;
  client_confirmed?: boolean;
}

export interface SignDocumentRequest {
  ticket_id: number;
  password: string;
  user_id: number;
}
export interface Demand {
  User: User;
  id_demand: number;
  id_user: number;
  title: string;
  description: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}
export interface UserData {
  id: number;
  name: string;
  email: string;
}

export interface EnrichedDemand extends Demand {
  userName: string;
  userEmail: string;
}

export interface ServiceProvider {
  provider_id: number;
  user_id: number;
  profession: string;
  views_profile: number;
  about: string | null;
}

export interface ServiceFreelancer {
  id_serviceFreelancer: number;
  id_provider: number;
  title: string;
  description: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  ServiceProvider: ServiceProvider;
}

export interface ServicesResponse {
  code: number;
  message: string;
  servicesFreelancer: ServiceFreelancer[];
  success: boolean;
}

export interface EnrichedService extends ServiceFreelancer {
  userName: string;
  userEmail: string;
  userType: string;
}
