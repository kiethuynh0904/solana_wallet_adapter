use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
    borsh::try_from_slice_unchecked,
    clock::UnixTimestamp,
};
use borsh::{BorshDeserialize, BorshSerialize};

pub mod create_ticket_auction;

// Re-export submodules handlers + associated types for other programs to consume.
pub use create_ticket_auction::*;

#[repr(C)]
#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq, Debug)]
pub struct AuctionTicketData {
    pub end_auction_at: Option<UnixTimestamp>,
}

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        use crate::instruction::TicketAuctionInstruction;
        match TicketAuctionInstruction::try_from_slice(instruction_data)? {
            TicketAuctionInstruction::CreateAuctionTicket(args) => create_ticket_auction(program_id, accounts, args),
        }
    }
}