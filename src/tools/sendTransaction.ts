// sendTransactionTool.ts
import type { Tool } from '../config/toolconfig.ts';
import { createViemPublicClient } from '../config/networkConfig.ts';

export const createSendTransactionTool = (privateKey?: string): Tool => {
  const { publicClient, walletClient } = createViemPublicClient('monad', privateKey);

  return {
    name: 'send_transaction',
    description: 'Send MONAD tokens on Monad testnet',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient address starting with 0x',
          pattern: '^0x[a-fA-F0-9]{40}$'
        },
        value: {
          type: 'string',
          description: 'Amount in wei (1 MONAD = 10^18 wei)',
          pattern: '^[0-9]+$'
        }
      },
      required: ['to', 'value']
    },
    execute: async (params: Record<string, any>) => {
      if (!walletClient) {
        throw new Error('Wallet client not initialized - check your private key');
      }

      try {
        const [account] = await walletClient.getAddresses();
        const txHash = await walletClient.sendTransaction({
          account,
          to: params.to,
          value: BigInt(params.value),
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        return JSON.stringify({
          status: receipt.status,
          txHash,
          from: receipt.from,
          to: receipt.to,
          blockNumber: receipt.blockNumber
        });
      } catch (error) {
        console.error('Transaction failed:', error);
        throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
};