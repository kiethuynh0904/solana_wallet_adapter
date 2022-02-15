import {
  SendTransactionOptions,
  SignerWalletAdapter,
} from "@solana/wallet-adapter-base";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  sendAndConfirmTransaction,
  TransactionInstruction,
  StakeProgram,
  Authorized,
  Lockup,
  Signer,
} from "@solana/web3.js";

let stakeAccount: Keypair;

let connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function stakingConnection(
  fromPubkey: PublicKey,
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: SendTransactionOptions
  ) => Promise<TransactionSignature>,
  amountLamportsStaking: number
): Promise<void> {
  stakeAccount = Keypair.generate();
  let authorizedAccount = new Authorized(fromPubkey, fromPubkey);

  let signature: TransactionSignature = "";

  let lamportsForStakeAccount =
    (await connection.getMinimumBalanceForRentExemption(StakeProgram.space)) +
    amountLamportsStaking * LAMPORTS_PER_SOL;

  let createAccountTransaction = StakeProgram.createAccount({
    fromPubkey: fromPubkey,
    authorized: authorizedAccount,
    lamports: lamportsForStakeAccount,
    lockup: new Lockup(0, 0, fromPubkey),
    stakePubkey: stakeAccount.publicKey,
  });

  signature = await sendTransaction(createAccountTransaction, connection, {
    signers: [stakeAccount],
  });

  await connection.confirmTransaction(signature, "confirmed");

  let voteAccounts = await connection.getVoteAccounts();
  let voteAccount = voteAccounts.current.concat(voteAccounts.delinquent)[0];
  let votePubkey = new PublicKey(voteAccount.votePubkey);

  //   We can then delegate our stake to the voteAccount
  let delegateTransaction = StakeProgram.delegate({
    stakePubkey: stakeAccount.publicKey,
    authorizedPubkey: fromPubkey,
    votePubkey: votePubkey,
  });
  const voteSignature = await sendTransaction(delegateTransaction, connection);
  await connection.confirmTransaction(voteSignature, "confirmed");
}



export const getStakeActivation = async () => {
  let stakeBalance = await connection.getBalance(stakeAccount.publicKey);
  console.log(`Stake balance: ${stakeBalance}`);

  let stakeState = await connection.getStakeActivation(stakeAccount.publicKey);
  console.log(`Stake Stake: ${stakeState.state}`);
};
