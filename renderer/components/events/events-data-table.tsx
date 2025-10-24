"use client";
import { useState } from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";

import { MoreHorizontal, Play, Edit, Trash2, Filter, X } from "lucide-react";

import ContractEventModal from "components/events/event-modal";
import { EditContractEventModal } from "components/events/edit-event-modal";
import { RemoveContractEventModal } from "components/events/remove-event-modal";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: any[];
  onEdit?: (event: any) => void;
  onDelete?: (event: any) => void;
  onTrigger?: (event: any) => void;
}

export function EventsDataTable<TData, TValue>({
  columns,
  data,
  onEdit,
  onDelete,
  onTrigger,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showCreateContractEventsDialog, setShowCreateContractEventsDialog] =
    useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [commandOutput, setCommandOutput] = useState<string>("");
  const [commandError, setCommandError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 5,
        pageIndex: 0,
      },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const handleEditEvent = (event: any) => {
    if (onEdit) {
      onEdit(event);
    } else {
      setSelectedEvent(event);
      setShowEditDialog(true);
    }
  };

  const handleDeleteEvent = (event: any) => {
    if (onDelete) {
      onDelete(event);
    } else {
      setSelectedEvent(event);
      setShowDeleteDialog(true);
    }
  };

  const handleTriggerCommand = async (event: any) => {
    if (onTrigger) {
      onTrigger(event);
    }
    setIsExecuting(true);
    setCommandOutput("");
    setCommandError("");
    
    try {
      // Build the command arguments and flags
      const args = [
        `--start-ledger ${event.startLedger}`,
        event.cursor ? `--cursor "${event.cursor}"` : "",
        event.rpcUrl ? `--rpc-url "${event.rpcUrl}"` : "",
        event.networkPassphrase ? `--network-passphrase "${event.networkPassphrase}"` : "",
        event.network ? `--network "${event.network}"` : "",
      ].filter(Boolean);
      
      const flags = [
        event.output ? `--output ${event.output}` : null,
        event.count ? `--count ${event.count}` : null,
        event.contractId ? `--id ${event.contractId}` : null,
        event.topicFilters ? `--topic ${event.topicFilters}` : null,
        event.eventType ? `--type ${event.eventType}` : null,
        event.useGlobalConfig ? "--global" : null,
        event.configDir ? `--config-dir "${event.configDir}"` : null,
      ].filter(Boolean);

      // Execute the command using the soroban API
      const result = await window.sorobanApi.runSorobanCommand(
        "soroban",
        "events",
        args,
        flags,
        event.configDir || undefined
      );
      
      setCommandOutput(result);
    } catch (error: any) {
      setCommandError(error.message || "Command execution failed");
    } finally {
      setIsExecuting(false);
    }
  };

  const clearFilters = () => {
    setColumnFilters([]);
    setGlobalFilter("");
  };

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <Input
            placeholder="Search all contract events..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {Object.keys(columnFilters).length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(columnFilters).length}
              </Badge>
            )}
          </Button>
          {Object.keys(columnFilters).length > 0 && (
            <Button variant="ghost" onClick={clearFilters} size="sm">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <Button onClick={() => setShowCreateContractEventsDialog(true)}>
          Add New Contract Event
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Ledger</label>
              <Input
                placeholder="Filter by start ledger..."
                value={(table.getColumn("startLedger")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("startLedger")?.setFilterValue(event.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Network</label>
              <Input
                placeholder="Filter by network..."
                value={(table.getColumn("network")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("network")?.setFilterValue(event.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">RPC URL</label>
              <Input
                placeholder="Filter by RPC URL..."
                value={(table.getColumn("rpcUrl")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("rpcUrl")?.setFilterValue(event.target.value)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select
                value={(table.getColumn("eventType")?.getFilterValue() as string) ?? ""}
                onValueChange={(value) =>
                  table.getColumn("eventType")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Command Output Section */}
      {(commandOutput || commandError) && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Command Output</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCommandOutput("");
                setCommandError("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
            {commandError ? (
              <div className="text-red-400">{commandError}</div>
            ) : (
              <pre className="whitespace-pre-wrap">{commandOutput}</pre>
            )}
          </div>
        </div>
      )}

      {/* Loading indicator for command execution */}
      {isExecuting && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Executing command...</span>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="max-h-[calc(85vh-130px)] overflow-y-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="h-16">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-[54vh] text-center"
                  >
                    No contract events found with the current filters!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <div className="flex-1 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 15].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    onClick={() => table.setPageSize(pageSize)}
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center w-[100px] justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <DoubleArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <DoubleArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContractEventModal
        showCreateContractEventDialog={showCreateContractEventsDialog}
        setShowCreateContractEventialog={setShowCreateContractEventsDialog}
      />
      
      {selectedEvent && (
        <>
          <EditContractEventModal
            contractEvent={selectedEvent}
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedEvent(null);
            }}
          />
          
          <RemoveContractEventModal
            contractEvent={selectedEvent}
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setSelectedEvent(null);
            }}
          />
        </>
      )}
    </div>
  );
}
