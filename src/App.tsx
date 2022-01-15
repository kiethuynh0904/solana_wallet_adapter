import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { Navigation } from "./router/Navigation";
import { SnackbarProvider } from "notistack";
import { SolanaWalletProvider } from "./providers/SolanaWalletProvider";
import { ThemeProvider } from "@mui/styles";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LaunchIcon from "@material-ui/icons/Launch";
import { Link, makeStyles } from "@material-ui/core";
import NotificationToastify from "./components/NotificationToastify";

require("@solana/wallet-adapter-react-ui/styles.css");

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
