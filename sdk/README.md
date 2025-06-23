# TEE Rex

## Installation

```sh
npm add @nemi-fi/tee-rex
```

## Usage

### Plug into your PXE

```ts
import { createAztecNodeClient } from "@aztec/aztec.js";
import { createPXEService, getPXEServiceConfig } from "@aztec/pxe/client/lazy";
import { WASMSimulator } from "@aztec/simulator/client";

// add this
import { TeeRexProver } from "@nemi-fi/tee-rex";

const TEE_REX_API =
  "https://b1b6df8133030bdea818ed744b7355d69abab2b8-80.dstack-prod5.phala.network";
const node = createAztecNodeClient("<aztec-node-rpc-url>");
const config = getPXEServiceConfig();
const prover = new TeeRexProver(
  TEE_REX_API,
  new WASMSimulator(),
  16 /* threads for local proving fallback */,
);
const pxe = await createPXEService(node, config, {
  // specify the prover when creating a PXE
  prover,
});

// use the PXE as usual
```

### Switch proving modes

```ts
// use a remote TEE
prover.setProvingMode(ProvingMode.remote);
// or use a local prover
prover.setProvingMode(ProvingMode.local);
```
