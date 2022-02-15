use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};

use spl_token::state::Account as TokenAccount;

use crate::{error::GameError, instruction::GameRulesInstruction, state::GameRules};

pub struct Processor;

impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = GameRulesInstruction::unpack(instruction_data)?;

        match instruction {
            GameRulesInstruction::InitGameRules => {
                msg!("Instruction: InitEscrow");
                Self::process_init_game_rules(accounts, program_id)
            }
            GameRulesInstruction::Exchange => {
                msg!("Instruction: Exchange");
                Self::process_exchange(accounts, program_id)
            }
        }
    }

    fn process_init_game_rules(accounts: &[AccountInfo], program_id: &Pubkey) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;

        if !initializer.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let initializer_mortgage_account = next_account_info(account_info_iter)?;

        let initializer_token_to_receive_account = next_account_info(account_info_iter)?;

        if *initializer_token_to_receive_account.owner != spl_token::id() {
            return Err(ProgramError::IncorrectProgramId);
        }

        let game_rules_account = next_account_info(account_info_iter)?;
        // SYSVAR_RENT
        let sysvar_rent = next_account_info(account_info_iter)?;

        // TOKEN PROGRAM ID
        let token_program = next_account_info(account_info_iter)?;
        let rent = &Rent::from_account_info(sysvar_rent)?;

        if !rent.is_exempt(game_rules_account.lamports(), game_rules_account.data_len()) {
            return Err(GameError::NotRentExempt.into());
        }

        let mut game_rules_info =
            GameRules::unpack_unchecked(&game_rules_account.try_borrow_data()?)?;
        if game_rules_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        game_rules_info.is_initialized = true;
        game_rules_info.initializer_pubkey = *initializer.key;
        game_rules_info.initializer_mortgage_token_account_pubkey =
            *initializer_mortgage_account.key;
        game_rules_info.initializer_token_to_receive_account_pubkey =
            *initializer_token_to_receive_account.key;

        GameRules::pack(
            game_rules_info,
            &mut game_rules_account.try_borrow_mut_data()?,
        )?;
        let (pda, _nonce) = Pubkey::find_program_address(&[b"escrow"], program_id);

        let owner_change_mortgage_account = spl_token::instruction::set_authority(
            token_program.key,
            initializer_mortgage_account.key,
            Some(&pda),
            spl_token::instruction::AuthorityType::AccountOwner,
            initializer.key,
            &[&initializer.key],
        )?;

        msg!("Calling the token program to transfer token account ownership...");
        invoke(
            &owner_change_mortgage_account,
            &[
                initializer_mortgage_account.clone(),
                initializer.clone(),
                token_program.clone(),
            ],
        )?;

        Ok(())
    }

    fn process_exchange(accounts: &[AccountInfo], program_id: &Pubkey) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let host = next_account_info(account_info_iter)?;

        if !host.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let host_token_to_receive_or_sending_account = next_account_info(account_info_iter)?;

        let pdas_initializer_mortgage_token_account = next_account_info(account_info_iter)?;

        // let _pdas_initializer_mortgage_token_account_info =
        //     TokenAccount::unpack(&pdas_initializer_mortgage_token_account.try_borrow_data()?)?;
        let (pda, nonce) = Pubkey::find_program_address(&[b"escrow"], program_id);

        let initializers_main_account = next_account_info(account_info_iter)?;
        let initializers_token_to_receive_account = next_account_info(account_info_iter)?;

        let game_rules_account = next_account_info(account_info_iter)?;

        let game_rules_info = GameRules::unpack(&game_rules_account.try_borrow_data()?)?;

        if game_rules_info.initializer_mortgage_token_account_pubkey
            != *pdas_initializer_mortgage_token_account.key
        {
            return Err(ProgramError::InvalidAccountData);
        }

        if game_rules_info.initializer_pubkey != *initializers_main_account.key {
            return Err(ProgramError::InvalidAccountData);
        }

        if game_rules_info.initializer_token_to_receive_account_pubkey
            != *initializers_token_to_receive_account.key
        {
            return Err(ProgramError::InvalidAccountData);
        }

        let winner_pubkey = next_account_info(account_info_iter)?;

        let token_program = next_account_info(account_info_iter)?;

        let pda_account = next_account_info(account_info_iter)?;

        msg!("Calling the program to transfer token to initializer pubkey");

        if game_rules_info.initializer_pubkey == *winner_pubkey.key {
            let transfer_to_initializer = spl_token::instruction::transfer(
                token_program.key,
                host_token_to_receive_or_sending_account.key,
                initializers_token_to_receive_account.key,
                host.key,
                &[&host.key],
                5_000_000_000,
            )?;
            msg!("Calling the program to transfer token to initializer pubkey");
            invoke(
                &transfer_to_initializer,
                &[
                    host_token_to_receive_or_sending_account.clone(),
                    initializers_token_to_receive_account.clone(),
                    host.clone(),
                    token_program.clone(),
                ],
            )?;
            let refund_mortgage = spl_token::instruction::transfer(
                token_program.key,
                pdas_initializer_mortgage_token_account.key,
                initializers_token_to_receive_account.key,
                &pda,
                &[&pda],
                5_000_000_000,
            )?;
            msg!("Calling the program to refund a mortgage");
            invoke_signed(
                &refund_mortgage,
                &[
                    pdas_initializer_mortgage_token_account.clone(),
                    initializers_token_to_receive_account.clone(),
                    pda_account.clone(),
                    token_program.clone(),
                ],
                &[&[&b"escrow"[..], &[nonce]]],
            )?;
        } else if host.key == winner_pubkey.key {
            let transfer_to_host = spl_token::instruction::transfer(
                token_program.key,
                pdas_initializer_mortgage_token_account.key,
                host_token_to_receive_or_sending_account.key,
                &pda,
                &[&pda],
                5_000_000_000,
            )?;
            msg!("Calling the token program to transfer tokens to the host haha...");
            invoke_signed(
                &transfer_to_host,
                &[
                    pdas_initializer_mortgage_token_account.clone(),
                    host_token_to_receive_or_sending_account.clone(),
                    pda_account.clone(),
                    token_program.clone(),
                ],
                &[&[&b"escrow"[..], &[nonce]]],
            )?;
        }

        let close_pdas_mortgage_token_account = spl_token::instruction::close_account(
            token_program.key,
            pdas_initializer_mortgage_token_account.key,
            initializers_main_account.key,
            &pda,
            &[&pda],
        )?;
        msg!("Calling the token program to close pda's temp account...");
        invoke_signed(
            &close_pdas_mortgage_token_account,
            &[
                pdas_initializer_mortgage_token_account.clone(),
                initializers_main_account.clone(),
                pda_account.clone(),
                token_program.clone(),
            ],
            &[&[&b"escrow"[..], &[nonce]]],
        )?;

        msg!("Closing the game rule account...");
        **initializers_main_account.try_borrow_mut_lamports()? = initializers_main_account
            .lamports()
            .checked_add(game_rules_account.lamports())
            .ok_or(GameError::AmountOverflow)?;
        **game_rules_account.try_borrow_mut_lamports()? = 0;
        *game_rules_account.try_borrow_mut_data()? = &mut [];

        Ok(())
    }
}
