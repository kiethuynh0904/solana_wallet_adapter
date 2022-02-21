import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { getBalance, getTokenBalance, getUserKey } from "../helper";

const initialSOL = { sol: 0, xmt: 0 };
export function useSolanaBalance() {
  const [balance, setBalance] = useState(initialSOL);

  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const init = useCallback(async () => {
    if (publicKey) {
      // const userAccount = getUserKey(publicKey);
      const sol = await getBalance(publicKey);
      const xmt = await getTokenBalance(publicKey);
      setBalance({ sol, xmt });
    }
  }, [publicKey, connection]);

  let myInterval;
  useEffect(() => {
    if (publicKey) {
      myInterval = setInterval(init, 1000);
    }
    return () => clearInterval(myInterval);
  }, [init, publicKey]);

  return { balance };
}
