import dotenv from "dotenv";
dotenv.config();

import { SecretVaultWrapper } from 'secretvaults';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { v4 as uuidv4 } from 'uuid';
import { nillionOrgConfig } from "../nillionOrgConfig.ts";

const SCHEMA_ID = process.env.SECRETVAULT_SCHEMA_ID; // Use env variable or replace with actual schema ID

const pearlUserData = [
    {
      user_did: 'did:example:123',
      private_key: { '%share': 'iusfbiuewuvbewirvbwreiuvb' },
      email: 'example@email.com',
      chat_id: [{ id: 'f4d23' }],
      created_at: new Date().toISOString(),
    }
  ];

export async function interactWithSecretVault() {
  try {
    const collection = new SecretVaultWrapper(
      nillionOrgConfig.nodes,
      nillionOrgConfig.orgCredentials,
      SCHEMA_ID
    );
    await collection.init();

    // Write data to nodes
    const dataWritten = await collection.writeToNodes(pearlUserData);
    console.log('dataWritten', dataWritten);

    // Extract new IDs from the written data
    const newIds = [
      ...new Set(dataWritten.map((item) => item.data.created).flat()),
    ];
    console.log('created ids:', newIds);

    // Read data from nodes
    const dataRead = await collection.readFromNodes({});
    console.log('📚 total records:', dataRead.length);
    console.log(
      '📚 Read new records:',
      dataRead.slice(0, pearlUserData.length)
    );

    return { success: true,  dataRead };
  } catch (error) {
    console.error('❌ Failed to use SecretVaultWrapper:', (error as Error).message);
    return { success: false, error: (error as Error).message };
  }
}

interactWithSecretVault();