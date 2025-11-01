"use client";

import { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";

import { Avatar, AvatarImage } from "components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";

import { Coins, Plus } from "lucide-react";
import NasacoinModal from "components/nasacoin-core/nasacoin-modal";
import { ScrollArea, ScrollBar } from "components/ui/scroll-area";
import NoNasacoin from "components/nasacoin-core/no-nasacoin";

const NasacoinCard = ({
  nasacoin,
  onNasacoinChange,
}: {
  nasacoin: {
    id: string;
    name: string;
    symbol: string;
    contractId: string;
    network: string;
    balance?: string;
    decimals: number;
    createdAt: string;
  };
  onNasacoinChange: () => void;
}) => {
  return (
    <Card className="col-span-1" key={nasacoin.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="mr-4 h-10 w-10">
              <AvatarImage
                src={`https://avatar.vercel.sh/${nasacoin.name}.png`}
                alt={nasacoin.name}
              />
            </Avatar>
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-medium">{nasacoin.name}</CardTitle>
              <CardDescription>
                {nasacoin.symbol} ? {nasacoin.network}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline">{nasacoin.network}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Contract ID:</span>
            <span className="font-mono text-xs truncate max-w-[200px]">
              {nasacoin.contractId}
            </span>
          </div>
          {nasacoin.balance && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-semibold">{nasacoin.balance}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Decimals:</span>
            <span>{nasacoin.decimals}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Handle view details
              console.log("View details for", nasacoin.id);
            }}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // Handle transfer
              console.log("Transfer", nasacoin.id);
            }}
          >
            Transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function NasacoinCoreComponent() {
  const [showCreateNasacoinDialog, setShowCreateNasacoinDialog] =
    useState(false);
  const [nasacoins, setNasacoins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  async function checkNasacoins() {
    try {
      const nasacoins = await window.sorobanApi.manageNasacoins("get", "");

      setNasacoins(nasacoins || []);
    } catch (error) {
      console.log("Error invoking remote method:", error);
    }
  }

  const refreshNasacoins = async () => {
    await checkNasacoins();
  };

  const handleSearchChange = (e: any) => {
    e.preventDefault();
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    checkNasacoins();
  }, []);

  const filteredNasacoins = nasacoins.filter((nasacoin) =>
    nasacoin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nasacoin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nasacoin.contractId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-106px)]">
      <div className="flex items-center justify-between">
        <Alert className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <Coins className="h-5 w-5 mr-4" />
            <div>
              <AlertTitle>
                You have {nasacoins?.length ? nasacoins?.length : "0"} nasacoin
                {nasacoins?.length !== 1 ? "s" : ""} registered
              </AlertTitle>
              <AlertDescription>
                Manage and interact with your nasacoin tokens and contracts.
              </AlertDescription>
            </div>
          </div>
          <Button onClick={() => setShowCreateNasacoinDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Nasacoin
          </Button>
        </Alert>
        <NasacoinModal
          showNasacoinDialog={showCreateNasacoinDialog}
          setShowNasacoinDialog={setShowCreateNasacoinDialog}
          onNasacoinChange={refreshNasacoins}
        />
      </div>
      {nasacoins?.length > 0 ? (
        <div>
          <div className="my-6">
            <Input
              type="search"
              placeholder={`Search nasacoins (${nasacoins.length} total)`}
              onChange={handleSearchChange}
              value={searchQuery}
            />
          </div>
          <ScrollArea className="h-[calc(100vh-300px)] overflow-y-auto">
            <div className="grid grid-cols-3 gap-8">
              {filteredNasacoins.map((nasacoin) => (
                <NasacoinCard
                  key={nasacoin.id}
                  nasacoin={nasacoin}
                  onNasacoinChange={refreshNasacoins}
                />
              ))}
            </div>
            <ScrollBar />
          </ScrollArea>
        </div>
      ) : (
        <NoNasacoin onAddClick={() => setShowCreateNasacoinDialog(true)} />
      )}
    </div>
  );
}
