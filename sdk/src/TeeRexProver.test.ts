import { getSchnorrAccount } from "@aztec/accounts/schnorr";
import { getInitialTestAccountsManagers } from "@aztec/accounts/testing";
import { createAztecNodeClient, Fq, Fr } from "@aztec/aztec.js";
import { createPXEService, getPXEServiceConfig } from "@aztec/pxe/client/lazy";
import { WASMSimulator } from "@aztec/simulator/client";
import { assert } from "ts-essentials";
import { describe, test } from "vitest";
import { ProvingMode, TeeRexProver } from "./TeeRexProver.js";

describe(TeeRexProver, () => {
  test("flow", async () => {
    const node = createAztecNodeClient("http://localhost:8080");

    const prover = new TeeRexProver(
      "http://localhost:4000",
      new WASMSimulator(),
      navigator.hardwareConcurrency,
    );
    prover.setProvingMode(ProvingMode.remote);

    const pxe = await createPXEService(node, getPXEServiceConfig(), {
      prover, // <-- inject the prover here
      loggers: {},
    });

    const sandboxAccount = await (
      await getInitialTestAccountsManagers(pxe)
    )[0]?.register();
    assert(sandboxAccount, "No sandbox account found");
    const account = await getSchnorrAccount(pxe, Fr.random(), Fq.random());
    await account.waitSetup({ deployWallet: sandboxAccount }); // this requests a proof from the server
  });
});
