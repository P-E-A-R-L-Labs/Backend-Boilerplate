// sendTransactionTool.ts
import type { Tool } from '../config/toolconfig';
import { initializeChainClients } from '../config/networkConfig';
import type { ChainName } from '../config/networkConfig';

export const createSendTransactionTool = (chainName: ChainName, privateKey?: `0x${string}`): Tool => {
  const { publicClient, walletClient } = initializeChainClients(chainName, privateKey);

  return {
    name: 'send_transaction',
    description: 'Send native tokens from one address to another on the blockchain',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient address (0x...)',
          pattern: '^0x[a-fA-F0-9]{40}$',
        },
        value: {
          type: 'string',
          description: 'Amount of native token to send in wei',
          pattern: '^[0-9]+$',
        },
        chain: {
          type: 'string',
          description: 'Blockchain network to use',
          enum: ['monad'],
          default: 'monad'
        }
      },
      required: ['to', 'value'],
    },
    execute: async (params: Record<string, any>) => {
      if (!walletClient) {
        throw new Error('Wallet client not initialized - private key required');
      }

      try {
        const [account] = await walletClient.getAddresses();
        
        const txHash = await walletClient.sendTransaction({
          account,
          to: params.to,
          value: BigInt(params.value),
        });

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        return JSON.stringify({
          status: receipt.status,
          transactionHash: txHash,
          from: receipt.from,
          to: receipt.to,
          blockNumber: receipt.blockNumber,
          chain: params.chain || chainName,
        });
      } catch (error) {
        console.error('Transaction failed:', error);
        throw new Error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
};