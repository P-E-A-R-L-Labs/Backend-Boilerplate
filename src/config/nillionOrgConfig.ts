import dotenv from "dotenv";
dotenv.config();

export const secretVaultOrgConfig = {
  orgCredentials: {
    secretKey: process.env.NEXT_PUBLIC_SECRETVAULT_PRIVATE_KEY || "",
    orgDid: process.env.NEXT_PUBLIC_SECRETVAULT_DID || "",
  },
  nodes: [
    {
      url: process.env.NEXT_PUBLIC_NODE_ONE_URL || "",
      did: process.env.NEXT_PUBLIC_NODE_ONE_DID || "",
    },
    {
      url: process.env.NEXT_PUBLIC_NODE_TWO_URL || "",
      did: process.env.NEXT_PUBLIC_NODE_TWO_DID || "",
    },
    {
      url: process.env.NEXT_PUBLIC_NODE_THREE_URL || "",
      did: process.env.NEXT_PUBLIC_NODE_THREE_DID || "",
    },
  ],
};
