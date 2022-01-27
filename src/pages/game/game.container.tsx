import React, { FC, useState } from "react";

import { Button } from "@mui/material";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import { message, Row, Modal, Col, Descriptions, Typography, Spin } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

import BN from "bn.js";

import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { mintTokenAddress, connection, sleepUtil } from "../../utils";
import { GAME_RULE_ACCOUNT_DATA_LAYOUT } from "../../model/game_rule";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import NotificationToastify from "../../components/NotificationToastify";
import { defaultToastOptions } from "../../constants/toastifyOptions";

const DEFAULT_MORTGAGE_VALUE = 5;
const GAME_RULE_PROGRAM_ID = new PublicKey(
  "xgiBYEpcRKnHb1TH6c9z4sSEP7CC2Gi8MRH2Y3AMU5a"
);

const { confirm } = Modal;
const { Text, Title } = Typography;

export const GameplayContainer: FC = () => {
  const wallet = useWallet();
  const { sendTransaction, publicKey } = wallet;
  const [gamePubkey, setGamePubkey] = useState<PublicKey>();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  let navigate = useNavigate();

  const showConfirm = () => {
    confirm({
      title: <Text strong>Warning</Text>,
      icon: <ExclamationCircleOutlined />,
      content: `You must mortgage ${DEFAULT_MORTGAGE_VALUE} XMT before starting the game`,
      okText: "Agree",
      onOk() {
        initGameRule();
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const initGameRule = async () => {
    if (!publicKey) return;
    setIsSpinning(true);
    var fromTokenAccountAddress = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintTokenAddress,
      publicKey
    );

    const fromTokenAccount = await connection.getAccountInfo(
      fromTokenAccountAddress,
      "confirmed"
    );
    if (!fromTokenAccount) {
      message.error("please get XMT token first");
      setIsSpinning(false);
      return;
    }

    console.log('associated account XMT', fromTokenAccountAddress.toString());

    const InitializerMortgageAccountKeypair = new Keypair();
    const createInitializerMortgageAccount = SystemProgram.createAccount({
      programId: TOKEN_PROGRAM_ID,
      space: AccountLayout.span,
      lamports: await connection.getMinimumBalanceForRentExemption(
        AccountLayout.span
      ),
      fromPubkey: publicKey,
      newAccountPubkey: InitializerMortgageAccountKeypair.publicKey,
    });

    const initMortgageAccount = Token.createInitAccountInstruction(
      TOKEN_PROGRAM_ID,
      mintTokenAddress,
      InitializerMortgageAccountKeypair.publicKey,
      publicKey
    );

    const transferTokensToMortgageAccount = Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      fromTokenAccountAddress,
      InitializerMortgageAccountKeypair.publicKey,
      publicKey,
      [],
      DEFAULT_MORTGAGE_VALUE * LAMPORTS_PER_SOL
    );

    const gameRuleKeypair = new Keypair();
    console.log("gameRuleKeypair", gameRuleKeypair.publicKey.toString());
    console.log(
      "InitializerMortgageAccountKeypair",
      InitializerMortgageAccountKeypair.publicKey.toString()
    );
    const createGameRuleAccount = SystemProgram.createAccount({
      space: GAME_RULE_ACCOUNT_DATA_LAYOUT.span,
      lamports: await connection.getMinimumBalanceForRentExemption(
        GAME_RULE_ACCOUNT_DATA_LAYOUT.span
      ),
      fromPubkey: publicKey,
      newAccountPubkey: gameRuleKeypair.publicKey,
      programId: GAME_RULE_PROGRAM_ID,
    });

    const initGameRule = new TransactionInstruction({
      programId: GAME_RULE_PROGRAM_ID,
      keys: [
        { pubkey: publicKey, isSigner: true, isWritable: false },
        {
          pubkey: InitializerMortgageAccountKeypair.publicKey,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: fromTokenAccountAddress,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: gameRuleKeypair.publicKey,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(
        Uint8Array.of(0, ...new BN(DEFAULT_MORTGAGE_VALUE).toArray("le", 8))
      ),
    });
    let signature: TransactionSignature = "";
    try {
      const transaction = new Transaction().add(
        createInitializerMortgageAccount,
        initMortgageAccount,
        transferTokensToMortgageAccount,
        createGameRuleAccount,
        initGameRule
      );
      console.log("Sending initialization transaction...");
      console.log("Sending 5 XMT token to mortgage account...");
      signature = await sendTransaction(transaction, connection, {
        signers: [InitializerMortgageAccountKeypair, gameRuleKeypair],
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      toast.info(
        <NotificationToastify
          signature={signature}
          message="Transaction sent:"
        />,
        defaultToastOptions
      );

      await sleepUtil(3000);

      setIsSpinning(false);

      navigate("start", {
        state: { gameRulePubkey: gameRuleKeypair.publicKey.toString() },
      });

      setGamePubkey(gameRuleKeypair.publicKey);
    } catch (error) {
      console.log("error");
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <Spin size="large" spinning={isSpinning}>
      <Row
        style={{
          padding: 15,
          paddingTop: 50,
          paddingBottom: 50,
          height: "100vh",
        }}
        justify="center"
        align="middle"
      >
        <Col>
          <div>
            <Title mark>
              {" "}
              You need to mortgage {DEFAULT_MORTGAGE_VALUE} XMT before you start
              game
            </Title>
          </div>
          <Row justify="center">
            <Button variant="contained" onClick={showConfirm}>
              Init Game Rule
            </Button>
          </Row>
        </Col>
      </Row>
    </Spin>
  );
};
