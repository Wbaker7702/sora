export function handleContractEvents(store, action, contractSettings) {
  let contracts = store.get("contractEvents", []); // Ensure the default is an array

  switch (action) {
    case "add":
      // Validate contractSettings and ensure it's an object before adding
      if (
        typeof contractSettings === "object" &&
        !Array.isArray(contractSettings) && // Make sure it's not an array
        contractSettings.start_ledger &&
        contractSettings.rpc_url &&
        contractSettings.network_passphrase &&
        contractSettings.network
      ) {
        contracts.push(contractSettings); // Add to the array
      } else {
        throw new Error("Invalid contract settings");
      }
      break;

    case "update":
      // Validate that contractSettings is an object with the required `start_ledger`
      if (
        typeof contractSettings === "object" &&
        !Array.isArray(contractSettings) &&
        contractSettings.start_ledger
      ) {
        const index = contracts.findIndex(
          (c) => c.start_ledger === contractSettings.start_ledger
        );
        if (index !== -1) {
          contracts[index] = { ...contracts[index], ...contractSettings }; // Update the object
        } else {
          throw new Error("Contract event to update not found");
        }
      } else {
        throw new Error("Invalid contract settings for update");
      }
      break;

    case "remove":
      // Validate contractSettings and check for `start_ledger`
      if (
        typeof contractSettings === "object" &&
        !Array.isArray(contractSettings) &&
        contractSettings.start_ledger
      ) {
        contracts = contracts.filter(
          (c) => c.start_ledger !== contractSettings.start_ledger
        ); // Remove from the array
      } else {
        throw new Error("Invalid contract settings for remove");
      }
      break;

    case "get":
      if (contractSettings.start_ledger) {
        const contract = contracts.find(
          (c) => c.start_ledger === contractSettings.start_ledger
        );
        return contract || null; // Return the found object or null
      }
      return contracts; // Return the whole array

    case "list":
      // Return all contract events
      return contracts;

    default:
      throw new Error("Invalid action");
  }

  store.set("contractEvents", contracts); // Save the array back to the store
  return contracts;
}
