import {
  PublicKey,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import React from "react";

const getBalance = async (_pubKey: PublicKey) => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const lamports = await connection.getBalance(_pubKey);

  const sol = lamports / LAMPORTS_PER_SOL;
  return sol;
};

const getTokenBalance = async (_pubKey: PublicKey) => {
  const connection = new Connection(clusterApiUrl("devnet"));
  const mintTokenAddress = new PublicKey(
    process.env.REACT_APP_XMT_TOKEN_ADDRESS || ""
  );
  let xmtTokens = await connection.getParsedTokenAccountsByOwner(_pubKey, {
    mint: mintTokenAddress,
  });
  if(xmtTokens?.value.length > 0){
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

export { getBalance, generateNewAccount, maskedAddress, getTokenBalance };
