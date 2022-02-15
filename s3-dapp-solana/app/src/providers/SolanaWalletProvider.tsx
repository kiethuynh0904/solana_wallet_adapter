import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  getLedgerWallet,
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletExtensionWallet,
  getSolletWallet,
  getTorusWallet,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import React, { FC, useCallback, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Navigation } from "../router/Navigation";
import { useNotify } from "../hooks/useNotification";
import { SnackbarProvider } from "notistack";

export const SolanaWalletProvider: FC = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const notify = useNotify();

  // @solana/wallet-adapter-wallets imports all the adapters but supports tree shaking --
  // Only the wallets you want to support will be compiled into your application
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      // getSlopeWallet(),
      // getSolflareWallet(),
      // getTorusWallet(),
      // getLedgerWallet(),
      getSolletWallet({ network }),
      // getSolletExtensionWallet({ network }),
    ],
    [network]
  );

  const onError = useCallback((error: WalletError) => {
    notify(
      "error",
      error.message ? `${error.name}: ${error.message}` : error.name
    );
  }, []);

  return (
    <SnackbarProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} onError={onError} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SnackbarProvider>
  );
};
