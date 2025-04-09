import { SecretVaultWrapper } from "secretvaults";
import { nillionOrgConfig } from '../nillionOrgConfig.ts';
import schema from "../schemas/secretvaultSchema.json" with { type: "json" };

export async function secretvaultSchema() {
  try {
    const org = new SecretVaultWrapper(
      nillionOrgConfig.nodes,
      nillionOrgConfig.orgCredentials
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

secretvaultSchema();