use anchor_lang::prelude::*;

declare_id!("7Dxt825Do6FqABHZrUdDufNDGSGN6LETMPryXNWowMD4");

#[program]
pub mod s3_dapp_solana {
    use super::*;
    pub fn signup_user(ctx: Context<SignupUser>, name: String, avatar: String) -> ProgramResult {
        let user_account = &mut ctx.accounts.user_account;
        let authority = &mut ctx.accounts.authority;
       
        user_account.name = name;
        user_account.avatar = avatar;
        user_account.authority = authority.key();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SignupUser<'info> {
    #[account(init, payer = authority, space = 8 + 40 + 120  + 32)]
    pub user_account: Account<'info, UserState>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserState {
    pub name: String,
    pub avatar: String,
    pub authority: Pubkey,
}