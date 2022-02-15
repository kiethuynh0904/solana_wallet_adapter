import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { S3DappSolana } from '../target/types/s3_dapp_solana';

const { createUser } = require("./functions/createUser");

const assert = require("assert");


describe('s3-dapp-solana', () => {
  const provider = anchor.Provider.env();

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.S3DappSolana as Program<S3DappSolana>;

  it("signup a new user", async () => {
    const { user, name, avatar } = await createUser(program, provider);

    assert.equal(user.name, name);
    assert.equal(user.avatar, avatar);

    assert.equal(
      user.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });
});