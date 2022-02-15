import React, { FC, useEffect, useState, useCallback } from "react";
import QRCode from "react-qr-code";

import { toast } from "react-toastify";
import NotificationToastify from "../../components/NotificationToastify";
import { defaultToastOptions } from "../../constants/toastifyOptions";

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { Stack, TextField } from "@mui/material";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { getBalance, maskedAddress, getTokenBalance } from "../../helper";

import { TransactionAPI, AccountAPI } from "../../api";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useSolanaDefaultAccount } from "../../hooks/useSolanaDefaultAccount";

const initialSOL = 0;

export const DepositContainer: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const { account,transactions } = useSolanaDefaultAccount();

  console.log("account", account);

  const [defaultAccount, setDefaultAccount] = useState<Keypair>();
  const [balance, setBalance] = useState(initialSOL);
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);

  useEffect(() => {
    getAsyncBalance();
  }, []);

  const depositFromWallet = useCallback(() => {
    if (!publicKey) {
      toast.error(
        <NotificationToastify message="Wallet not connected!" />,
        defaultToastOptions
      );
      return;
    }
    TransactionAPI.depositFromWallet(
      publicKey,
      depositAmount,
      connection,
      sendTransaction
    ).finally(() => getAsyncBalance());
  }, [publicKey, depositAmount, connection, sendTransaction]);

  async function getAsyncBalance() {
    const account = AccountAPI.getDefaultAccount();
    if (!defaultAccount) {
      setDefaultAccount(account);
    }
    const sol = await getBalance(account.publicKey);
    const xmt = await getTokenBalance(account.publicKey);
    setBalance(sol);
  }

  const handleChange = (event: any) => {
    setDepositAmount(event.target.value);
  };

  const handleCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">
        <Card sx={{ minWidth: 240, marginTop: 10 }}>
          <Stack
            sx={{ justifyContent: "center", alignItems: "center" }}
            direction="row"
          >
            <CardContent style={{ width: "50%" }}>
              <QRCode
                value={publicKey?.toString() || ""}
                style={{ width: "100%", height: 200 }}
              />
              <Stack direction="row" spacing={1} marginTop={2}>
                <TextField
                  id="outlined-read-only-input"
                  label="your address"
                  value={maskedAddress(
                    defaultAccount?.publicKey?.toString() || ""
                  )}
                  defaultValue=""
                  style={{ width: 190 }}
                  InputProps={{
                    readOnly: true,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <Stack justifyContent="center" alignItems="center">
                  <CopyToClipboard
                    text={defaultAccount?.publicKey.toString() || ""}
                    onCopy={handleCopied}
                  >
                    <Tooltip title={copied ? "Copied" : "Copy"}>
                      <IconButton>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                </Stack>
              </Stack>
            </CardContent>
            <CardContent>
              <Typography variant="h5" textAlign="center">
                Your balance!
              </Typography>
              <Typography textAlign="center" color="#33a382">
                {account
                  ? account.lamports / LAMPORTS_PER_SOL + " SOL"
                  : "Loading.."}
              </Typography>
              <TextField
                sx={{ marginTop: 5 }}
                fullWidth
                id="outlined-basic"
                label="amount"
                helperText="Fast deposit with your connected wallet"
                variant="outlined"
                value={depositAmount}
                onChange={handleChange}
                defaultValue={0}
                type="number"
              />
              <CardActions sx={{ marginBottom: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  disabled={!publicKey}
                  onClick={depositFromWallet}
                >
                  <Typography variant="body2" color="#fff">
                    Apply
                  </Typography>
                </Button>
              </CardActions>
            </CardContent>
          </Stack>
        </Card>
      </Container>
    </React.Fragment>
  );
};
