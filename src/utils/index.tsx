import { PAYER_KEYPAIR_PATH } from "../config/index";
import os from "os";
import fs from "mz/fs";
import path from "path";
import yaml from "yaml";
import { Keypair } from "@solana/web3.js";

import { PRIVATE_KEY_DEFAULT_ACCOUNT } from "../constants/defaultWallet";
import bs58 from "bs58";

export async function createKeypairFromFile(
  filePath: string
): Promise<Keypair> {
  const secretKeyString = await fs.readFile("./test.json", {
    encoding: "utf8",
  });

  console.log("secretKeyString", secretKeyString);
  // const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  const decoded = bs58.decode(PRIVATE_KEY_DEFAULT_ACCOUNT);
  return Keypair.fromSecretKey(decoded);
}

/**
 * @private
 */
// async function getConfig(): Promise<any> {
//   // Path to Solana CLI config file
//   console.log('os.homedir()',os.homedir())
//   const CONFIG_FILE_PATH = path.resolve(
//     os.homedir(),
//     "solana-wallet/keypair.json",
//   );
//   console.log('CONFIG_FILE_PATH',CONFIG_FILE_PATH)
//   const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: "utf8" });

//   console.log('configYml',configYml)
//   return yaml.parse(configYml);
// }

export async function getPayer(): Promise<Keypair> {
  try {
    console.log("PAYER_KEYPAIR_PATH", PAYER_KEYPAIR_PATH);
    if (!PAYER_KEYPAIR_PATH) throw new Error("Missing keypair path");
    const decoded = bs58.decode(process.env.REACT_APP_PAYER_GREETING_ACCOUNT || "");
    return await Keypair.fromSecretKey(decoded);
  } catch (err) {
    console.error(
      "Failed to create keypair from CLI config file, falling back to new random keypair",
      err
    );
    return Keypair.generate();
  }
}
