
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  XCircle
} from 'lucide-react';

interface Step {
  id: number;
  title: string;
  price: number;
  status?: string;
  description?: string;
}

interface StepCardProps {
  step: Step;
  index: number;
  isLast?: boolean;
  showConnector?: boolean;
}

const getStepStatusConfig = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'concluido':
    case 'concluída':
      return {
        icon: CheckCircle,
        label: 'Concluído',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        variant: 'default' as const
      };
    case 'in_progress':
    case 'em_andamento':
      return {
        icon: Clock,
        label: 'Em Andamento',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        variant: 'default' as const
      };
    case 'cancelled':
    case 'cancelado':
      return {
        icon: XCircle,
        label: 'Cancelado',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        variant: 'destructive' as const
      };
    case 'pending':
    case 'pendente':
    default:
      return {
        icon: AlertCircle,
        label: 'Pendente',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        variant: 'outline' as const
      };
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isLast = false,
  showConnector = true
}) => {
  const statusConfig = getStepStatusConfig(step.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative">
      <Card className={`transition-all duration-200 hover:shadow-sm ${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Step Number Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${
                step.status === 'completed' || step.status === 'concluido' 
                  ? 'bg-green-500' 
                  : step.status === 'in_progress' || step.status === 'em_andamento'
                  ? 'bg-blue-500'
                  : step.status === 'cancelled' || step.status === 'cancelado'
                  ? 'bg-red-500'
                  : 'bg-orange-500'
              }`}>
                {step.status === 'completed' || step.status === 'concluido' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              
              {/* Connector Line */}
              {showConnector && !isLast && (
                <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-base leading-tight">
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className="flex items-center gap-1 font-bold text-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">{formatCurrency(step.price)}</span>
                  </div>
                  
                  {step.status && (
                    <Badge variant={statusConfig.variant} className="text-xs">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepCard;

