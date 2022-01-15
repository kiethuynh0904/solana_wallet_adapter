import { Button } from "@material-ui/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, TransactionSignature } from "@solana/web3.js";
import { FC, useCallback } from "react";
import { useNotify } from "../hooks/useNotification";
import { toast } from "react-toastify";
import NotificationToastify from "../components/NotificationToastify";
import { defaultToastOptions } from "../constants/toastifyOptions";

export const RequestAirdropBtn: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  console.log("publicKey", !publicKey);
  const notify = useNotify();

  const onClick = useCallback(async () => {
    if (!publicKey) {
      toast.error(
        <NotificationToastify message="Wallet not connected!" />,
        defaultToastOptions
      );
      return;
    }

    let signature: TransactionSignature = "";
    try {
      signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      toast.info(
        <NotificationToastify
          signature={signature}
          message="Airdrop requested"
        />,
        defaultToastOptions
      );
      await connection.confirmTransaction(signature, "processed");
      toast.success(
        <NotificationToastify
          signature={signature}
          message="Airdrop successful!"
        />,
        defaultToastOptions
      );
    } catch (error: any) {
      toast.error(
        <NotificationToastify
          signature={signature}
          message={`Airdrop failed! ${error?.message}`}
        />,
        defaultToastOptions
      );
    }
  }, [publicKey, notify, connection]);

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={onClick}
      disabled={!publicKey}
    >
      Request Airdrop
    </Button>
  );
};
