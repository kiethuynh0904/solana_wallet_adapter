import React, { FC } from "react";

import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";

import { Stack } from "@mui/material";
import { useNavigate, Outlet, useLocation } from "react-router-dom";

export const WalletContainer: FC = () => {
  let navigate = useNavigate();
  const { pathname } = useLocation();

  console.log("pathname", pathname);

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">
        <Stack
          sx={{ minWidth: 275, marginTop: 10, justifyContent: "center" }}
          direction="row"
          spacing={2}
        >
          <Button
            variant={pathname === "/wallet/withdraw" ? "contained" : "outlined"}
            onClick={() => navigate("withdraw")}
          >
            Withdraw
          </Button>
          <Button
            variant={pathname === "/wallet/deposit" ? "contained" : "outlined"}
            onClick={() => navigate("deposit")}
          >
            Deposit
          </Button>
        </Stack>
      </Container>
      <Outlet />
    </React.Fragment>
  );
};
