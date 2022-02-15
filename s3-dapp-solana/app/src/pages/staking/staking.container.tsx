import React, { FC, useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Button,
  Container,
  CssBaseline,
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import { Staking } from "../../api";
import NotificationToastify from "../../components/NotificationToastify";
import { defaultToastOptions } from "../../constants/toastifyOptions";
import { toast } from "react-toastify";
import { useCallback } from "react";

export const StakingContainer: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = wallet;
  const [stakeAmount, setStakeAmount] = useState(0);

  useEffect(() => {}, []);

  const handleChangeStakeAmount = (event: any) => {
    setStakeAmount(event.target.value);
  };

  const handleStake = useCallback(() => {
    if (!publicKey) {
      toast.error(
        <NotificationToastify message="Wallet not connected!" />,
        defaultToastOptions
      );
      return;
    }

    Staking.stakingConnection(publicKey, sendTransaction, stakeAmount);
  }, [stakeAmount, publicKey]);

  const handleStateOfStake = () => {
    Staking.getStakeActivation();
  };


  return (
    <Container maxWidth="sm">
      <Stack direction="column" spacing={2}>
        <TextField
          sx={{ marginTop: 2 }}
          fullWidth
          id="outlined-basic"
          label="amount"
          variant="outlined"
          value={stakeAmount}
          onChange={handleChangeStakeAmount}
          defaultValue={0}
          type="number"
        />
        <Button color="success" variant="contained" onClick={handleStake}>
          <Typography>Click to stake</Typography>
        </Button>

        <Button
          variant="contained"
          size="medium"
          color="info"
          onClick={handleStateOfStake}
        >
          <Typography>get state of staking</Typography>
        </Button>
      </Stack>
    </Container>
  );
};
