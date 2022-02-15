import path from "path";

/**
 * Path to program files
 */
// const __dirname = "/User/kiet.huynh/Self-Study/Blockchain/solana-wallet-apdater";

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

console.log("PROGRAM_PATH,PROGRAM_PATH", PROGRAM_PATH);

export const PROGRAM_KEYPAIR_PATH = path.join(
  PROGRAM_PATH,
  "helloworld-keypair.json"
);

export const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, "helloworld.so");

export const PAYER_PATH = path.resolve(__dirname, "solana-wallet");

export const PAYER_KEYPAIR_PATH = path.join(PAYER_PATH, "keypair.json");
