use crate::error::GameError::InvalidInstruction;
use solana_program::{msg, program_error::ProgramError};

pub enum GameRulesInstruction {
    /// Init the game
    ///
    /// 0. `[signer]` The account of the person initializing the escrow
    /// 1. `[writable]` Temporary token account that should be created prior to this instruction and owned by the initializer
    /// 2. `[]` The initializer's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The escrow account, it will hold all necessary info about the trade.
    /// 4. `[]` The rent sysvar
    /// 5. `[]` The token program
    InitGameRules,
    /// Start the game
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person taking the trade
    /// 1. `[writable]` The taker's token account for the token they send
    /// 2. `[writable]` The taker's token account for the token they will receive should the trade go through
    /// 3. `[writable]` The PDA's temp token account to get tokens from and eventually close
    /// 4. `[writable]` The initializer's main account to send their rent fees to
    /// 5. `[writable]` The initializer's token account that will receive tokens
    /// 6. `[writable]` The escrow account holding the escrow info
    /// 7. `[]` The token program
    /// 8. `[]` The PDA account
    Exchange,
}

impl GameRulesInstruction {
    /// Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;

        msg!("tag {}", tag);

        Ok(match tag {
            0 => Self::InitGameRules,
            1 => Self::Exchange,
            _ => return Err(InvalidInstruction.into()),
        })
    }

    // fn unpack_amount(input: &[u8]) -> Result<u64, ProgramError> {
    //     let amount = input
    //         .get(..8)
    //         .and_then(|slice| slice.try_into().ok())
    //         .map(u64::from_le_bytes)
    //         .ok_or(InvalidInstruction)?;
    //     Ok(amount)
    // }
}
