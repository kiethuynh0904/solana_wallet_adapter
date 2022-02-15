import BN from "bn.js";

export interface IPartialCreateAuctionArgs {
  endAuctionAt: BN | null;
}

export class CreateAuctionArgs implements IPartialCreateAuctionArgs {
  instruction: number = 7;
  
  endAuctionAt: BN | null;

  constructor(args: { endAuctionAt: BN | null }) {
    this.endAuctionAt = args.endAuctionAt;
  }
}

export const AUCTION_SCHEMA = new Map<any, any>([
  [
    CreateAuctionArgs,
    {
      kind: "struct",
      fields: [
        ["instruction", "u8"],
        ["endAuctionAt", { kind: "option", type: "u64" }],
      ],
    },
  ],
]);
