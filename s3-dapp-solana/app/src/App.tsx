import React from "react";
import { Navigation } from "./router/Navigation";
import { SnackbarProvider } from "notistack";
import { SolanaWalletProvider } from "./providers/SolanaWalletProvider";
import { ToastContainer, toast } from "react-toastify";
import "@solana/wallet-adapter-react-ui/styles.css";
import "./App.less";

function App() {
  return (
    <SnackbarProvider>
      <SolanaWalletProvider>
        <Navigation />
          <ToastContainer
            theme="dark"
            position="bottom-left"
            autoClose={5000}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            style={{width:360}}
          />
      </SolanaWalletProvider>
    </SnackbarProvider>
  );
}

export default App;
