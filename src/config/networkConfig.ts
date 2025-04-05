// networkConfig.ts
import { createPublicClient, createWalletClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Helper function to validate and normalize private key
function validatePrivateKey(privateKey: string): `0x${string}` {
  // Remove any whitespace or newlines
  const cleaned = privateKey.trim();
  
  // Check if it starts with 0x
  if (!cleaned.startsWith('0x')) {
    throw new Error('Private key must start with 0x');
  }

  // Check length (64 hex chars + 0x prefix = 66 chars)
  if (cleaned.length !== 66) {
    throw new Error('Private key must be 64 hex characters long (excluding 0x prefix)');
  }

  // Check if it's valid hex
  if (!/^0x[0-9a-fA-F]{64}$/.test(cleaned)) {
    throw new Error('Private key must contain only hexadecimal characters');
  }

  return cleaned as `0x${string}`;
}

export function createViemPublicClient(chainName: string, privateKey?: string) {
  const chain = monadTestnet;
  
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  let walletClient = null;
  if (privateKey) {
    try {
      const validatedKey = validatePrivateKey(privateKey);
      walletClient = createWalletClient({
        chain,
        transport: http(),
        account: privateKeyToAccount(validatedKey)
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Invalid private key:', errorMessage);
      throw new Error('Failed to initialize wallet client due to invalid private key');
    }
  }

  return {
    publicClient,
    walletClient,
    chain,
  };
}