export interface Nasacoin {
  id: string;
  name: string;
  symbol: string;
  contractId: string;
  network: "testnet" | "mainnet" | "futurenet" | "local";
  balance?: string;
  decimals: number;
  createdAt: string;
}

export interface NasacoinFormData {
  name: string;
  symbol: string;
  contractId: string;
  network: "testnet" | "mainnet" | "futurenet" | "local";
  decimals: number;
}
