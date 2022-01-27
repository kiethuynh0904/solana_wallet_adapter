import { PAYER_KEYPAIR_PATH } from "../config/index";

import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";

import bs58 from "bs58";
export const NETWORK = clusterApiUrl("devnet");

export const connection = new Connection(NETWORK,"confirmed");

export const mintTokenAddress = new PublicKey(
  process.env.REACT_APP_XMT_TOKEN_ADDRESS || ""
);

export async function getPayer(): Promise<Keypair> {
  try {
    console.log("PAYER_KEYPAIR_PATH", PAYER_KEYPAIR_PATH);
    if (!PAYER_KEYPAIR_PATH) throw new Error("Missing keypair path");
    const decoded = bs58.decode(
      process.env.REACT_APP_PAYER_GREETING_ACCOUNT || ""
    );
    return await Keypair.fromSecretKey(decoded);
  } catch (err) {
    console.error(
      "Failed to create keypair from CLI config file, falling back to new random keypair",
      err
    );
    return Keypair.generate();
  }
}

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey) => {
  if (typeof key !== "string") {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

export const findProgramAddress = async (
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
) => {
  const result = await PublicKey.findProgramAddress(seeds, programId);

  return [result[0].toBase58(), result[1]] as [string, number];
};

export const sleepUtil = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
