use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, SetAuthority, TokenAccount, Transfer};

declare_id!("DBKpaRbYwPjES1PuP933hjLQkzDiubo5NjNoXt4nv3Zq");

pub const POST_SPACE: usize = 8 + // discriminator
50  + // title
100 + // content 
8   + // created_date timestamp 
32  + // user pubKey
32  + // pre_post_key
32; // authority

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

    pub fn update_user(ctx: Context<UpdateUser>, name: String, avatar: String) -> ProgramResult {
        let user_account = &mut ctx.accounts.user_account;
        user_account.name = name;
        user_account.avatar = avatar;
        Ok(())
    }

    pub fn init_feedback(ctx: Context<InitFeedback>) -> ProgramResult {
        // get accounts from ctx
        let feedback_account = &mut ctx.accounts.feedback_account;
        let genesis_post_account = &mut ctx.accounts.genesis_post_account;
        let authority = &mut ctx.accounts.authority;

        // sets the blog state
        feedback_account.authority = authority.key();
        feedback_account.current_post_key = genesis_post_account.key();

        Ok(())
    }
    pub fn create_post(
        ctx: Context<CreatePost>,
        title: String,
        content: String,
        created_time: i64,
    ) -> ProgramResult {
        let feedback_account = &mut ctx.accounts.feedback_account;
        let post_account = &mut ctx.accounts.post_account;
        let user_account = &mut ctx.accounts.user_account;
        let authority = &mut ctx.accounts.authority;

        post_account.title = title;
        post_account.content = content;
        post_account.created_time = created_time;
        post_account.user = user_account.key();
        post_account.authority = authority.key();
        post_account.pre_post_key = feedback_account.current_post_key;

        // store created post id as current post id in feedback account
        feedback_account.current_post_key = post_account.key();

        emit!(PostEvent {
            label: "CREATE".to_string(),
            post_id: post_account.key(),
            next_post_id: None // same as null
        });

        Ok(())
    }

    pub fn update_post(ctx: Context<UpdatePost>, title: String, content: String) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;

        post_account.title = title;
        post_account.content = content;

        emit!(PostEvent {
            label: "UPDATE".to_string(),
            post_id: post_account.key(),
            next_post_id: None // null
        });

        Ok(())
    }

    pub fn delete_post(ctx: Context<DeletePost>) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;
        let next_post_account = &mut ctx.accounts.next_post_account;

        next_post_account.pre_post_key = post_account.pre_post_key;

        emit!(PostEvent {
            label: "DELETE".to_string(),
            post_id: post_account.key(),
            next_post_id: Some(next_post_account.key()) // null
        });
        Ok(())
    }

    pub fn delete_last_post(ctx: Context<DeleteLatestPost>) -> ProgramResult {
        let post_account = &mut ctx.accounts.post_account;
        let feedback_account = &mut ctx.accounts.feedback_account;

        feedback_account.current_post_key = post_account.pre_post_key;

        emit!(PostEvent {
            label: "DELETE".to_string(),
            post_id: post_account.key(),
            next_post_id: None
        });

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

#[derive(Accounts)]
pub struct UpdateUser<'info> {
    #[account(
          mut,
          has_one = authority,
      )]
    pub user_account: Account<'info, UserState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitFeedback<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32)]
    pub feedback_account: Account<'info, FeedbackState>,
    #[account(init, payer = authority, space = 8 + 32 + 32 + 32 + 32 + 8)]
    pub genesis_post_account: Account<'info, PostState>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// from pseudo blog state
#[account]
pub struct FeedbackState {
    pub current_post_key: Pubkey,
    pub authority: Pubkey,
}

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(init, payer = authority, space = POST_SPACE)]
    pub post_account: Account<'info, PostState>,
    #[account(mut, has_one = authority)]
    pub user_account: Account<'info, UserState>,
    #[account(mut)]
    pub feedback_account: Account<'info, FeedbackState>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PostState {
    title: String,
    content: String,
    created_time: i64,
    user: Pubkey,
    pub pre_post_key: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct PostEvent {
    pub label: String,                // label is like 'CREATE', 'UPDATE', 'DELETE'
    pub post_id: Pubkey,              // created post
    pub next_post_id: Option<Pubkey>, // for now ignore this, we will use this when we emit delete event
}

#[derive(Accounts)]
pub struct UpdatePost<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub post_account: Account<'info, PostState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(
        mut,
        has_one = authority,
        constraint = post_account.key() == next_post_account.pre_post_key,
        close = authority
    )]
    pub post_account: Account<'info, PostState>,
    #[account(mut)]
    pub next_post_account: Account<'info, PostState>,
    pub authority: Signer<'info>,
}
#[derive(Accounts)]
pub struct DeleteLatestPost<'info> {
    #[account(mut)]
    pub feedback_account: Account<'info, FeedbackState>,
    #[account(mut,has_one = authority,close = authority)]
    pub post_account: Account<'info, PostState>,
    pub authority: Signer<'info>,
}
