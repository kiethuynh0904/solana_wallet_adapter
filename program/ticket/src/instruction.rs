use solana_program::program_error::ProgramError;
use std::convert::TryInto;

use crate::error::EscrowError::InvalidInstruction;
use borsh::{BorshDeserialize, BorshSerialize};

pub use crate::processor::{
    create_ticket_auction::CreateAuctionTicketArgs,
};

#[derive(Clone, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum TicketAuctionInstruction {
    CreateAuctionTicket(CreateAuctionTicketArgs)
}