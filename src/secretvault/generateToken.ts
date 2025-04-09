import { createJWT, ES256KSigner } from "did-jwt";
import { Buffer } from "buffer";
import * as dotenv from "dotenv";
dotenv.config();

async function createJwtToken(
  secretKey: string | undefined,
  orgDid: string | undefined,
  nodeIds: (string | undefined)[],
  ttl: number
) {
  if (!secretKey) throw new Error("Secret key is required");
  if (!orgDid) throw new Error("Organization DID is required");
  const signer = ES256KSigner(Buffer.from(secretKey, "hex"));
  const tokens = [];

  for (const nodeId of nodeIds) {
    const payload = {
      iss: orgDid,
      aud: nodeId,
      exp: Math.floor(Date.now() / 1000) + ttl,
    };

    const token = await createJWT(payload, { issuer: orgDid, signer });
    tokens.push(token);
    console.log(`Generated JWT for ${nodeId}: ${token}`);
  }

  return tokens;
}

async function generateToken() {
  const secretKey = process.env.SECRETVAULT_PRIVATE_KEY;
  const orgDid = process.env.SECRETVAULT_DID;
  const nodeIds = [
    process.env.NODE_ONE_DID,
    process.env.NODE_TWO_DID,
    process.env.NODE_THREE_DID,
  ];
  const ttl = 3600; // 1 hour

  const token = await createJwtToken(secretKey, orgDid, nodeIds, ttl);
  return token;
}

generateToken();