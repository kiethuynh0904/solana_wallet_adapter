const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

async function updateUser(program, provider, userAccount) {

    const updatedName = "updated name";
    const updatedAvatar = "Updated avatar";


    await program.rpc.updateUser(updatedName, updatedAvatar, {
        accounts: {
            authority: provider.wallet.publicKey,
            userAccount: userAccount.publicKey,
            systemProgram: SystemProgram.programId,
        },
    });

    const user = await program.account.userState.fetch(userAccount.publicKey);
    return { user, updatedName, updatedAvatar };
}

module.exports = {
    updateUser,
};