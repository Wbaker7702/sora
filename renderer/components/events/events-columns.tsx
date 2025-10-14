"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";

import { MoreHorizontal, Play, Edit, Trash2, Eye } from "lucide-react";

export type Network = {
  [key: string]: any;
};

export const createContractEventsColumns = (
  onEdit: (event: any) => void,
  onDelete: (event: any) => void,
  onTrigger: (event: any) => void
): ColumnDef<Network>[] => {
  return [
    {
      accessorKey: "startLedger",
      header: "Start Ledger",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("startLedger")}</div>
      ),
    },
    {
      accessorKey: "rpcUrl",
      header: "RPC URL",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
          {row.getValue("rpcUrl")}
        </div>
      ),
    },
    {
      accessorKey: "network",
      header: "Network",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("network")}</Badge>
      ),
    },
    {
      accessorKey: "eventType",
      header: "Event Type",
      cell: ({ row }) => {
        const eventType = row.getValue("eventType") as string;
        return (
          <Badge 
            variant={eventType === "contract" ? "default" : eventType === "system" ? "secondary" : "outline"}
          >
            {eventType || "all"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "contractId",
      header: "Contract ID",
      cell: ({ row }) => {
        const contractId = row.getValue("contractId") as string;
        return (
          <div className="max-w-[150px] truncate text-sm text-muted-foreground">
            {contractId || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => {
        const count = row.getValue("count") as number;
        return (
          <div className="text-center">
            {count || "N/A"}
          </div>
        );
      },
    },
    {
      accessorKey: "useGlobalConfig",
      header: "Global",
      cell: ({ row }) => {
        const isGlobal = row.getValue("useGlobalConfig") as boolean;
        return (
          <Badge variant={isGlobal ? "default" : "outline"}>
            {isGlobal ? "Yes" : "No"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const event = row.original;
        
        return (
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTrigger(event)}
              className="h-8 w-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onEdit(event)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(event)}
                  className="cursor-pointer text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/events/${encodeURIComponent(event.startLedger)}`}
                    className="cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
