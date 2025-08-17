
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProposalStep {
  id: number;
  title: string;
  price: number;
  status?: string;
}

interface ProposalData {
  ticket_id: number;
  steps: ProposalStep[];
  total: number;
  status?: string;
}

interface ProposalMessageProps {
  proposalData: ProposalData;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  onViewDetails?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
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

const formatTime = (dateString: string) => {
  try {
    return format(new Date(dateString), 'HH:mm', { locale: ptBR });
  } catch (error) {
    return '';
  }
};

export const ProposalMessage: React.FC<ProposalMessageProps> = ({
  proposalData,
  timestamp,
  isOwn,
  senderName,
  onViewDetails,
  onAccept,
  onReject,
  canInteract = false
}) => {
  const statusConfig = getStatusConfig(proposalData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-md ${isOwn ? 'ml-12' : 'mr-12'}`}>
        <Card className={`transition-all duration-200 hover:shadow-lg ${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                  <FileText className={`h-5 w-5 ${statusConfig.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">
                      Proposta #{proposalData.ticket_id}
                    </h4>
                    {!isOwn && senderName && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {senderName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusConfig.variant} className="text-xs">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatTime(timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Resumo das etapas */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {proposalData.steps.length} etapa{proposalData.steps.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-1 font-bold text-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">{formatCurrency(proposalData.total)}</span>
                </div>
              </div>

              {/* Lista de etapas (resumida) */}
              <div className="space-y-2">
                {proposalData.steps.slice(0, 3).map((step, index) => (
                  <div key={step.id} className="bg-white/70 p-2 rounded border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {step.title}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(step.price)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {proposalData.steps.length > 3 && (
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      +{proposalData.steps.length - 3} etapa{proposalData.steps.length - 3 !== 1 ? 's' : ''} adiciona{proposalData.steps.length - 3 !== 1 ? 'is' : 'l'}
                    </span>
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewDetails}
                  className={`${statusConfig.color} hover:bg-white/50 text-xs`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver Detalhes
                </Button>

                {canInteract && !isOwn && proposalData.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReject}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={onAccept}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aceitar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProposalMessage;

