// secretvaults.d.ts
declare module "secretvaults" {
  export class SecretVaultWrapper {
    constructor(
      nodes: NodeConfig[],
      orgCredentials: OrgCredentials,
      schemaId?: string
    );
    init(): Promise<void>;
    createSchema(schema: unknown, name: string): Promise<unknown>;
    writeToNodes(data: unknown[]): Promise<WriteResponse[]>;
    readFromNodes(query: Record<string, unknown>): Promise<ReadResponse[]>;
  }

  interface NodeConfig {
    url: string;
    did: string;
  }

  interface OrgCredentials {
    secretKey: string;
    orgDid: string;
  }

  interface WriteResponse {
    data: {
      created: string[];
    };
  }

  interface ReadResponse {
    // Define the structure of the data returned by readFromNodes
    [key: string]: unknown;
  }
}
