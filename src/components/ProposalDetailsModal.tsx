
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StepCard from './StepCard';

interface Step {
  id: number;
  title: string;
  price: number;
  status?: string;
  description?: string;
}

interface Ticket {
  id: number;
  conversation_id: number;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface ProposalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  steps: Step[];
  loading?: boolean;
  onAcceptProposal?: () => void;
  onRejectProposal?: () => void;
  onSendMessage?: () => void;
  canInteract?: boolean;
}

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
        icon: AlertCircle,
        label: 'Pendente',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR });
  } catch (error) {
    return 'Data inválida';
  }
};

const calculateTotal = (steps: Step[] = []) => {
  return steps.reduce((sum, step) => sum + (step.price || 0), 0);
};

export const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({
  isOpen,
  onClose,
  ticket,
  steps,
  loading = false,
  onAcceptProposal,
  onRejectProposal,
  onSendMessage,
  canInteract = false
}) => {
  if (!ticket) return null;

  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;
  const total = calculateTotal(steps);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${statusConfig.bgColor}`}>
                <FileText className={`h-6 w-6 ${statusConfig.color}`} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Proposta #{ticket.id}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={statusConfig.variant} className="text-sm">
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    Criada em {formatDate(ticket.created_at)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Valor Total</div>
              <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
                <DollarSign className="h-6 w-6" />
                {formatCurrency(total)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600">Carregando detalhes...</span>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                  Etapas do Projeto ({steps.length})
                </h3>
                <div className="text-sm text-gray-500">
                  {steps.filter(s => s.status === 'completed' || s.status === 'concluido').length} de {steps.length} concluídas
                </div>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={index}
                    isLast={index === steps.length - 1}
                    showConnector={true}
                  />
                ))}
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Resumo da Proposta</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {steps.length} etapa{steps.length !== 1 ? 's' : ''} • 
                      Valor total: {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Status</div>
                    <Badge variant={statusConfig.variant} className="mt-1">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Action Buttons */}
        {canInteract && ticket.status === 'pending' && (
          <>
            <Separator />
            <div className="p-6 pt-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={onSendMessage}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Enviar Mensagem
                </Button>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onRejectProposal}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={onAcceptProposal}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aceitar Proposta
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProposalDetailsModal;

