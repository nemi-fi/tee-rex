import * as openpgp from "openpgp";
import { lazyValue } from "./utils.js";

export class EncryptionService {
  readonly #keys = lazyValue(() => generateKeys());

  async decrypt({ data }: { data: Uint8Array }): Promise<Uint8Array> {
    return decrypt({
      data,
      decryptionPrivateKey: (await this.#keys()).privateKey,
    });
  }

  async getEncryptionPublicKey() {
    return (await this.#keys()).publicKey;
  }
}

async function generateKeys() {
  const keys = await openpgp.generateKey({
    // TODO(security): review these parameters
    type: "ecc",
    curve: "nistP256",
    userIDs: [{ name: "TEE-Rex" }],
  });
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}

async function decrypt({
  data,
  decryptionPrivateKey,
}: {
  data: Uint8Array;
  decryptionPrivateKey: string;
}): Promise<Uint8Array> {
  const message = await openpgp.readMessage({ binaryMessage: data });
  const decrypted = await openpgp.decrypt({
    message,
    format: "binary",
    decryptionKeys: await openpgp.readPrivateKey({
      armoredKey: decryptionPrivateKey,
    }),
  });
  const decryptedData: unknown = decrypted.data;
  if (!(decryptedData instanceof Uint8Array)) {
    throw new Error("Decrypted data is not a Uint8Array");
  }
  return decryptedData;
}
