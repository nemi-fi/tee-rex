import { BBWASMLazyPrivateKernelProver } from "@aztec/bb-prover/client/wasm/lazy";
import { jsonStringify } from "@aztec/foundation/json-rpc";
import type { PrivateExecutionStep } from "@aztec/stdlib/kernel";
import { ClientIvcProof } from "@aztec/stdlib/proofs";
import { schemas } from "@aztec/stdlib/schemas";
import ky from "ky";
import ms from "ms";
import { Base64, Bytes } from "ox";
import { UnreachableCaseError, type ValueOf } from "ts-essentials";
import { joinURL } from "ufo";
import { z } from "zod";
import { encrypt } from "./encrypt.js";

export type ProvingMode = ValueOf<typeof ProvingMode>;
export const ProvingMode = {
  local: "local",
  remote: "remote",
} as const;

export class TeeRexProver extends BBWASMLazyPrivateKernelProver {
  // TODO: move switching proving modes to a different class
  #provingMode: ProvingMode = ProvingMode.remote;

  constructor(
    private apiUrl: string,
    ...args: ConstructorParameters<typeof BBWASMLazyPrivateKernelProver>
  ) {
    super(...args);
  }

  setProvingMode(mode: ProvingMode) {
    this.#provingMode = mode;
  }

  async createClientIvcProof(
    executionSteps: PrivateExecutionStep[],
  ): Promise<ClientIvcProof> {
    switch (this.#provingMode) {
      case "local": {
        console.log("using local prover");
        return super.createClientIvcProof(executionSteps);
      }
      case "remote": {
        console.log("using remote prover");
        return this.#remoteCreateClientIvcProof(executionSteps);
      }
      default: {
        throw new UnreachableCaseError(this.#provingMode);
      }
    }
  }

  async #remoteCreateClientIvcProof(
    executionSteps: PrivateExecutionStep[],
  ): Promise<ClientIvcProof> {
    console.log("creating client ivc proof", this.apiUrl);
    const executionsStepsSerialized = executionSteps.map((step) => ({
      functionName: step.functionName,
      witness: JSON.parse(jsonStringify(step.witness)),
      bytecode: Base64.fromBytes(step.bytecode),
      vk: Base64.fromBytes(step.vk),
      timings: step.timings,
    }));
    console.log(
      "payload chars",
      JSON.stringify(executionsStepsSerialized).length,
    );
    const encryptionPublicKey = await this.#fetchEncryptionPublicKey();
    const encryptedData = Base64.fromBytes(
      await encrypt({
        data: Bytes.fromString(
          JSON.stringify({ executionSteps: executionsStepsSerialized }),
        ),
        encryptionPublicKey,
      }),
    ); // TODO(perf): serialize executionSteps -> bytes without intermediate encoding. Needs Aztec to support serialization of the PrivateExecutionStep class.
    const response = await ky
      .post(joinURL(this.apiUrl, "prove"), {
        json: { data: encryptedData },
        timeout: ms("5 min"),
      })
      .json();
    const data = z
      .object({
        proof: schemas.Buffer,
      })
      .parse(response);
    return ClientIvcProof.fromBuffer(data.proof);
  }

  async #fetchEncryptionPublicKey() {
    // TODO(security): verify the integrity of the encryption public key
    const response = await ky
      .get(joinURL(this.apiUrl, "encryption-public-key"))
      .json();
    const data = z
      .object({
        publicKey: z.string(),
      })
      .parse(response);
    return data.publicKey;
  }
}
