"use client";

import { Coins } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";

interface NoNasacoinProps {
  onAddClick?: () => void;
}

export default function NoNasacoin({ onAddClick }: NoNasacoinProps) {
  return (
    <Card className="flex flex-col items-center justify-center p-12 mt-12">
      <CardHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Coins className="h-16 w-16 text-muted-foreground" />
          <CardTitle className="text-2xl">No Nasacoins Found</CardTitle>
          <CardDescription className="text-center max-w-md">
            Get started by adding your first nasacoin token or contract. You can
            register existing nasacoin contracts or create new ones.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={onAddClick}>
          Add Your First Nasacoin
        </Button>
      </CardContent>
    </Card>
  );
}
