import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (contractData: ContractData) => Promise<void>;
  receiverName: string;
  isDesigner: boolean;
}

export interface ContractData {
  price: number;
  terms: string;
  serviceDescription: string;
}

const contractSchema = z.object({
  price: z.coerce.number()
    .min(1, { message: "Price must be at least $1" })
    .max(100000, { message: "Price cannot exceed $100,000" }),
  terms: z.string()
    .min(10, { message: "Terms must be at least 10 characters" })
    .max(1000, { message: "Terms cannot exceed 1000 characters" }),
  serviceDescription: z.string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(200, { message: "Description cannot exceed 200 characters" }),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export function ContractDialog({
  open,
  onOpenChange,
  onSubmit,
  receiverName,
  isDesigner,
}: ContractDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const defaultValues: Partial<ContractFormValues> = {
    price: 0,
    terms: isDesigner 
      ? "Payment Schedule:\n- 50% upfront deposit\n- 50% upon completion\n\nTimeline:\n- Project starts within 5 business days after deposit\n- Estimated completion in 3 weeks\n\nRevisions:\n- Up to 3 revisions included"
      : "I agree to pay the full amount upon completion of the service to my satisfaction.",
    serviceDescription: isDesigner 
      ? "Interior Design Consultation"
      : "Design Service Request",
  };

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues,
  });

  const handleSubmit = async (data: ContractFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      form.reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting contract:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> 
            Create Service Contract
          </DialogTitle>
          <DialogDescription>
            {isDesigner 
              ? `Create a service contract for ${receiverName}. They'll need to accept it before work begins.`
              : `Create a service contract for ${receiverName} to provide design services.`}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Description</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Briefly describe the service" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear title for the service you're {isDesigner ? "offering" : "requesting"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the total price for this service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the terms and conditions" 
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include payment schedule, timeline, and any other important details
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  'Send Contract'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}