
import React, { FC } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { HomeContainer } from "../pages/home/home.container";
import { WalletContainer } from "../pages/wallet/wallet.container";
import { WithdrawContainer } from "../pages/withdraw/withdraw.container";
import { DepositContainer } from "../pages/deposit/deposit.container";
import { SettingContainer } from "../pages/settings/setting.container";
import { CreateNFTContainer } from "../pages/createNFT/createNFT.container";
import { MetaplexContainer } from "../pages/metaplex/metaplex.container";
import { StakingContainer } from "../pages/staking/staking.container";
import { AuctionContainer } from "../pages/auction/auction.container";


import { Error } from "../pages/error/error.container";
import { Navbar } from "../components";

export const Navigation: FC = () => {

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeContainer />} />
        <Route path="/wallet" element={<WalletContainer />}>
          <Route path="withdraw" element={<WithdrawContainer />} />
          <Route path="deposit" element={<DepositContainer />} />
        </Route>
        <Route path="/settings" element={<SettingContainer />} />
        <Route path="/staking" element={<StakingContainer />} />
        <Route path="/createNFT/:step" element={<CreateNFTContainer />} />
        <Route path="/metaplex" element={<MetaplexContainer />} />
        <Route path="/auction" element={<AuctionContainer />} />
        <Route path="*" element={<Error />} />
      </Routes>
      <Outlet />
    </Router>
  );
};