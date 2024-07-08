import type { Config } from "jest";

const jestConfig: Config = {
  testEnvironment: "node",
  rootDir: ".",
  extensionsToTreatAsEsm: [".ts"],
  /**
   * For high performance with minimal configuration transform with TS with swc.
   * @see https://github.com/farcasterxyz/hubble/issues/314
   */
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  testTimeout: 60000,
};

export default jestConfig;
