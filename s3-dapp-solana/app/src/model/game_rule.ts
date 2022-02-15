import { PublicKey } from "@solana/web3.js";
import * as borsh from "borsh";
import * as BufferLayout from "buffer-layout";

const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};

export const GAME_RULE_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("is_initialized"),
  publicKey("initializer_pubkey"),
  publicKey("initializer_mortgage_token_account_pubkey"),
  publicKey("initializer_token_to_receive_account_pubkey"),
]);

export interface GameRuleLayout {
  is_initialized: number;
  initializer_pubkey: Uint8Array;
  initializer_mortgage_token_account_pubkey: Uint8Array;
  initializer_token_to_receive_account_pubkey: Uint8Array;
}

// export class GameRuleAccount {
//   is_initialized!: boolean;
//   initializer_pubkey!: PublicKey;
//   initializer_mortgage_token_account_pubkey!: PublicKey;
//   initializer_token_to_receive_account_pubkey!: PublicKey;

//   constructor(fields: {
//     is_initialized: boolean;
//     initializer_pubkey: PublicKey;
//     initializer_mortgage_token_account_pubkey: PublicKey;
//     initializer_token_to_receive_account_pubkey: PublicKey;
//   }) {
//     if (fields) {
//       this.is_initialized = fields.is_initialized;
//       this.initializer_pubkey = fields.initializer_pubkey;
//       this.initializer_mortgage_token_account_pubkey =
//         fields.initializer_mortgage_token_account_pubkey;
//       this.initializer_token_to_receive_account_pubkey =
//         fields.initializer_token_to_receive_account_pubkey;
//     }
//   }
// }

// export const GameRuleSchema = new Map([
//   [
//     GameRuleAccount,
//     {
//       kind: "struct",
//       fields: [
//         ["is_initialized", "u8"],
//         ["initializer_pubkey", "Pubkey"],
//         ["initializer_mortgage_token_account_pubkey", "Pubkey"],
//         ["initializer_token_to_receive_account_pubkey", "Pubkey"],
//       ],
//     },
//   ],
// ]);

// export const GAME_RULE_SIZE = borsh.serialize(
//   GameRuleSchema,
//   new GameRuleAccount()
// ).length;
