import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Check, Clock, DollarSign, File, Shield, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export interface ContractMessageProps {
  contract: {
    id: string;
    serviceDescription: string;
    price: number;
    terms: string;
    status: 'pending' | 'accepted' | 'rejected' | 'paid';
    createdAt: Date | string;
    isFromCurrentUser: boolean;
  };
  onAccept?: (contractId: string) => Promise<void>;
  onReject?: (contractId: string) => Promise<void>;
  onPay?: (contractId: string) => Promise<void>;
}

export function ContractMessage({ contract, onAccept, onReject, onPay }: ContractMessageProps) {
  const { id, serviceDescription, price, terms, status, createdAt, isFromCurrentUser } = contract;
  
  const handleAccept = async () => {
    if (onAccept) {
      await onAccept(id);
    }
  };
  
  const handleReject = async () => {
    if (onReject) {
      await onReject(id);
    }
  };
  
  const handlePay = async () => {
    if (onPay) {
      await onPay(id);
    }
  };
  
  return (
    <Card className="w-[300px] max-w-full shadow-md border-2 border-muted">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold flex items-center gap-1">
            <File className="h-4 w-4" /> 
            Service Contract
          </CardTitle>
          <div className={`px-2 py-1 rounded-full text-xs ${
            status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
            status === 'accepted' ? 'bg-blue-100 text-blue-700' : 
            status === 'rejected' ? 'bg-red-100 text-red-700' : 
            'bg-green-100 text-green-700'
          }`}>
            {status === 'pending' && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>}
            {status === 'accepted' && <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Accepted</span>}
            {status === 'rejected' && <span className="flex items-center gap-1"><X className="h-3 w-3" /> Rejected</span>}
            {status === 'paid' && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Paid</span>}
          </div>
        </div>
        <CardDescription>{formatRelativeTime(createdAt.toString())}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium">Service</h4>
            <p className="text-sm">{serviceDescription}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Price</h4>
            <p className="text-base font-bold">{formatPrice(price)}</p>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium">Terms</h4>
            <div className="text-xs whitespace-pre-line">{terms}</div>
          </div>
        </div>
      </CardContent>
      
      {status === 'pending' && !isFromCurrentUser && (
        <CardFooter className="pt-0 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={handleReject}
          >
            <X className="h-4 w-4 mr-1" /> Decline
          </Button>
          <Button 
            size="sm" 
            className="w-full" 
            onClick={handleAccept}
          >
            <Check className="h-4 w-4 mr-1" /> Accept
          </Button>
        </CardFooter>
      )}
      
      {status === 'accepted' && !isFromCurrentUser && (
        <CardFooter className="pt-0">
          <Button 
            size="sm" 
            className="w-full" 
            onClick={handlePay}
          >
            <DollarSign className="h-4 w-4 mr-1" /> Make Payment
          </Button>
        </CardFooter>
      )}
      
      {(isFromCurrentUser || (status !== 'pending' && status !== 'accepted') || !onAccept) && (
        <CardFooter className="pt-0">
          <div className="w-full text-xs text-center text-muted-foreground flex items-center justify-center">
            <Shield className="h-3 w-3 mr-1" /> 
            {isFromCurrentUser ? 'Waiting for response' : 'Secured by Z Platform'}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
