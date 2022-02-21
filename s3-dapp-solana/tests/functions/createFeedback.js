const anchor = require("@project-serum/anchor");

const { SystemProgram } = anchor.web3;

// we will discus the parameters when we use it
async function createFeedback(program, provider) {
    const initFeedbackAccount = anchor.web3.Keypair.generate(); // creates random keypair
    const genesisPostAccount = anchor.web3.Keypair.generate(); // creates random keypair

    await program.rpc.initFeedback({
        accounts: {
            authority: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
            feedbackAccount: initFeedbackAccount.publicKey,
            genesisPostAccount: genesisPostAccount.publicKey,
        },
        signers: [initFeedbackAccount, genesisPostAccount],
    });

    const feedback = await program.account.feedbackState.fetch(initFeedbackAccount.publicKey);

    return { feedback, feedbackAccount: initFeedbackAccount, genesisPostAccount };
}

module.exports = {
    createFeedback,
};