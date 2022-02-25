const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

async function createPost(program, provider, feedbackAccount, userAccount) {
    const postAccount = anchor.web3.Keypair.generate();
    const title = "post title";
    const content = "post content";
    const created_time = Math.floor(Date.now() / 1000);

    await program.rpc.createPost(title, content, new anchor.BN(created_time), {
        accounts: {
            feedbackAccount: feedbackAccount.publicKey,
            authority: provider.wallet.publicKey,
            userAccount: userAccount.publicKey,
            postAccount: postAccount.publicKey,
            systemProgram: SystemProgram.programId,
        },
        signers: [postAccount],
    });

    const post = await program.account.postState.fetch(postAccount.publicKey);
    
    return { post, postAccount, title, content, created_time };
}

module.exports = {
    createPost,
};
