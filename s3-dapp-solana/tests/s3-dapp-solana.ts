import { SystemProgram } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { S3DappSolana } from "../target/types/s3_dapp_solana";

const { createUser } = require("./functions/createUser");
const { updateUser } = require("./functions/updateUser");
const { createFeedback } = require("./functions/createFeedback");
const { createPost } = require("./functions/createPost");

const assert = require("assert");

describe("s3-dapp-solana", () => {
  const provider = anchor.Provider.env();

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.S3DappSolana as Program<S3DappSolana>;

  it("init feedback account", async () => {
    const { feedback, feedbackAccount, genesisPostAccount } =
      await createFeedback(program, provider);
    assert.equal(
      feedback.currentPostKey.toString(),
      genesisPostAccount.publicKey.toString()
    );

    assert.equal(
      feedback.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("signup a new user", async () => {
    const { user, name, avatar } = await createUser(program, provider);

    assert.equal(user.name, name);
    assert.equal(user.avatar, avatar);

    assert.equal(
      user.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("update new user", async () => {
    const { name, avatar, userAccount } = await createUser(program, provider);
    console.log({ name, avatar, userAccount });

    const { user, updatedName, updatedAvatar } = await updateUser(
      program,
      provider,
      userAccount
    );

    assert.equal(user.name, updatedName);
    assert.equal(user.avatar, updatedAvatar);
    assert.equal(
      user.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });
  it("creates a new post", async () => {
    const { feedback, feedbackAccount } = await createFeedback(
      program,
      provider
    );
    const { userAccount } = await createUser(program, provider);

    const { title, post, content, created_time } = await createPost(
      program,
      provider,
      feedbackAccount,
      userAccount
    );

    console.log("post.created_time", post.created_time);
    console.log("eual created time,created_time", created_time);

    assert.equal(post.title, title);
    assert.equal(post.content, content);
    assert.equal(post.createdTime.toString(), created_time.toString());
    assert.equal(post.user.toString(), userAccount.publicKey.toString());
    assert.equal(
      post.prePostKey.toString(),
      feedback.currentPostKey.toString()
    );
    assert.equal(
      post.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });

  it("updates the post", async () => {
    const { feedback, feedbackAccount } = await createFeedback(
      program,
      provider
    );
    const { userAccount } = await createUser(program, provider);
    const { postAccount } = await createPost(
      program,
      provider,
      feedbackAccount,
      userAccount
    );

    // now update the created post
    const updateTitle = "Updated Post title";
    const updateContent = "Updated Post content";
    const tx = await program.rpc.updatePost(updateTitle, updateContent, {
      accounts: {
        authority: provider.wallet.publicKey,
        postAccount: postAccount.publicKey,
      },
    });

    const post = await program.account.postState.fetch(postAccount.publicKey);

    assert.equal(post.title, updateTitle);
    assert.equal(post.content, updateContent);
    assert.equal(post.user.toString(), userAccount.publicKey.toString());
    assert.equal(
      post.prePostKey.toString(),
      feedback.currentPostKey.toString()
    );
    assert.equal(
      post.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });
  it("delete the post", async () => {
    const { feedback, feedbackAccount } = await createFeedback(
      program,
      provider
    );

    const { userAccount } = await createUser(program, provider);

    const { postAccount: postAccount1 } = await createPost(
      program,
      provider,
      feedbackAccount,
      userAccount
    );

    const { post: post2, postAccount: postAccount2 } = await createPost(
      program,
      provider,
      feedbackAccount,
      userAccount
    );

    const {
      title,
      content,
      post: post3,
      postAccount: postAccount3,
    } = await createPost(program, provider, feedbackAccount, userAccount);

    assert.equal(
      postAccount2.publicKey.toString(),
      post3.prePostKey.toString()
    );
    assert.equal(
      postAccount1.publicKey.toString(),
      post2.prePostKey.toString()
    );

    await program.rpc.deletePost({
      accounts: {
        authority: provider.wallet.publicKey,
        postAccount: postAccount2.publicKey,
        nextPostAccount: postAccount3.publicKey,
      },
    });

    const upPost3 = await program.account.postState.fetch(
      postAccount3.publicKey
    );
    assert.equal(
      postAccount1.publicKey.toString(),
      upPost3.prePostKey.toString()
    );

    assert.equal(upPost3.title, title);
    assert.equal(upPost3.content, content);
    assert.equal(upPost3.user.toString(), userAccount.publicKey.toString());
    assert.equal(
      upPost3.authority.toString(),
      provider.wallet.publicKey.toString()
    );
  });
});
