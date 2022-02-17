import {
  PublicKey,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import React from "react";
import { connection, PROGRAM_KEY } from "../utils";
import md5 from "md5";

const getBalance = async (_pubKey: PublicKey) => {
  const lamports = await connection.getBalance(_pubKey);

  const sol = lamports / LAMPORTS_PER_SOL;
  return sol;
};
const getTokenBalance = async (_pubKey: PublicKey) => {
  const mintTokenAddress = new PublicKey(
    process.env.REACT_APP_XMT_TOKEN_ADDRESS || ""
  );
  let xmtTokens = await connection.getParsedTokenAccountsByOwner(_pubKey, {
    mint: mintTokenAddress,
  });
  if (xmtTokens?.value.length > 0) {
    return xmtTokens?.value[0].account.data.parsed.info.tokenAmount.uiAmount;
  }
  return 0;
};

const generateNewAccount = async () => {
  const acc = await Keypair.generate();
  return acc;
};

const maskedAddress = (address: string) => {
  if (!address) return;
  return `${address.slice(0, 6)}...${address.slice(address.length - 6)}`;
};

const genUserKey = (walletKey: PublicKey) => {
  const userAccount = Keypair.fromSeed(
    new TextEncoder().encode(
      `${PROGRAM_KEY.toString().slice(0, 15)}__${walletKey
        .toString()
        .slice(0, 15)}`
    )
  );

  return userAccount;
};

export const getAvatarUrl = (key: string) => {
  return `https://gravatar.com/avatar/${md5(key)}?s=400&d=robohash&r=x`;
};

export {
  getBalance,
  generateNewAccount,
  maskedAddress,
  getTokenBalance,
  genUserKey,
};
