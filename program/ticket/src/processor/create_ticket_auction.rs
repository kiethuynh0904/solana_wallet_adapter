use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        clock::UnixTimestamp,
        entrypoint::ProgramResult,
        msg,
        program_error::ProgramError,
        pubkey::Pubkey,
    },
    std::mem,
};

use crate::{
    processor::{
        AuctionTicketData, 
    },
};

#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq)]
pub struct CreateAuctionTicketArgs {
    /// End time is the cut-off point that the auction is forced to end by. See AuctionData.
    pub end_auction_at: Option<UnixTimestamp>,
    /// Auction reward
    pub reward: u64,
}

pub fn create_ticket_auction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    args: CreateAuctionTicketArgs,
) -> ProgramResult {
    msg!("Processing create ticket auction");
    let account_iter = &mut accounts.iter();

    let payer = next_account_info(account_iter)?;

    let auction = next_account_info(account_iter)?;

    // create_or_allocate_account_raw(
    //     *program_id,
    //     accounts.auction,
    //     accounts.rent,
    //     accounts.system,
    //     accounts.payer,
    //     auction_size,
    //     &[
    //         PREFIX.as_bytes(),
    //         program_id.as_ref(),
    //         &args.resource.to_bytes(),
    //         &[bump],
    //     ],
    // )?;

    AuctionTicketData {
        end_auction_at: args.end_auction_at,
    }.serialize(&mut *auction.data.borrow_mut())?;

    Ok(())
}
