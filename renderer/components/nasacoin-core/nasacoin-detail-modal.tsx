"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { useToast } from "components/ui/use-toast";
import type { Nasacoin } from "types/nasacoin";

interface NasacoinDetailModalProps {
  nasacoin: Nasacoin | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NasacoinDetailModal({
  nasacoin,
  isOpen,
  onClose,
}: NasacoinDetailModalProps) {
  const [balance, setBalance] = useState<string>("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [identities, setIdentities] = useState<any[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && nasacoin) {
      fetchIdentities();
    }
  }, [isOpen, nasacoin]);

  const fetchIdentities = async () => {
    try {
      const idents = await window.sorobanApi.manageIdentities("get", "");
      setIdentities(idents || []);
      const activeIdentity = idents?.find((i: any) => i.active);
      if (activeIdentity) {
        setSelectedIdentity(activeIdentity.name);
      } else if (idents?.length > 0) {
        setSelectedIdentity(idents[0].name);
      }
    } catch (error) {
      console.error("Error fetching identities:", error);
    }
  };

  const queryBalance = async () => {
    if (!nasacoin || !selectedIdentity) {
      toast({
        title: "Error",
        description: "Please select an identity",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingBalance(true);
    try {
      // Query balance using Soroban CLI
      // Format: soroban contract invoke --id <contract_id> --source <identity> --network <network> -- balance --id <identity_address>
      
      const networkFlag = `--network=${nasacoin.network}`;
      const result = await window.sorobanApi.runSorobanCommand(
        "contract",
        "invoke",
        [`--id=${nasacoin.contractId}`, `--source=${selectedIdentity}`, networkFlag, "--", "balance", `--id=${selectedIdentity}`],
        ["--is-view"]
      );

      // Parse the result - balance is typically returned as a string number
      const balanceMatch = result.match(/(\d+)/);
      if (balanceMatch) {
        const rawBalance = balanceMatch[1];
        const divisor = Math.pow(10, nasacoin.decimals);
        const formattedBalance = (parseInt(rawBalance) / divisor).toFixed(nasacoin.decimals);
        setBalance(formattedBalance);
        toast({
          title: "Success",
          description: `Balance: ${formattedBalance} ${nasacoin.symbol}`,
        });
      } else {
        setBalance("0");
        toast({
          title: "Balance Retrieved",
          description: "Balance: 0 (or unable to parse)",
        });
      }
    } catch (error: any) {
      console.error("Error querying balance:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to query balance",
        variant: "destructive",
      });
      setBalance("Error");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const copyContractId = () => {
    if (nasacoin) {
      navigator.clipboard.writeText(nasacoin.contractId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Contract ID copied to clipboard",
      });
    }
  };

  if (!nasacoin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{nasacoin.name} ({nasacoin.symbol})</DialogTitle>
          <DialogDescription>
            View details and manage your nasacoin token
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contract Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contract ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs max-w-[300px] truncate">
                    {nasacoin.contractId}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyContractId}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network:</span>
                <Badge variant="outline">{nasacoin.network}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Decimals:</span>
                <span>{nasacoin.decimals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm">
                  {new Date(nasacoin.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Balance</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={queryBalance}
                  disabled={isLoadingBalance || !selectedIdentity}
                >
                  {isLoadingBalance ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {identities.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Select Identity:
                    </label>
                    <select
                      value={selectedIdentity}
                      onChange={(e) => setSelectedIdentity(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {identities.map((identity: any) => (
                        <option key={identity.name} value={identity.name}>
                          {identity.name}
                          {identity.active ? " (Active)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  {balance && (
                    <div className="p-4 bg-muted rounded-md">
                      <div className="text-2xl font-bold">
                        {balance} {nasacoin.symbol}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No identities found. Create an identity to query balance.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
