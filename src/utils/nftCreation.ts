import { Connection } from "@metaplex/js";
import { BinaryReader, BinaryWriter, serialize } from "borsh";
import base58 from "bs58";
import * as splToken from "@solana/spl-token";
import crypto from "crypto";
import BN from "bn.js";

import { findProgramAddress, toPublicKey } from "../utils/index";
import {
  METADATA_SCHEMA,
  createMasterEdition,
  Attribute,
  Creator,
  Data,
  createMetadata,
  updateMetadata,
  StringPublicKey,
} from "../model/metadata";

import {
  Keypair,
  PublicKey,
  Transaction,
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Commitment,
  TransactionSignature,
  SignatureStatus,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Dispatch, SetStateAction } from "react";

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

const MEMO_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const programIds = {
  token: TOKEN_PROGRAM_ID,
  associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  metadata: METADATA_PROGRAM_ID,
  memo: MEMO_ID,
};

export type ENDPOINT_NAME =
  | "mainnet-beta"
  | "testnet"
  | "devnet"
  | "localnet"
  | "lending";

const sleepUtil = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
export const AR_SOL_HOLDER_ID = new PublicKey(
  "HvwC9QSAzvGXhhVrgPmauVwFWcYZhne3hVot9EbHuFTm"
);

export const DEFAULT_TIMEOUT = 15000;
export const RESERVED_TXN_MANIFEST = "manifest.json";

/**
 * Utility to add functionality to BinaryReader
 */
export const extendBorsh = () => {
  (BinaryReader.prototype as any).readPubkey = function () {
    const reader = this as unknown as BinaryReader;
    const array = reader.readFixedArray(32);
    return new PublicKey(array);
  };

  (BinaryWriter.prototype as any).writePubkey = function (value: PublicKey) {
    const writer = this;
    writer.writeFixedArray(value.toBuffer());
  };

  (BinaryReader.prototype as any).readPubkeyAsString = function () {
    const reader = this;
    const array = reader.readFixedArray(32);
    return base58.encode(array);
  };

  (BinaryWriter.prototype as any).writePubkeyAsString = function (
    value: StringPublicKey
  ) {
    const writer = this;
    writer.writeFixedArray(base58.decode(value));
  };
};
extendBorsh();

export const mintNFT = async function (
  connection: Connection,
  wallet: WalletContextState | undefined,
  env: ENDPOINT_NAME,
  files: File[],
  metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string | undefined;
    animation_url: string | undefined;
    attributes: Attribute[] | undefined;
    external_url: string;
    properties: any;
    creators: Creator[] | null;
    sellerFeeBasisPoints: number;
  },
  progressCallback: Dispatch<SetStateAction<number>>,
  maxSupply: number = 1
) {
  if (!wallet?.publicKey) return;

  const metadataContent = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    attributes: metadata.attributes,
    seller_fee_basis_points: metadata.sellerFeeBasisPoints,
    image: metadata.image,
    animation_url: metadata.animation_url,
    external_url: metadata.external_url,
    properties: {
      ...metadata.properties,
      creators: metadata.creators?.map((creator: any) => {
        return {
          address: creator.address,
          share: creator.share,
        };
      }),
    },
  };
  const realFiles = [
    ...files,
    new File([JSON.stringify(metadataContent)], "metadata.json"),
  ];

  const { instructions: pushInstructions, signers: pushSigners } =
    await prepPayForFilesTxn(wallet, realFiles, metadata);
  progressCallback(1);
  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    splToken.MintLayout.span
  );

  const payerPublicKey = wallet.publicKey.toBase58();
  const instructions: TransactionInstruction[] = [...pushInstructions];
  const signers: Keypair[] = [...pushSigners];

  // This is only temporarily owned by wallet - transferred to program by createMasterEdition below
  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    // Some weird bug with Phantom where its public key doesn't mesh with data encode well
    new PublicKey(payerPublicKey),
    new PublicKey(payerPublicKey),
    signers
  ).toBase58();

  const recipientKey = (
    await findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        programIds.token.toBuffer(),
        new PublicKey(mintKey).toBuffer(),
      ],
      programIds.associatedToken
    )
  )[0];

  createAssociatedTokenAccountInstruction(
    instructions,
    new PublicKey(recipientKey),
    wallet.publicKey,
    wallet.publicKey,
    new PublicKey(mintKey)
  );
  const classData = new Data({
    symbol: metadata.symbol,
    name: metadata.name,
    uri: " ".repeat(64), // size of url for arweave
    sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
    creators: metadata.creators,
  });
  const metadataAccount = await createMetadata(
    classData,
    payerPublicKey,
    mintKey,
    payerPublicKey,
    instructions,
    wallet.publicKey.toBase58()
  );
  progressCallback(2);

  const { txid } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers
  );
  progressCallback(3);
  try {
    // return
    await connection.confirmTransaction(txid, "max");
    progressCallback(4);
  } catch {
    // ignore
  }

  await connection.getParsedConfirmedTransaction(txid, "confirmed");
  progressCallback(5);
  const data = new FormData();
  //missing here

  const tags = realFiles.reduce(
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [{ name: "mint", value: mintKey }];
      return acc;
    },
    {}
  );
  data.append("tags", JSON.stringify(tags));
  data.append("transaction", txid);
  realFiles.map((f) => data.append("file[]", f));

  const result = await (
    await fetch(
      "https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2",
      {
        method: "POST",
        body: data,
      }
    )
  ).json();

  const metadataFile = result.messages?.find(
    (m: any) => m.filename === RESERVED_TXN_MANIFEST
  );
  const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;

  if (metadataFile?.transactionId) {
    const updateInstructions: any = [];
    const updateSigners: any = [];

    await updateMetadata(
      new Data({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: arweaveLink,
        creators: metadata.creators,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      }),
      undefined,
      undefined,
      mintKey,
      payerPublicKey,
      updateInstructions,
      metadataAccount
    );
    progressCallback(6);

    updateInstructions.push(
      splToken.Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        new PublicKey(mintKey),
        new PublicKey(recipientKey),
        new PublicKey(payerPublicKey),
        [],
        1
      )
    );
    progressCallback(7);

    await createMasterEdition(
      new BN(maxSupply),
      mintKey,
      payerPublicKey,
      payerPublicKey,
      payerPublicKey,
      updateInstructions
    );

    progressCallback(8);
    await sendTransactionWithRetry(
      connection,
      wallet,
      updateInstructions,
      updateSigners
    );
  }
  return { metadataAccount, arweaveLink, mintKey, account: recipientKey };
};

const prepPayForFilesTxn = async (
  wallet: WalletContextState,
  files: File[],
  metadata: any
) => {
  const memo = programIds.memo;
  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];
  if (wallet.publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: 100000000,
      })
    );
  //Already uploading files on IPFS, hence no files to be transacted here
  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash("sha256");
    hashSum.update(await files[i].text());
    const hex = hashSum.digest("hex");
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
        data: Buffer.from(hex),
      })
    );
  }
  return {
    instructions,
    signers,
  };
};

function createMint(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  mintRentExempt: number,
  decimals: number,
  owner: PublicKey,
  freezeAuthority: PublicKey,
  signers: Keypair[]
) {
  const account = createUninitializedMint(
    instructions,
    payer,
    mintRentExempt,
    signers
  );
  instructions.push(
    splToken.Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      account,
      decimals,
      owner,
      freezeAuthority
    )
  );
  return account;
}

function createUninitializedMint(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  amount: number,
  signers: Keypair[]
) {
  const account = Keypair.generate();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: splToken.MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  signers.push(account);
  return account.publicKey;
}

function createAssociatedTokenAccountInstruction(
  instructions: TransactionInstruction[],
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
) {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: programIds.token,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: programIds.associatedToken,
      data: Buffer.from([]),
    })
  );
}

const sendTransactionWithRetry = async (
  connection: Connection,
  wallet: any,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  commitment: Commitment = "singleGossip",
  includesFeePayer: Boolean = false,
  block?: any,
  beforeSend?: any
) => {
  let transaction = new Transaction();
  instructions.forEach((instruction) => transaction.add(instruction));
  transaction.recentBlockhash = (
    block || (await connection.getRecentBlockhash(commitment))
  ).blockhash;
  if (includesFeePayer) {
    transaction.setSigners(...signers.map((s) => s.publicKey));
  } else {
    transaction.setSigners(
      // fee payed by the wallet owner
      wallet.publicKey,
      ...signers.map((s) => s.publicKey)
    );
  }
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  if (!includesFeePayer) {
    transaction = await wallet.signTransaction(transaction);
  }
  if (beforeSend) {
    beforeSend();
  }
  const { txid, slot } = await sendSignedTransaction({
    connection,
    signedTransaction: transaction,
  });
  return { txid, slot };
};
const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

async function sendSignedTransaction({
  signedTransaction,
  connection,
  timeout = DEFAULT_TIMEOUT,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
}): Promise<{ txid: string; slot: number }> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();
  let slot = 0;
  const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
  });
  console.log("Started awaiting confirmation for", txid);
  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleepUtil(500);
    }
  })();
  try {
    const confirmation = await awaitTransactionSignatureConfirmation(
      txid,
      timeout,
      connection,
      "recent",
      true
    );
    if (!confirmation)
      throw new Error("Timed out awaiting confirmation on transaction");
    if (confirmation.err) {
      console.error(confirmation.err);
      throw new Error("Transaction failed: Custom instruction error");
    }
    slot = confirmation?.slot || 0;
  } catch (err) {
  } finally {
    done = true;
  }
  console.log("Latency", txid, getUnixTs() - startTime);
  return { txid, slot };
}

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  commitment: Commitment = "recent",
  queryStatus = false
): Promise<SignatureStatus | null | void> {
  let done = false;
  let status: SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.log("Rejecting for timeout...");
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result: any, context: any) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.log("Rejected via websocket", result.err);
            reject(status);
          } else {
            console.log("Resolved via websocket", result);
            resolve(status);
          }
        },
        commitment
      );
    } catch (e) {
      done = true;
      console.error("WS error in setup", txid, e);
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.log("REST null result for", txid, status);
            } else if (status.err) {
              console.log("REST error for", txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.log("REST no confirmations for", txid, status);
            } else {
              console.log("REST confirmation for", txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.log("REST connection error: txid", txid, e);
          }
        }
      })();
      await sleepUtil(1000);
    }
  });
  //@ts-ignore
  if (connection._signatureSubscriptions[subId])
    connection.removeSignatureListener(subId);
  done = true;
  console.log("Returning status", status);
  return status;
}
