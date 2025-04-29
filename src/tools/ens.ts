// tools/ensRegistration.ts
import type { Tool } from "../config/toolconfig";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { namehash, labelhash } from "viem/ens";
import * as crypto from "crypto";

// ENS Registry and Registrar contract addresses on Sepolia testnet
const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ETH_REGISTRAR_ADDRESS = "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85";
const PUBLIC_RESOLVER_ADDRESS = "0x4B1488B7a6B320d2D721406204aBc3eeAa9AD329";

// ABI for ENS Registry
const ENS_REGISTRY_ABI = [
  {
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "owner", type: "address" }
    ],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "node", type: "bytes32" }],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "resolver", type: "address" }
    ],
    name: "setResolver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

// ABI for ETH Registrar Controller (simplified)
const ETH_REGISTRAR_ABI = [
  {
    inputs: [{ name: "name", type: "string" }],
    name: "available",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint256" },
      { name: "secret", type: "bytes32" }
    ],
    name: "register",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
];

// ABI for Public Resolver
const PUBLIC_RESOLVER_ABI = [
  {
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "addr", type: "address" }
    ],
    name: "setAddr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

/**
 * Creates an ENS registration tool for registering ENS names on Ethereum testnet
 * @param privateKey - Private key for the wallet that will perform the registration
 * @returns Tool - A configured ENS registration tool
 */
export function createEnsRegistrationTool(privateKey: string): Tool {
  return {
    name: "register_ens_name",
    description: "Register an ENS (Ethereum Name Service) name on Sepolia testnet",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The ENS name to register (without .eth suffix)",
        },
        duration_years: {
          type: "number",
          description: "Registration duration in years",
          default: 1,
        },
        address_to_point_to: {
          type: "string",
          description: "Ethereum address that the ENS name should resolve to (defaults to the registrant address)",
        }
      },
      required: ["name"],
    },
    execute: async (params: Record<string, any>) => {
      try {
        const { name: ensName, duration_years = 1 } = params;
        
        // Validate ENS name (basic validation)
        if (!ensName || typeof ensName !== "string") {
          throw new Error("Invalid ENS name");
        }
        
        if (ensName.includes(".")) {
          throw new Error("Please provide only the name without .eth suffix");
        }
        
        // Set up Ethereum clients
        const account = privateKeyToAccount(`0x${privateKey}`);
        
        const publicClient = createPublicClient({
          chain: sepolia,
          transport: http(),
        });
        
        const walletClient = createWalletClient({
          account,
          chain: sepolia,
          transport: http(),
        });
        
        // Check if the name is available
        const isAvailable = await publicClient.readContract({
          address: ETH_REGISTRAR_ADDRESS,
          abi: ETH_REGISTRAR_ABI,
          functionName: "available",
          args: [ensName],
        });
        
        if (!isAvailable) {
          return `ENS name '${ensName}.eth' is not available for registration.`;
        }
        
        // Calculate registration duration in seconds
        const durationInSeconds = duration_years * 365 * 24 * 60 * 60;
        
        // Generate a random secret for the registration process
        const secret = crypto.randomBytes(32).toString('hex');
        const secretBytes32 = `0x${secret}`;
        
        // Determine address to point the ENS record to
        const addressToPointTo = params.address_to_point_to || account.address;
        
        // Register the ENS name
        const hash = await walletClient.writeContract({
          address: ETH_REGISTRAR_ADDRESS,
          abi: ETH_REGISTRAR_ABI,
          functionName: "register",
          args: [ensName, account.address, BigInt(durationInSeconds), secretBytes32],
          value: BigInt(1000000000000000), // Registration cost (adjust as needed)
        });
        
        // Wait for transaction to be mined
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });
        
        if (receipt.status !== "success") {
          throw new Error("ENS registration transaction failed");
        }
        
        // Set up resolver for the ENS name
        const nameNode = namehash(`${ensName}.eth`);
        
        // Set resolver for the node
        const setResolverTx = await walletClient.writeContract({
          address: ENS_REGISTRY_ADDRESS,
          abi: ENS_REGISTRY_ABI,
          functionName: "setResolver",
          args: [nameNode, PUBLIC_RESOLVER_ADDRESS],
        });
        
        await publicClient.waitForTransactionReceipt({
          hash: setResolverTx,
        });
        
        // Set address record in the resolver
        const setAddrTx = await walletClient.writeContract({
          address: PUBLIC_RESOLVER_ADDRESS,
          abi: PUBLIC_RESOLVER_ABI,
          functionName: "setAddr",
          args: [nameNode, addressToPointTo],
        });
        
        await publicClient.waitForTransactionReceipt({
          hash: setAddrTx,
        });
        
        return `Successfully registered '${ensName}.eth' for ${duration_years} year(s) and pointed it to address ${addressToPointTo}. Transaction hash: ${hash}`;
      } catch (error) {
        if (error instanceof Error) {
          return `Error registering ENS name: ${error.message}`;
        }
        return `Unknown error registering ENS name`;
      }
    },
  };
}