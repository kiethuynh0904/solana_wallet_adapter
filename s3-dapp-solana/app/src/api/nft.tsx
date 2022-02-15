import {
  PublicKey,
  Transaction,
  TransactionSignature,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";

import { AccountAPI } from "./index";
import { SendTransactionOptions } from "@solana/wallet-adapter-base";
import { toast } from "react-toastify";
import NotificationToastify from "../components/NotificationToastify";
import { defaultToastOptions } from "../constants/toastifyOptions";

let connection = new Connection(clusterApiUrl("devnet"));

let defaultAcc = AccountAPI.getDefaultAccount();

export const buyNFT = async (
  receiver: PublicKey,
  mintAddress: PublicKey,
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>
) => {

  let myToken = new splToken.Token(
    connection,
    mintAddress, // your nft address
    splToken.TOKEN_PROGRAM_ID,
    defaultAcc // payer
  );

  let fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
    defaultAcc.publicKey
  );
  let toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(receiver);

  let instruction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: receiver,
      toPubkey: defaultAcc.publicKey,
      lamports: 0.49 * LAMPORTS_PER_SOL,
    }),
    splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      fromTokenAccount.address,
      toTokenAccount.address,
      defaultAcc.publicKey,
      [],
      1
    )
  );
  // Sign transaction, broadcast, and confirm
  let signature = await sendTransaction(instruction, connection, {
    signers: [defaultAcc],
  });
  toast.info(
    <NotificationToastify signature={signature} message="Transaction sent:" />,
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
};
