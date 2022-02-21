import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { connection, getProgram } from "../utils";
import * as anchor from "@project-serum/anchor";
import { Wallet as AnchorWallet } from "@project-serum/anchor/dist/cjs/provider";
import { getUserKey } from "../helper";
import { message } from "antd";

const FEEDBACK_KEY = new PublicKey(
  "DufRVTe36fs8VGo9EKkqaPgknV2hY9R1QUJVZz3cFRRW"
);

export async function initFeedback(
  anchorWallet: AnchorWallet,
  walletKey: PublicKey
) {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  try {
    const feedback: any = await program.account.feedbackState.fetch(
      FEEDBACK_KEY
    );
    console.log("feedback", feedback.currentPostKey.toString());
    return feedback;
  } catch {
    const feedbackAccount = Keypair.generate();
    const genesisPostAccount = Keypair.generate();

    await program.rpc.initFeedback({
      accounts: {
        authority: walletKey,
        systemProgram: SystemProgram.programId,
        feedbackAccount: feedbackAccount.publicKey,
        genesisPostAccount: genesisPostAccount.publicKey,
      },
      signers: [feedbackAccount, genesisPostAccount],
    });

    const feedback = await program.account.feedbackState.fetch(
      feedbackAccount.publicKey
    );

    console.log("Blog pubkey: ", feedbackAccount.publicKey.toString());
    return feedback;
  }
}

export const createPost = async (
  anchorWallet: AnchorWallet,
  title: string,
  content: string
) => {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  const postAccount = Keypair.generate();
  const userAccount = getUserKey(provider.wallet.publicKey);
  await program.rpc.createPost(title, content, {
    accounts: {
      feedbackAccount: FEEDBACK_KEY,
      authority: provider.wallet.publicKey,
      userAccount: userAccount.publicKey,
      postAccount: postAccount.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [postAccount],
  });
  message.success("Your feedback has been sent");
};
