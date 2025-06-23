import { aztec } from "@nemi-fi/vite-plugin-aztec";
import ms from "ms";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [aztec()],
  optimizeDeps: {
    exclude: ["@aztec/noir-noirc_abi", "@aztec/noir-acvm_js"],
  },
  test: {
    testTimeout: ms("10 min"),
    browser: {
      enabled: true,
      provider: "preview",
      instances: [{ browser: "chrome" }],
    },
  },
});
