"use client";

import { useState } from "react";
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

const nasacoinFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol too long"),
  contractId: z.string().min(1, "Contract ID is required"),
  network: z.string().min(1, "Network is required"),
  decimals: z.coerce.number().min(0).max(18).default(7),
});

type NasacoinFormData = z.infer<typeof nasacoinFormSchema>;

export default function NasacoinModal({
  showNasacoinDialog,
  setShowNasacoinDialog,
  onNasacoinChange,
}: {
  showNasacoinDialog: boolean;
  setShowNasacoinDialog: (show: boolean) => void;
  onNasacoinChange: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<NasacoinFormData>({
    resolver: zodResolver(nasacoinFormSchema) as any,
    defaultValues: {
      name: "",
      symbol: "",
      contractId: "",
      network: "testnet",
      decimals: 7,
    },
  });

  const handleSubmit = async (data: NasacoinFormData) => {
    setIsSubmitting(true);
    try {
      await window.sorobanApi.manageNasacoins("add", {
        ...data,
        id: `nasacoin-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: `Nasacoin ${data.name} added successfully`,
      });

      setShowNasacoinDialog(false);
      form.reset();
      onNasacoinChange();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add nasacoin",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={showNasacoinDialog} onOpenChange={setShowNasacoinDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Nasacoin</DialogTitle>
              <DialogDescription>
                Register a new nasacoin token or contract.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Nasacoin Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input placeholder="NSC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CAZNMJ3PKHA2NPFWFNWJ3XSPIDDZBYB2RRMAIVYVJKST6BEU7L3XSCXM"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="network"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="testnet">Testnet</SelectItem>
                        <SelectItem value="mainnet">Mainnet</SelectItem>
                        <SelectItem value="futurenet">Futurenet</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="decimals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decimals</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNasacoinDialog(false)}
              >
                Cancel
              </Button>
              {isSubmitting ? (
                <Button disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </Button>
              ) : (
                <Button type="submit">Add Nasacoin</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
