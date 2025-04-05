// chainConfig.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export const CHAINS = {
  monad: monadTestnet,
  // Add other chains here as needed
};

export type ChainName = keyof typeof CHAINS;

export function initializeChainClients(chainName: ChainName, privateKey?: `0x${string}`) {
  const chain = CHAINS[chainName];
  
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  let walletClient = null;
  if (privateKey) {
    walletClient = createWalletClient({
      chain,
      transport: http(),
      account: privateKeyToAccount(privateKey)
    });
  }

  return {
    publicClient,
    walletClient,
    chain,
  };
}

// Helper function to get public client without wallet capabilities
export function createViemPublicClient(chainName: ChainName = 'monad') {
  return initializeChainClients(chainName).publicClient;
}