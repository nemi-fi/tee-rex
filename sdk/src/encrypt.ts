import * as openpgp from "openpgp";

export async function encrypt({
  data,
  encryptionPublicKey,
}: {
  data: Uint8Array;
  encryptionPublicKey: string;
}): Promise<Uint8Array> {
  const message = await openpgp.createMessage({ binary: data });
  const encryptedArmored = await openpgp.encrypt({
    message,
    encryptionKeys: await openpgp.readKey({ armoredKey: encryptionPublicKey }),
  });

  const encrypted = await unarmorToUint8Array(encryptedArmored);
  return encrypted;
}

async function unarmorToUint8Array(armored: string) {
  const unarmored = await openpgp.unarmor(armored);
  const unarmoredData: unknown = unarmored.data;
  if (!(unarmoredData instanceof Uint8Array)) {
    throw new Error("Unarmored data is not a Uint8Array");
  }
  return unarmoredData;
}
