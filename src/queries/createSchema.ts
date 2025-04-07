import { SecretVaultWrapper } from "secretvaults";
import { secretVaultOrgConfig } from "../config/nillionOrgConfig";
const schema = require("../schemas/secretvaultSchema.json");

export async function secretvaultSchema() {
  try {
    const org = new SecretVaultWrapper(
      secretVaultOrgConfig.nodes,
      secretVaultOrgConfig.orgCredentials
    );
    await org.init();

    const newSchema = await org.createSchema(schema, "Example Survey");
    console.log("📚 Created new schema:", newSchema);
  } catch (error) {
    console.error(
      "❌ Failed to user SecretVaultWrapper:",
      (error as Error).message
    );
    process.exit(1);
  }
}
