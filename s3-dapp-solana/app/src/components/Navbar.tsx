import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  CssBaseline,
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
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import DrawerComponent from "./Drawer";
import { Typography, Avatar, Popover, Button, Form, Input } from "antd";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { clearUser, saveUser } from "../slices/authSlice";
import { Provider } from "@project-serum/anchor";
import { connection, getProgram } from "../utils";
import { fetchUser, updateUser } from "../api/auth";

const { Title, Text } = Typography;

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
  const user = useSelector((state: RootState) => state.auth.user);
  const anchorWallet = useAnchorWallet();
  const { connected, connecting, disconnecting } = useWallet();
  const dispatch = useDispatch();
  const [popoverVisible, setPopoverVisible] = useState(false);

  const onFinish = async (values: any) => {
    if (!anchorWallet) {
      return;
    }
    await updateUser(anchorWallet, anchorWallet.publicKey, values.username);
    setPopoverVisible(false);
    await getUser();
  };

  const handleVisibleChange = (visible) => {
    setPopoverVisible(visible);
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };
  const content = (
    <Form
      autoComplete="off"
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item name="username">
        <Input style={{ width: 200 }} placeholder="enter your new username" />
      </Form.Item>
      <Form.Item>
        <Button style={{ width: "100%" }} type="primary" htmlType="submit">
          Update
        </Button>
      </Form.Item>
    </Form>
  );

  const getUser = async () => {
    if (!anchorWallet) {
      return;
    }
    const user = await fetchUser(anchorWallet);
    dispatch(saveUser(user));
  };

  useEffect(() => {
    if (connected) {
      getUser();
    }
  }, [connected]);

  useEffect(() => {
    if (disconnecting) {
      dispatch(clearUser());
    }
  }, [disconnecting]);

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
          <Title
            level={2}
            style={{ color: "#ffffff" }}
            className={classes.logo}
          >
            S3Corp
          </Title>

          <div className={classes.navlinks}>
            <CustomLink to="/wallet">Wallet</CustomLink>
            <CustomLink to="/settings">Settings</CustomLink>
            <CustomLink to="/createNFT/0">Create NFT</CustomLink>
            <CustomLink to="/staking">Staking</CustomLink>
            <CustomLink to="/metaplex">Market</CustomLink>
            <CustomLink to="/gameplay">Gameplay</CustomLink>
            <CustomLink to="/feedback">Feedback</CustomLink>
          </div>
          <>
            {user && (
              <div style={{ marginRight: 5 }}>
                <Avatar
                  src={user.avatar}
                  size={40}
                  style={{ backgroundColor: "#ffffff" }}
                />
                <Popover
                  onVisibleChange={handleVisibleChange}
                  visible={popoverVisible}
                  placement="bottom"
                  content={content}
                  trigger="click"
                >
                  <Button type="text">
                    <Text
                      strong
                      style={{
                        color: "#ffffff",
                        textAlign: "center",
                        marginLeft: 5,
                      }}
                    >
                      {user.name}
                    </Text>
                  </Button>
                </Popover>
              </div>
            )}
            <WalletMultiButton />
          </>
        </Toolbar>
      </AppBar>
    </ThemeProvider>
  );
}
export default Navbar;
