import * as z from "zod";

export const removeContractEventFormSchema = z.object({
  startLedger: z.string(),
  contractId: z.string().optional(),
});

export async function onRemoveContractEventFormSubmit(
  data: z.infer<typeof removeContractEventFormSchema>
) {
  try {
    await window.sorobanApi.manageContractEvents("remove", {
      start_ledger: data.startLedger,
      contract_id: data.contractId || "",
    });
    
    await window.sorobanApi.reloadApplication();
    return true;
  } catch (error) {
    console.error("Error on removing contract event:", error);
    throw error;
  }
}
