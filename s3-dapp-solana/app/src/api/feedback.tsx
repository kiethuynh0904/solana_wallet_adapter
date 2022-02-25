import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { connection, getProgram } from "../utils";
import * as anchor from "@project-serum/anchor";
import { Wallet as AnchorWallet } from "@project-serum/anchor/dist/cjs/provider";
import { getUserKey } from "../helper";
import { message } from "antd";
import { Observable, Subscriber } from "rxjs";
import { ConnectionContextState, useConnection } from "@solana/wallet-adapter-react";

const FEEDBACK_KEY = new PublicKey(
  "K8Ldpc93WR1ZjRsBSUDx4CyBxYwAvVJNGTz7cXqM6Bx"
);

interface PostData {
  title: string;
  content: string;
  createdTime: anchor.BN;
}

export interface Post extends PostData {
  id: string;
  userId: string;
  prePostId: string | null;
  avatar: string;
  name: string;
}

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
  userAccountPubkey: PublicKey,
  title: string,
  content: string,
) => {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  const postAccount = Keypair.generate();
  const created_time = Math.floor(Date.now() / 1000);
  const tx = await program.rpc.createPost(
    title,
    content,
    new anchor.BN(created_time),
    {
      accounts: {
        feedbackAccount: FEEDBACK_KEY,
        authority: provider.wallet.publicKey,
        userAccount: userAccountPubkey,
        postAccount: postAccount.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [postAccount],
    }
  );
  console.log("created post transaction", tx);
  message.success("Your feedback has been sent");
};

export const updatePost = async (
  anchorWallet: AnchorWallet,
  postAccountPubkey: PublicKey,
  title: string,
  content: string
) => {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  const tx = await program.rpc.updatePost(title, content, {
    accounts: {
      authority: provider.wallet.publicKey,
      postAccount: postAccountPubkey,
    },
  });
  console.log("updated post transaction", tx);
  message.success("Your feedback has been update");
};

export async function getPostById(anchorWallet: AnchorWallet, postId: string) {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);
  try {
    const post: any = await program.account.postState.fetch(
      new PublicKey(postId)
    );

    const userId = post.user.toString();
    if (userId === SystemProgram.programId.toString()) {
      return;
    }

    const _user = await program.account.userState.fetch(new PublicKey(userId));

    return {
      id: postId,
      title: post.title,
      content: post.content,
      createdTime: post.createdTime,
      userId,
      prePostId: post.prePostKey.toString(),
      name: _user.name,
      avatar: _user.avatar,
    };
  } catch (e: any) {
    console.log(e.message);
  }
}

export function getAllPosts(args: {
  anchorWallet: AnchorWallet;
  fromPostId: string;
  toPostId?: string;
}) {
  const { fromPostId, anchorWallet } = args;
  let sub: Subscriber<Post> | undefined;
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);

  const cancel = () => sub?.unsubscribe();
  const observer = new Observable<Post>((subscriber) => {
    sub = subscriber;
    console.log("sub", sub);

    async function start() {
      let nextPostId: string | null = fromPostId;

      while (!!nextPostId) {
        const post: Post | undefined = await getPostById(
          anchorWallet,
          nextPostId
        );

        if (!post) {
          break;
        }

        subscriber.next(post);
        nextPostId = post.prePostId;
      }

      subscriber.complete();
    }

    start();
  });

  return [observer, cancel] as const;
}

export const deletePost = async (
  anchorWallet: AnchorWallet,
  postId: string,
  nextPostId: string,
) => {
  const provider = new anchor.Provider(connection, anchorWallet, {});

  const program = getProgram(provider);

  const tx = await program.rpc.deletePost({
    accounts: {
      authority: provider.wallet.publicKey,
      postAccount: new PublicKey(postId),
      nextPostAccount: new PublicKey(nextPostId),
    },
  });
  console.log("delete transaction", tx);
  return tx;
};

export const deleteLatestPost = async (
  anchorWallet: AnchorWallet,
  postId: string
) => {
  const provider = new anchor.Provider(connection, anchorWallet, {});
  const program = getProgram(provider);

  const tx = await program.rpc.deleteLastPost({
    accounts: {
      authority: provider.wallet.publicKey,
      postAccount: new PublicKey(postId),
      feedbackAccount: FEEDBACK_KEY,
    },
  });
  console.log("delete lasted transaction", tx);
  return tx;
};
