import React from "react";
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { makeStyles, ThemeProvider } from "@mui/styles";
import { Link, NavLink, useResolvedPath, useMatch } from "react-router-dom";
import type { LinkProps } from "react-router-dom";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import DrawerComponent from "./Drawer";

const useStyles = makeStyles((theme) => ({
  navlinks: {
    display: "flex",
    flexGrow: "1",
    justifyContent: "center",
  },
  logo: {
    // flexGrow: "1",
    cursor: "pointer",
  },
  link: {
    textDecoration: "none",
    color: "#828693",
    fontSize: "20px",
    marginLeft: 50,
    transition: "all 0.3s ease 0s",
    "&:hover": {
      color: "#fff",
    },
  },
}));

function Navbar() {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const CustomLink = ({ children, to, ...props }: LinkProps) => {
    let resolved = useResolvedPath(to);
    let match = useMatch({ path: resolved.pathname, end: true });

    return (
      <div>
        <Link
          style={{ color: match ? "#ffffff" : "#828693" }}
          to={to}
          className={classes.link}
          {...props}
        >
          {children}
        </Link>
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" sx={{ backgroundColor: "#131a35" }}>
        <CssBaseline />
        <Toolbar>
          <Typography variant="h4" color="#ffffff" className={classes.logo}>
            S3Corp
          </Typography>

          <div className={classes.navlinks}>
            <CustomLink to="/wallet">Wallet</CustomLink>
            <CustomLink to="/settings">Settings</CustomLink>
            <CustomLink to="/createNFT/0">Create NFT</CustomLink>
            <CustomLink to="/staking">Staking</CustomLink>
            <CustomLink to="/metaplex">Market</CustomLink>
            <CustomLink to="/gameplay">Gameplay</CustomLink>
          </div>
          <WalletMultiButton />
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}
export default Navbar;
