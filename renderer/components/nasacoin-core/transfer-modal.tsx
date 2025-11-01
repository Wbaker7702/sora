"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "components/ui/form";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useToast } from "components/ui/use-toast";
import type { Nasacoin } from "types/nasacoin";

const transferFormSchema = z.object({
  from: z.string().min(1, "Source identity is required"),
  to: z.string().min(1, "Destination address is required"),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
});

type TransferFormData = z.infer<typeof transferFormSchema>;

interface TransferModalProps {
  nasacoin: Nasacoin | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransferModal({
  nasacoin,
  isOpen,
  onClose,
  onSuccess,
}: TransferModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      from: "",
      to: "",
      amount: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchIdentities();
    }
  }, [isOpen]);

  const fetchIdentities = async () => {
    try {
      const idents = await window.sorobanApi.manageIdentities("get", "");
      setIdentities(idents || []);
      const activeIdentity = idents?.find((i: any) => i.active);
      if (activeIdentity) {
        form.setValue("from", activeIdentity.name);
      } else if (idents?.length > 0) {
        form.setValue("from", idents[0].name);
      }
    } catch (error) {
      console.error("Error fetching identities:", error);
    }
  };

  const handleSubmit = async (data: TransferFormData) => {
    if (!nasacoin) return;

    setIsSubmitting(true);
    try {
      // Calculate the amount in the smallest unit (accounting for decimals)
      const amountInSmallestUnit = (
        parseFloat(data.amount) * Math.pow(10, nasacoin.decimals)
      ).toString();

      // Execute transfer using Soroban CLI
      // Format: soroban contract invoke --id <contract_id> --source <from_identity> --network <network> -- transfer --from <from_address> --to <to_address> --amount <amount>
      
      const networkFlag = `--network=${nasacoin.network}`;
      const result = await window.sorobanApi.runSorobanCommand(
        "contract",
        "invoke",
        [
          `--id=${nasacoin.contractId}`,
          `--source=${data.from}`,
          networkFlag,
          "--",
          "transfer",
          `--from=${data.from}`,
          `--to=${data.to}`,
          `--amount=${amountInSmallestUnit}`,
        ],
        []
      );

      toast({
        title: "Success",
        description: `Transferred ${data.amount} ${nasacoin.symbol} successfully`,
      });

      form.reset();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer tokens",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>
                Transfer {nasacoin?.symbol || "Tokens"}
              </DialogTitle>
              <DialogDescription>
                Transfer {nasacoin?.name} tokens to another address
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From (Source Identity)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source identity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {identities.map((identity: any) => (
                          <SelectItem key={identity.name} value={identity.name}>
                            {identity.name}
                            {identity.active ? " (Active)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To (Destination Address)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="GABC..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({nasacoin?.symbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {nasacoin && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md">
                  Network: {nasacoin.network} | Decimals: {nasacoin.decimals}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {isSubmitting ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </Button>
              ) : (
                <Button type="submit">Transfer</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
