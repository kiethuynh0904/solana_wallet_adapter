import React, { FC, useEffect, useState, useCallback } from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import NotificationToastify from "../../components/NotificationToastify";
import { defaultToastOptions } from "../../constants/toastifyOptions";

import { getBalance, getTokenBalance } from "../../helper";

import { useNotify } from "../../hooks/useNotification";
import { TransactionAPI, AccountAPI } from "../../api";

const initialSOL = { sol: 0, xmt: 0 };

export const WithdrawContainer: FC = () => {
  const { publicKey } = useWallet();

  const [balance, setBalance] = useState(initialSOL);
  const [sendAmount, setSendAmount] = useState(0);
  const [customAddress, setCustomAddress] = useState("");
  const [checked, setChecked] = useState(false);
  const [symbolType, setSymbolType] = useState("SOL");

  useEffect(() => {
    const init = async () => {
      await TransactionAPI.establishConnection();

      await TransactionAPI.establishPayer();

      await TransactionAPI.checkProgram();
    };
    init();
    getAsyncBalance();
  }, []);

  async function getAsyncBalance() {
    const defaultAccount = AccountAPI.getDefaultAccount();
    const sol = await getBalance(defaultAccount.publicKey);
    const xmt = await getTokenBalance(defaultAccount.publicKey);
    setBalance({ sol, xmt });
  }

  const handleChange = (event: any) => {
    setSendAmount(event.target.value);
  };

  const handleChangeAdress = (event: any) => {
    setCustomAddress(event.target.value);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolType(event.target.value);
  };

  const handleChecked = (event: any) => {
    if (event.target.checked && publicKey?.toString()) {
      setCustomAddress(publicKey?.toString());
    } else {
      setCustomAddress("");
    }
    setChecked(event.target.checked);
  };

  const withdrawToWallet = useCallback(async () => {
    if (!publicKey) {
      toast.error(
        <NotificationToastify message="Wallet not connected!" />,
        defaultToastOptions
      );
      return;
    }
    if (symbolType === "SOL") {
      TransactionAPI.withdrawToWallet(publicKey, sendAmount).finally(() =>
        getAsyncBalance()
      );
    } else {
      TransactionAPI.withdrawTokenToWallet(publicKey, sendAmount).finally(() =>
        getAsyncBalance()
      );
    }
  }, [publicKey, sendAmount, symbolType]);

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">
        <Card sx={{ minWidth: 275, marginTop: 10 }}>
          <CardContent>
            <Typography gutterBottom variant="h5" textAlign="center">
              Withdraw
            </Typography>
            <FormControl fullWidth>
              <TextField
                value={customAddress}
                defaultValue=""
                fullWidth
                id="outlined-basic"
                disabled={checked}
                onChange={handleChangeAdress}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                label="address"
              />
              <FormControlLabel
                // value="start"
                control={
                  <Checkbox
                    inputProps={{}}
                    onChange={handleChecked}
                    checked={checked}
                    color="success"
                  />
                }
                label={
                  <Typography style={{ fontSize: 12, color: "#676767" }}>
                    use your connected wallet
                  </Typography>
                }
                labelPlacement="end"
              />

              <TextField
                id="outlined-select-currency"
                select
                value={symbolType}
                onChange={handleSelectChange}
                helperText="Please select your currency"
              >
                <MenuItem key="SOL" value="SOL">
                  SOL
                </MenuItem>
                <MenuItem key="XMT" value="XMT">
                  XMT
                </MenuItem>
              </TextField>

              <TextField
                sx={{ marginTop: 2 }}
                fullWidth
                id="outlined-basic"
                label="amount"
                variant="outlined"
                value={sendAmount}
                onChange={handleChange}
                defaultValue={0}
                type="number"
              />
              <Typography variant="body2" color="#33a382">
                {symbolType} available{" "}
                {symbolType === "SOL"
                  ? balance.sol.toFixed(4)
                  : balance.xmt.toFixed(4)}
              </Typography>
            </FormControl>
          </CardContent>
          <CardActions sx={{ marginBottom: 2 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={withdrawToWallet}
              disabled={!publicKey}
            >
              <Typography variant="body2" color="#fff">
                Apply
              </Typography>
            </Button>
          </CardActions>
        </Card>
      </Container>
    </React.Fragment>
  );
};
