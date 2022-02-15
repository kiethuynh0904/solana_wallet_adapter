import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AccountInfo, ConfirmedSignatureInfo } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { AccountAPI } from "../api";

export function useSolanaDefaultAccount() {
  const [account, setAccount] = useState<AccountInfo<Buffer> | null>(null);
  const [transactions, setTransactions] = useState<
    ConfirmedSignatureInfo[] | null
  >(null);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const init = useCallback(async () => {
    console.log("run init");
    if (publicKey) {
      const account = AccountAPI.getDefaultAccount();

      let acc = await connection.getAccountInfo(account.publicKey);
      setAccount(acc);
      let transactions = await connection.getConfirmedSignaturesForAddress2(
        publicKey,
        {
          limit: 10,
        }
      );
      setTransactions(transactions);
    }
  }, [publicKey, connection]);

  let myInterval;
  useEffect(() => {
    console.log("publicKey", publicKey);
    if (publicKey) {
      myInterval = setInterval(init, 2000);
    }
    return () => clearInterval(myInterval);
  }, [init, publicKey]);

  return { account, transactions };
}
