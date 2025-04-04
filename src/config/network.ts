import type { Chain } from "viem/chains";
import { monadTestnet } from "viem/chains";
import { http } from "viem";

export const monadConfig = {
  chain: {
    ...monadTestnet,
    rpcUrls: {
      default: {
        http: ["https://testnet-rpc.monad.xyz"],
      },
    },
  },
  transport: http(),
};
