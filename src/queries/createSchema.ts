import { SecretVaultWapper } from "secretvaults";
import { secretVaultOrgConfig } from "../config/nillionOrgConfig";
import schema from "../schema/secretvaultSchema.json" assert { type: "json" };

export async function secretvaultSchema() {
  try {
    const org = new SecretVaultWapper(
      secretVaultOrgConfig.nodes,
      secretVaultOrgConfig.orgCredentials
    );
    await org.init();
  } catch (error) {
    console.error(
      "❌ Failed to user SecretVaultWrapper:",
      (error as Error).message
    );
    process.exit(1);
  }
}
