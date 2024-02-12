"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "components/ui/accordion";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "components/ui/form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

import { Checkbox } from "components/ui/checkbox";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { ScrollArea, ScrollBar } from "components/ui/scroll-area";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Loader2 } from "lucide-react";

import {
  createNetworkFormSchema,
  onCreateNetworkFormSubmit,
} from "components/settings/forms/createNetwork";

import { useToast } from "components/ui/use-toast";
import { networkCreateError, networkCreateSuccess } from "lib/notifications";

export default function NetworkModal({
  showNewNetworkDialog,
  setShowNewNetworkDialog,
  onNetworkChange,
}) {
  const [isSubmittingNewNetwork, setIsSubmittingNewNetwork] = useState(false);

  const { toast } = useToast();

  const createNewNetworkform = useForm<z.infer<typeof createNetworkFormSchema>>(
    {
      resolver: zodResolver(createNetworkFormSchema),
      defaultValues: {
        global: false,
      },
    }
  );

  const handleNewNetworkFormSubmit = async (data) => {
    setIsSubmittingNewNetwork(true);
    try {
      await onCreateNetworkFormSubmit(data).then(() => {
        toast(networkCreateSuccess(data.network_name));
        setShowNewNetworkDialog(false);
        createNewNetworkform.reset();
        onNetworkChange();
      });
    } catch (error) {
      toast(networkCreateError(data.network_name, error));
    } finally {
      setIsSubmittingNewNetwork(false);
    }
  };

  async function getDirectoryPath() {
    try {
      const result = await window.sorobanApi.openDirectory();
      return result;
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }

  return (
    <Dialog
      open={showNewNetworkDialog}
      onOpenChange={() => setShowNewNetworkDialog(false)}
    >
      <DialogContent>
        <Form {...createNewNetworkform}>
          <form
            onSubmit={createNewNetworkform.handleSubmit(
              handleNewNetworkFormSubmit
            )}
          >
            <DialogHeader>
              <DialogTitle>Create New Network</DialogTitle>
              <DialogDescription>
                Add a new network for Soroban
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[450px] overflow-y-auto">
              <div>
                <div className="space-y-4 py-4 pb-4">
                  <div className="space-y-3">
                    <FormField
                      control={createNewNetworkform.control}
                      name="network_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-small">
                            Network Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Hello Soroban"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-3">
                    <FormField
                      control={createNewNetworkform.control}
                      name="rpc_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-small">RPC URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              id="rpc_url"
                              placeholder="http://localhost:1234"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-3">
                    <FormField
                      control={createNewNetworkform.control}
                      name="network_passphrase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-small">
                            Network Passphrase
                          </FormLabel>
                          <FormControl>
                            <Input {...field} id="network_passphrase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Accordion type="single" collapsible>
                    <AccordionItem value="options" className="pt-0">
                      <AccordionTrigger>Options</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <FormField
                              control={createNewNetworkform.control}
                              name="global"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Global</FormLabel>
                                    <FormDescription>
                                      Use global config
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="space-y-3">
                            <FormField
                              control={createNewNetworkform.control}
                              name="config_dir"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-small">
                                    Config Directory (Testing)
                                  </FormLabel>
                                  <FormControl>
                                    <div className="flex w-full items-center space-x-2">
                                      <Input
                                        type="text"
                                        readOnly
                                        value={field.value}
                                      />
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          getDirectoryPath().then((path) => {
                                            if (path) {
                                              field.onChange(path);
                                            }
                                          });
                                        }}
                                      >
                                        Select
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
              <ScrollBar />
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowNewNetworkDialog(false);
                }}
              >
                Cancel
              </Button>
              {isSubmittingNewNetwork ? (
                <Button type="button" disabled>
                  {" "}
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </Button>
              ) : (
                <Button type="submit">Add</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
