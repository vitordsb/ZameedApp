
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Step {
  id: number;
  title: string;
  price: number;
  status?: string;
}

interface Ticket {
  id: number;
  conversation_id: number;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface ProposalCardProps {
  ticket: Ticket;
  steps?: Step[];
  onViewDetails: (ticketId: number) => void;
  loadingSteps?: boolean;
  isExpanded?: boolean;
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

export const ProposalCard: React.FC<ProposalCardProps> = ({
  ticket,
  steps = [],
  onViewDetails,
  loadingSteps = false,
  isExpanded = false
}) => {
  const statusConfig = getStatusConfig(ticket.status);
  const StatusIcon = statusConfig.icon;
  const total = calculateTotal(steps);

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <FileText className={`h-5 w-5 ${statusConfig.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Proposta #{ticket.id}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig.variant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {formatDate(ticket.created_at)}
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(ticket.id)}
            disabled={loadingSteps}
            className={`${statusConfig.color} hover:bg-white/50`}
          >
            <Eye className="h-4 w-4 mr-1" />
            {loadingSteps ? 'Carregando...' : 'Ver Detalhes'}
          </Button>
        </div>
      </CardHeader>

      {steps.length > 0 && (
        <>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <span>Etapas ({steps.length})</span>
                </h4>
                <div className="flex items-center gap-1 font-semibold text-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>

              {isExpanded ? (
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="bg-white/70 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{step.title}</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(step.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {steps.length} etapa{steps.length !== 1 ? 's' : ''} definida{steps.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-gray-500">
                      Clique em "Ver Detalhes" para expandir
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default ProposalCard;

