import dotenv from "dotenv";
dotenv.config();

export const nillionOrgConfig = {
  orgCredentials: {
    secretKey: process.env.SECRETVAULT_PRIVATE_KEY || "",
    orgDid: process.env.SECRETVAULT_DID || "",
  },
  nodes: [
    {
      url: process.env.NODE_ONE_URL || "",
      did: process.env.NODE_ONE_DID || "",
    },
    {
      url: process.env.NODE_TWO_URL || "",
      did: process.env.NODE_TWO_DID || "",
    },
    {
      url: process.env.NODE_THREE_URL || "",
      did: process.env.NODE_THREE_DID || "",
    },
  ],
};
