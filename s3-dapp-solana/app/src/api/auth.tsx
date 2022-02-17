import * as anchor from "@project-serum/anchor";
import { Wallet as AnchorWallet } from "@project-serum/anchor/dist/cjs/provider";

import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Dispatch } from "redux";
import { genUserKey, getAvatarUrl } from "../helper";
import { saveUser } from "../slices/authSlice";
import { connection, getProgram, PROGRAM_KEY } from "../utils";

export interface UserData {
  name: string;
  avatar: string;
}

export interface User extends UserData {
  id: string;
}

export const signup = async (
  anchorWallet: AnchorWallet,
  walletKey: PublicKey,
  name: string
) => {
  const userAccount = genUserKey(walletKey);
  const provider = new anchor.Provider(connection, anchorWallet, {});

  const program = getProgram(provider);

  const avatar = getAvatarUrl(name);

  await program.rpc.signupUser(name, avatar, {
    accounts: {
      authority: walletKey,
      userAccount: userAccount.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [userAccount],
  });
};

export const updateUser = async (
  anchorWallet: AnchorWallet,
  walletKey: PublicKey,
  name: string
) => {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  const avatar = getAvatarUrl(name);
  const userAccount = genUserKey(walletKey);
  
  try {
    const tx = await program.rpc.updateUser(name, avatar, {
      accounts: {
        authority: walletKey,
        userAccount: userAccount.publicKey,
        systemProgram: SystemProgram.programId,
      },
    });

    return tx;
  } catch {}
};

export const fetchUser = async (anchorWallet: AnchorWallet): Promise<User> => {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  const userAccount = genUserKey(provider.wallet.publicKey);
  const _user = await program.account.userState.fetch(userAccount.publicKey);

  const user = {
    id: userAccount.publicKey.toString(),
    name: _user.name,
    avatar: _user.avatar,
  };
  console.log("_user", _user.authority.toString());
  return user;
};
