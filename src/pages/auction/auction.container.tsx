import { Button } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import BN from "bn.js";
import React, { FC, useState } from "react";
import { Auction } from "../../api";
import {
  AUCTION_SCHEMA,
  CreateAuctionArgs,
  IPartialCreateAuctionArgs,
} from "../../model/auction";
import { deserializeUnchecked, deserialize } from "borsh";

export interface AuctionState {
  auctionDuration?: number;
  auctionDurationType?: "days" | "hours" | "minutes";
}

export const AuctionContainer: FC = () => {
  const wallet = useWallet();
  const { sendTransaction } = wallet;
  let connection = new Connection(clusterApiUrl("devnet"));
  let auctionKey: PublicKey;

  const [attributes, setAttributes] = useState<AuctionState>({
    auctionDurationType: "minutes",
    auctionDuration: 5,
  });

  const makeAuction = async () => {
    const auctionSettings: IPartialCreateAuctionArgs = {
      endAuctionAt: new BN(
        (attributes.auctionDuration || 0) *
          (attributes.auctionDurationType == "days"
            ? 60 * 60 * 24 // 1 day in seconds
            : attributes.auctionDurationType == "hours"
            ? 60 * 60 // 1 hour in seconds
            : 60) // 1 minute in seconds
      ), // endAuctionAt is actually auction duration, poorly named, in seconds
    };
    let signature: TransactionSignature = "";
    const {
      instructions: makeAuctionInstructions,
      signers: makeAuctionSigners,
      auction,
    } = await Auction.makeAuction(wallet, auctionSettings);
    console.log("auctionSettings", auctionSettings.endAuctionAt);
    console.log({ makeAuctionInstructions, makeAuctionSigners, auction });
    auctionKey = new PublicKey(auction);
    // let instructions: TransactionInstruction[][] = [];
    // let transaction = new Transaction();
    console.log('makeAuctionInstructions',makeAuctionInstructions);
    // makeAuctionInstructions.forEach((instruction) => console.log('instruction',instruction));
    
    console.log("transaction");
    // signature = await sendTransaction(transaction, connection, {
    //   signers: makeAuctionSigners,
    // });
    // console.log("signature", signature);
    // await connection.confirmTransaction(signature, "confirmed");
  };

  const report = async () => {
    const accountInfo = await connection.getAccountInfo(auctionKey);
    if (accountInfo === null) {
      throw "Error: cannot find the greeted account";
    }
    const auction = deserialize(
      AUCTION_SCHEMA,
      CreateAuctionArgs,
      accountInfo.data
    );
    console.log(
      // greetedPubkey.toBase58(),
      "S3 program has been greeted",
      auction.endAuctionAt
    );
  };

  return (
    <div>
      <Button variant="contained" onClick={makeAuction}>
        Init
      </Button>
      <Button variant="contained" onClick={report}>
        Report
      </Button>
    </div>
  );
};
