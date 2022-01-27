import { useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  message,
  Radio,
  Input,
  Space,
  Col,
  Row,
  Spin,
  Modal,
  Typography,
  Button,
} from "antd";

import BN from "bn.js";

import React, { FC, useState, useEffect } from "react";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { mintTokenAddress, connection, sleepUtil } from "../../utils";
import {
  GameRuleLayout,
  GAME_RULE_ACCOUNT_DATA_LAYOUT,
} from "../../model/game_rule";
import { getDefaultAccount } from "../../api/account";
import { useLocation, useNavigate } from "react-router-dom";
import { getTokenBalance } from "../../helper";

const DEFAULT_MORTGAGE_VALUE: number = 5;
const GAME_RULE_PROGRAM_ID = new PublicKey(
  "xgiBYEpcRKnHb1TH6c9z4sSEP7CC2Gi8MRH2Y3AMU5a"
);

const { confirm } = Modal;
const { Text, Title } = Typography;

export const GameStartContainer: FC = () => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const hostAccount = getDefaultAccount();
  const hostAccountPubkey = hostAccount.publicKey;
  const { state }: { state: any } = useLocation();
  const [gameRuleStateAccountPubkey, setGameRuleStateAccountPubkey] =
    useState<PublicKey>();
  let navigate = useNavigate();
  const [showBackButton, setShowBackButton] = useState(false);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  useEffect(() => {
    if (state.gameRulePubkey) {
      setGameRuleStateAccountPubkey(new PublicKey(state?.gameRulePubkey));
    }
  }, [state]);

  // 1: Host pubkey
  // 2: Player pubkey
  const [winnerID, setWinnerID] = useState<number>(1);

  const onWinnerChange = (e: any) => {
    setWinnerID(e.target.value);
  };

  const showConfirm = (oldInitBalance: number, initBalance) => {
    const title = winnerID === 1 ? "Sorry" : "Congratulation";

    confirm({
      icon: null,
      title: <Title level={3}>{title.toUpperCase()}</Title>,
      content: (
        <Col>
          <Row>
            <Text>
              You {winnerID === 1 ? "lose" : "win"}{" "}
              <Text type={winnerID === 1 ? "danger" : "success"}>
                {winnerID === 1 ? "-" : "+"} {DEFAULT_MORTGAGE_VALUE} XMT{" "}
              </Text>
              for the game
            </Text>
          </Row>
          <Row>
            <Text strong>
              Old Balance:{" "}
              <Text type="warning">
                {oldInitBalance + DEFAULT_MORTGAGE_VALUE} XMT
              </Text>
            </Text>
          </Row>
          <Text strong>
            Current Balance:{" "}
            <Text type={winnerID === 1 ? "danger" : "success"}>
              {initBalance} XMT
            </Text>
          </Text>
        </Col>
      ),
      cancelButtonProps: { hidden: true },
      okText: "Agree",
      onOk() {
        console.log("ok ok");
      },
    });
  };

  const startGame = async () => {
    if (!publicKey || !gameRuleStateAccountPubkey) return;
    setIsSpinning(true);
    const winnerPubkey = winnerID === 1 ? hostAccountPubkey : publicKey;

    var hostSendingOrReiceiveTokenAccountAddress =
      await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintTokenAddress,
        hostAccount.publicKey
      );

    const hostSendingOrReiceiveTokenAccount = await connection.getAccountInfo(
      hostSendingOrReiceiveTokenAccountAddress,
      "confirmed"
    );

    if (!hostSendingOrReiceiveTokenAccount) {
      message.error("please get XMT token first");
      setIsSpinning(false);
      return;
    }

    const gameRuleAccount = await connection.getAccountInfo(
      gameRuleStateAccountPubkey
    );
    if (gameRuleAccount === null) {
      message.error("Could not find game rule address!");
      setIsSpinning(false);
      return;
    }

    const encodedGameRuleState = gameRuleAccount.data;

    const decodedGameRuleState = GAME_RULE_ACCOUNT_DATA_LAYOUT.decode(
      encodedGameRuleState
    ) as GameRuleLayout;

    const gameRuleState = {
      gameRuleAccountPubkey: gameRuleStateAccountPubkey,
      isInitialized: !!decodedGameRuleState.is_initialized,
      initializerAccountPubkey: new PublicKey(
        decodedGameRuleState.initializer_pubkey
      ),
      initializerMortgageAccountPubkey: new PublicKey(
        decodedGameRuleState.initializer_mortgage_token_account_pubkey
      ),
      initializerTokenToReceiveAccountPubkey: new PublicKey(
        decodedGameRuleState.initializer_token_to_receive_account_pubkey
      ),
    };

    const PDA = await PublicKey.findProgramAddress(
      [Buffer.from("escrow")],
      GAME_RULE_PROGRAM_ID
    );

    const exchangeInstruction = new TransactionInstruction({
      programId: GAME_RULE_PROGRAM_ID,
      data: Buffer.from(
        Uint8Array.of(1, ...new BN(DEFAULT_MORTGAGE_VALUE).toArray("le", 8))
      ),
      keys: [
        { pubkey: hostAccount.publicKey, isSigner: true, isWritable: false },
        {
          pubkey: hostSendingOrReiceiveTokenAccountAddress,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: gameRuleState.initializerMortgageAccountPubkey,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: gameRuleState.initializerAccountPubkey,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: gameRuleState.initializerTokenToReceiveAccountPubkey,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: gameRuleStateAccountPubkey,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: winnerPubkey, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: PDA[0], isSigner: false, isWritable: false },
      ],
    });

    const [initTokenBalance, hostTokenBalance] = await Promise.all([
      getTokenBalance(publicKey),
      getTokenBalance(hostAccountPubkey),
    ]);

    console.log("old balance", {
      player: initTokenBalance + DEFAULT_MORTGAGE_VALUE,
      host: hostTokenBalance,
    });

    await connection.sendTransaction(
      new Transaction().add(exchangeInstruction),
      [hostAccount],
      { skipPreflight: false, preflightCommitment: "confirmed" }
    );

    await sleepUtil(3000);

    setIsSpinning(false);

    if (
      (await connection.getAccountInfo(gameRuleStateAccountPubkey)) !== null
    ) {
      message.error("game rule account has not been closed");
      return;
    }

    if (
      (await connection.getAccountInfo(
        gameRuleState.initializerMortgageAccountPubkey
      )) !== null
    ) {
      message.error("initializer mortgage token account has not been closed");
      return;
    }

    const [newInitTokenBalance, newHostTokenBalance] = await Promise.all([
      getTokenBalance(publicKey),
      getTokenBalance(hostAccountPubkey),
    ]);

    console.log("new balance", {
      player: newInitTokenBalance,
      host: newHostTokenBalance,
    });
    setShowBackButton(true);
    showConfirm(initTokenBalance, newInitTokenBalance);
  };

  return (
    <Spin size="large" spinning={isSpinning}>
      <Row
        style={{ padding: 15, paddingTop: 50, paddingBottom: 50 }}
        justify="center"
      >
        <Col>
          <Radio.Group onChange={onWinnerChange} value={winnerID}>
            <Space direction="vertical">
              <Radio value={1}>Set host is winner</Radio>
              <Radio value={2}>Set player is winner</Radio>
            </Space>
          </Radio.Group>
          <Row>
            <Button
              style={{ marginTop: 10 }}
              onClick={startGame}
              type="primary"
            >
              Start game
            </Button>
          </Row>

          {showBackButton && (
            <Row>
              <Button
                style={{ marginTop: 10 }}
                onClick={() => navigate(-1)}
                danger
              >
                Get Back
              </Button>
            </Row>
          )}
        </Col>
      </Row>
    </Spin>
  );
};
