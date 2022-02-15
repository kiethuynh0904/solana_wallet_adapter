import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";

import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { IPartialCreateAuctionArgs, CreateAuctionArgs,AUCTION_SCHEMA } from "../model/auction";
import { toPublicKey, findProgramAddress } from "../utils";
import { deserializeUnchecked, serialize } from "borsh";

const PROGRAMS_ID = "Fm35VjWCV65i1YKRfqphm4JXpS7AsV8BUCWVZ5tChijf";
const AUCTION_PREFIX = "auction";

// This command makes an auction
export async function makeAuction(
  wallet: any,
  auctionSettings: IPartialCreateAuctionArgs
): Promise<{
  auction: string;
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> {
  if (!wallet.publicKey) throw new WalletNotConnectedError();

  const signers: Keypair[] = [];
  const instructions: TransactionInstruction[] = [];
  const auctionKey = (
    await findProgramAddress(
      [
        Buffer.from(AUCTION_PREFIX),
        toPublicKey(PROGRAMS_ID).toBuffer(),
      ],
      toPublicKey(PROGRAMS_ID)
    )
  )[0];

  console.log('auctionKey',auctionKey);

  const fullSettings = new CreateAuctionArgs({
    ...auctionSettings,
  });

  createAuction(fullSettings, wallet.publicKey.toBase58(), instructions);

  return { instructions, signers, auction: auctionKey };
}

export async function createAuction(
  settings: CreateAuctionArgs,
  creator: string,
  instructions: TransactionInstruction[]
) {
  const auctionProgramId = PROGRAMS_ID;

  const data = Buffer.from(serialize(AUCTION_SCHEMA, settings));

  const auctionKey: string = (
    await findProgramAddress(
      [
        Buffer.from(AUCTION_PREFIX),
        toPublicKey(auctionProgramId).toBuffer(),
        // toPublicKey(settings.resource).toBuffer(),
      ],
      toPublicKey(auctionProgramId)
    )
  )[0];

  const keys = [
    {
      pubkey: toPublicKey(creator),
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(auctionKey),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(auctionProgramId),
      data: data,
    })
  );
}
