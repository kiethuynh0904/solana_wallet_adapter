import React, { FC } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";


import { Stack } from "@mui/material";
import { RequestAirdropBtn } from "../../components/RequestAirdropBtn";

export const SettingContainer: FC = () => {
  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="sm">
        <Stack
          sx={{ minWidth: 275, marginTop: 10, justifyContent: "center" }}
          direction="row"
          spacing={2}
        >
          <RequestAirdropBtn />
        </Stack>
      </Container>
    </React.Fragment>
  );
};
