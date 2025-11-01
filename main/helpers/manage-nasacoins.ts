export function handleNasacoins(store, action, nasacoin, updatedNasacoin?) {
  let nasacoins = store.get("nasacoins", []);

  switch (action) {
    case "add":
      // Check if the nasacoin already exists
      if (nasacoins.some((n) => n.contractId === nasacoin.contractId && n.network === nasacoin.network)) {
        throw new Error("Nasacoin with this contract ID already exists on this network");
      }
      if (!nasacoin.id || !nasacoin.name || !nasacoin.contractId) {
        throw new Error("Missing required fields: id, name, or contractId");
      }

      nasacoins.push({
        ...nasacoin,
        createdAt: nasacoin.createdAt || new Date().toISOString(),
      });
      break;

    case "update":
      // Find the index of the nasacoin
      const existingNasacoinIndex = nasacoins.findIndex(
        (n) => n.id === nasacoin.id
      );
      if (existingNasacoinIndex === -1) {
        throw new Error("Nasacoin not found");
      }

      // Update the nasacoin
      nasacoins[existingNasacoinIndex] = {
        ...nasacoins[existingNasacoinIndex],
        ...updatedNasacoin,
        id: nasacoin.id, // Preserve the ID
      };
      break;

    case "delete":
      const nasacoinIndexToRemove = nasacoins.findIndex(
        (n) => n.id === nasacoin.id
      );
      if (nasacoinIndexToRemove === -1) {
        throw new Error("Nasacoin not found");
      }
      nasacoins.splice(nasacoinIndexToRemove, 1);
      break;

    case "get":
      if (nasacoin && nasacoin.id) {
        // Return the requested nasacoin
        const requestedNasacoin = nasacoins.find((n) => n.id === nasacoin.id);
        return requestedNasacoin || null;
      }
      // Return all nasacoins if no specific nasacoin is requested
      return nasacoins;

    case "getByContractId":
      if (nasacoin && nasacoin.contractId && nasacoin.network) {
        // Return nasacoin matching contract ID and network
        const requestedNasacoin = nasacoins.find(
          (n) =>
            n.contractId === nasacoin.contractId &&
            n.network === nasacoin.network
        );
        return requestedNasacoin || null;
      }
      throw new Error("contractId and network are required for getByContractId");

    default:
      throw new Error("Invalid action");
  }

  // Update the store (not necessary for 'get' actions)
  if (action !== "get" && action !== "getByContractId") {
    store.set("nasacoins", nasacoins);
  }

  // Return the updated nasacoins array or the requested nasacoin
  if (action === "get" && nasacoin && nasacoin.id) {
    const requestedNasacoin = nasacoins.find((n) => n.id === nasacoin.id);
    return requestedNasacoin || null;
  }
  if (action === "getByContractId") {
    const requestedNasacoin = nasacoins.find(
      (n) =>
        n.contractId === nasacoin.contractId &&
        n.network === nasacoin.network
    );
    return requestedNasacoin || null;
  }

  return nasacoins;
}
