import * as z from "zod";

export const editContractEventFormSchema = z.object({
  start_ledger: z.string().min(1, "Start ledger must be at least 1."),
  cursor: z.string().min(1, "Cursor cannot be empty."),
  output: z
    .enum(["pretty", "plain", "json"])
    .refine((value) => ["pretty", "plain", "json"].includes(value), {
      message: "Output must be 'pretty', 'plain', or 'json'.",
    })
    .optional(),
  count: z.string().min(1, "Count must be at least 1.").optional(),
  contract_id: z
    .string()
    .max(200, "A maximum of 5 contract IDs allowed.")
    .optional(),
  topic_filters: z
    .string()
    .max(200, "A maximum of 4 topic filters allowed.")
    .optional(),
  event_type: z
    .enum(["all", "contract", "system"])
    .refine((value) => ["all", "contract", "system"].includes(value), {
      message: "Event type must be 'all', 'contract', or 'system'.",
    })
    .optional(),
  is_global: z.boolean().optional(),
  config_dir: z.string().optional(),
  rpc_url: z.string().min(1, "RPC URL cannot be empty."),
  network_passphrase: z.string().min(1, "Network passphrase cannot be empty."),
  network: z.string().min(1, "Network cannot be empty."),
});

export async function onEditContractEventFormSubmit(
  data: z.infer<typeof editContractEventFormSchema>
) {
  try {
    // Update the contract event in the store
    await window.sorobanApi.manageContractEvents("update", {
      start_ledger: data.start_ledger,
      cursor: data.cursor,
      output: data.output,
      count: data.count,
      contract_id: data.contract_id,
      topic_filters: data.topic_filters,
      event_type: data.event_type,
      is_global: data.is_global,
      config_dir: data.config_dir,
      rpc_url: data.rpc_url,
      network_passphrase: data.network_passphrase,
      network: data.network,
    });
    
    await window.sorobanApi.reloadApplication();
    return true;
  } catch (error) {
    console.error("Error on editing contract event:", error);
    throw error;
  }
}
