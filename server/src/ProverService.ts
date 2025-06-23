import { BBNativePrivateKernelProver } from "@aztec/bb-prover/client/native";
import type { PrivateExecutionStep } from "@aztec/stdlib/kernel";
import { execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { lazyValue } from "./utils.js";

export class ProverService {
  constructor() {
    setTimeout(() => this.#prover(), 1); // eagerly load the prover
  }

  #prover = lazyValue(async () => {
    const bbBinaryPath = path.join(os.homedir(), ".bb", "bb");

    const version = execSync(`${bbBinaryPath} --version`)
      .toString("utf-8")
      .trim();
    console.log("bb version", version);
    const expectedVersion = "0.87.2";
    // TODO: change to exact match after this is fixed: https://github.com/AztecProtocol/aztec-packages/issues/14932
    if (!version.includes(expectedVersion)) {
      throw new Error(`bb version mismatch: ${version} !== ${expectedVersion}`);
    }

    const nativeProver = await BBNativePrivateKernelProver.new(
      {
        bbBinaryPath,
        bbWorkingDirectory: path.join(os.tmpdir(), "bb-working-directory"),
        bbSkipCleanup: false,
      },
      null as any, // we don't need a simulator
    );
    return nativeProver;
  });

  async createClientIvcProof(executionSteps: PrivateExecutionStep[]) {
    const prover = await this.#prover();
    return await prover.createClientIvcProof(executionSteps);
  }
}
