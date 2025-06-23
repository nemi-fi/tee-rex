import { mapSchema, schemas } from "@aztec/stdlib/schemas";
import cors from "cors";
import express from "express";
import ms from "ms";
import { Base64, Bytes } from "ox";
import { z } from "zod";
import { EncryptionService } from "./EncryptionService.js";
import { ProverService } from "./ProverService.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" })); // TODO: change to 1mb?

const lib = {
  prover: new ProverService(),
  encryption: new EncryptionService(),
};

app.post("/prove", async (req, res) => {
  req.socket.setTimeout(ms("5 min"));

  const encryptedData = Base64.toBytes(req.body.data);
  const decryptedData: unknown = JSON.parse(
    Bytes.toString(
      await lib.encryption.decrypt({
        data: encryptedData,
      }),
    ),
  );

  const data = z
    .object({
      executionSteps: z.array(
        z.object({
          functionName: z.string(),
          witness: mapSchema(z.number(), z.string()),
          bytecode: schemas.Buffer,
          vk: schemas.Buffer,
          timings: z.object({
            witgen: z.number(),
            gateCount: z.number().optional(),
          }),
        }),
      ),
    })
    .parse(decryptedData);
  const proof = await lib.prover.createClientIvcProof(data.executionSteps);
  res.json({
    proof: Base64.fromBytes(proof.toBuffer()), // proof will be publicly posted on chain, so no need to encrypt
  });
});

app.get("/encryption-public-key", async (req, res) => {
  const publicKey = await lib.encryption.getEncryptionPublicKey();
  res.json({ publicKey });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Remote Prover Server is running on port ${port}`);
});
