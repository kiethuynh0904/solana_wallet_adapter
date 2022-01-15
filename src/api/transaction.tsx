import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import fs from "mz/fs";
import * as borsh from "borsh";
import BN from "bn.js";

import { AccountAPI } from "./index";

import { toast } from "react-toastify";
import NotificationToastify from "../components/NotificationToastify";
import { defaultToastOptions } from "../constants/toastifyOptions";
import { GREETING_SIZE, GreetingSchema, GreetingAccount } from "../model";
import { createKeypairFromFile, getPayer } from "./../utils";
import { PROGRAM_KEYPAIR_PATH, PROGRAM_SO_PATH } from "./../config";
import { Alert } from "@mui/material";
import { ReactElement } from "react";

let programId: PublicKey;

let connection: Connection;

let greetedPubkey: PublicKey;

let payer: Keypair;

export async function establishConnection(): Promise<void> {
  connection = new Connection(clusterApiUrl("devnet"));
  const version = await connection.getVersion();
  console.log("Connection to cluster established:", version);
}

export async function establishPayer(): Promise<void> {
  let fees = 0;
  if (!payer) {
    const { feeCalculator } = await connection.getRecentBlockhash();

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    payer = await getPayer();

    let lamports = await connection.getBalance(payer.publicKey);

    console.log(
      "Using account",
      payer.publicKey.toBase58(),
      "containing",
      lamports / LAMPORTS_PER_SOL,
      "SOL to pay for fees"
    );
  }
}

export async function checkProgram(): Promise<void> {
  // Read program id from keypair file
  // try {
  //   const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
  //   console.log('programKeypair',programKeypair)
  programId = new PublicKey("79zQmhDa9ZR4E5gtKrLZnuHyVcXwPBkgGz4yE7fYQrZ3");
  // } catch (err) {
  //   const errMsg = (err as Error).message;
  //   throw new Error(
  //     `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``
  //   );
  // }

  console.log("programId", programId);
  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        "Program needs to be deployed with `solana program deploy dist/program/helloworld.so`"
      );
    } else {
      throw new Error("Program needs to be built and deployed");
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  console.log(`Using program ${programId.toBase58()}`);

  // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
  const GREETING_SEED = "hello";
  greetedPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    GREETING_SEED,
    programId
  );

  // Check if the greeting account has already been created
  const greetedAccount = await connection.getAccountInfo(greetedPubkey);
  if (greetedAccount === null) {
    console.log(
      "Creating account",
      greetedPubkey.toBase58(),
      "to say hello to"
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
      GREETING_SIZE
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: payer.publicKey,
        basePubkey: payer.publicKey,
        seed: GREETING_SEED,
        newAccountPubkey: greetedPubkey,
        lamports,
        space: GREETING_SIZE,
        programId,
      })
    );
    await sendAndConfirmTransaction(connection, transaction, [payer]);
  }
}

/**
 * Report the number of times the greeted account has been said hello to
 */
export async function reportGreetings():Promise<any> {
  const accountInfo = await connection.getAccountInfo(greetedPubkey);
  if (accountInfo === null) {
    throw "Error: cannot find the greeted account";
  }
  const greeting = borsh.deserialize(
    GreetingSchema,
    GreetingAccount,
    accountInfo.data
  );
  console.log(
    // greetedPubkey.toBase58(),
    "S3 program has been greeted",
    greeting.counter,
    "time(s)"
  );
  console.log("the highest transaction of program is: ",greeting.highest_trans / LAMPORTS_PER_SOL)
}

export const withdrawToWallet = async (toPubkey: PublicKey, amount: number) => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const defaultAccount = AccountAPI.getDefaultAccount();

  console.log("buffer here", Buffer.from(new BN(amount * LAMPORTS_PER_SOL).toArray("le", 8)));
  // greeting program instruction
  const instruction = new TransactionInstruction({
    keys: [{ pubkey: greetedPubkey, isSigner: false, isWritable: true }],
    programId,
    data:  Buffer.from(new BN(amount * LAMPORTS_PER_SOL).toArray("le", 8)), // All instructions are hellos
  });

  let signature: TransactionSignature = "";

  try {
    const transaction = new Transaction().add(
      instruction,
      SystemProgram.transfer({
        fromPubkey: defaultAccount.publicKey,
        toPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    signature = await connection.sendTransaction(transaction, [defaultAccount]);
    toast.info(
      <NotificationToastify
        signature={signature}
        message="Transaction sent:"
      />,
      defaultToastOptions
    );
    await connection.confirmTransaction(signature, "processed");
    toast.success(
      <NotificationToastify
        signature={signature}
        message="Transaction successful!"
      />,
      defaultToastOptions
    );
    setTimeout(() => {
      reportGreetings();
    }, 2000);
  } catch (error: any) {
    toast.error(
      <NotificationToastify
        signature={signature}
        message={`Transaction failed! ${error?.message}`}
      />,
      defaultToastOptions
    );
  }
};

export const withdrawTokenToWallet = async (
  toPubkey: PublicKey,
  amount: number
) => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const defaultAccount = AccountAPI.getDefaultAccount();
  const mintTokenAddress = new PublicKey(
    process.env.REACT_APP_XMT_TOKEN_ADDRESS || ""
  );

  var myToken = new splToken.Token(
    connection,
    mintTokenAddress,
    splToken.TOKEN_PROGRAM_ID,
    defaultAccount
  );

  var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
    defaultAccount.publicKey
  );
  var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(toPubkey);

  let signature: TransactionSignature = "";
  try {
    const transaction = new Transaction().add(
      splToken.Token.createTransferInstruction(
        splToken.TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        defaultAccount.publicKey,
        [],
        amount * LAMPORTS_PER_SOL
      )
    );
    signature = await connection.sendTransaction(transaction, [defaultAccount]);
    toast.info(
      <NotificationToastify
        signature={signature}
        message="Transaction sent:"
      />,
      defaultToastOptions
    );
    await connection.confirmTransaction(signature, "processed");

    //report state greeting count from program

    toast.success(
      <NotificationToastify
        signature={signature}
        message="Transaction successful!"
      />,
      defaultToastOptions
    );
  } catch (error: any) {
    toast.error(
      <NotificationToastify
        signature={signature}
        message={`Transaction failed! ${error?.message}`}
      />,
      defaultToastOptions
    );
  }
};

export const depositFromWallet = async (
  fromPubkey: PublicKey,
  amount: number,
  connection: Connection,
  sendTransaction: any
) => {
  const defaultAccount = AccountAPI.getDefaultAccount();

  let signature: TransactionSignature = "";
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: defaultAccount.publicKey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    signature = await sendTransaction(transaction, connection);
    toast.info(
      <NotificationToastify
        signature={signature}
        message="Transaction sent:"
      />,
      defaultToastOptions
    );
    const result = await connection.confirmTransaction(signature, "processed");
    toast.success(
      <NotificationToastify
        signature={signature}
        message="Transaction successful!"
      />,
      defaultToastOptions
    );
    return result;
  } catch (error: any) {
    toast.error(
      <NotificationToastify
        signature={signature}
        message={`Transaction failed! ${error?.message}`}
      />,
      defaultToastOptions
    );
  }
};
