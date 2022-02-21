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

import { MenuItem, Stack, TextField } from "@mui/material";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { maskedAddress } from "../../helper";

import { TransactionAPI, AccountAPI } from "../../api";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useSolanaBalance } from "../../hooks/useSolanaBalance";

export const DepositContainer: FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const { balance } = useSolanaBalance();
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [symbolType, setSymbolType] = useState("SOL");

  const user = useSelector((state: RootState) => state.auth.user);

  console.log("balance", balance);

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
    );
  }, [publicKey, depositAmount, connection, sendTransaction]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolType(event.target.value);
  };

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
        <Card sx={{ minWidth: 250, marginTop: 10 }}>
          <Stack
            sx={{ justifyContent: "center", alignItems: "center" }}
            direction="row"
          >
            <CardContent style={{ width: "45%" }}>
              <QRCode
                value={publicKey?.toString() || ""}
                style={{ width: "100%", height: 200 }}
              />
              <Stack direction="row" spacing={1} marginTop={2}>
                <TextField
                  id="outlined-read-only-input"
                  label="your address"
                  value={maskedAddress(publicKey?.toString() || "")}
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
                    text={publicKey?.toString() || ""}
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
                {balance.sol
                  ? "Solana: " + balance.sol.toFixed(5) + " SOL"
                  : "Loading.."}
              </Typography>
              <Typography textAlign="center" color="#33a382">
                {balance.xmt
                  ? "X-Mas Token:" + balance.xmt + " XMT"
                  : "Loading.."}
              </Typography>
              {/* 
              <TextField
                id="outlined-select-currency"
                select
                value={symbolType}
                onChange={handleSelectChange}
                helperText="Please select your currency want to deposit"
              >
                <MenuItem key="SOL" value="SOL">
                  SOL
                </MenuItem>
                <MenuItem key="XMT" value="XMT">
                  XMT
                </MenuItem>
              </TextField>
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
              /> */}

              {/* <CardActions sx={{ marginBottom: 2 }}>
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
              </CardActions> */}
            </CardContent>
          </Stack>
        </Card>
      </Container>
    </React.Fragment>
  );
};
