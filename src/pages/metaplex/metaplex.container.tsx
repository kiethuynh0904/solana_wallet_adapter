import React, { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { Connection } from "@metaplex/js";
import {
  MetadataData,
  Metadata,
} from "@metaplex-foundation/mpl-token-metadata";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import CardHeader from "@mui/material/CardHeader";
import { toast } from "react-toastify";
import NotificationToastify from "../../components/NotificationToastify";
import { defaultToastOptions } from "../../constants/toastifyOptions";

import {
  CardActionArea,
  CssBaseline,
  Grid,
  Container,
  Box,
  Avatar,
  CardActions,
  Button,
  Stack,
} from "@mui/material";
import axios from "axios";
import { IAwareNFT } from "./model/awareInterce";
import { CardSkeleton } from "../../components";
import { AccountAPI, NFT } from "../../api";
import { PublicKey } from "@solana/web3.js";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";

export const MetaplexContainer: FC = () => {
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;
  const connection = new Connection("devnet");
  const [ownedMetadata, setOwnedMetadata] = useState<MetadataData[]>([]);
  const [NFTList, setNFTList] = useState<IAwareNFT[]>([]);
  const [loading, setLoading] = useState(false);

  function fetchData(URL: any) {
    return axios
      .get(URL)
      .then((response) => response.data)
      .catch((error) => console.log(error));
  }

  const updateMetadata = () => {};

  const init = async () => {
    setLoading(true);
    try {
      const defaultAccount = AccountAPI.getDefaultAccount();

      const ownedMetadata = await Metadata.findDataByOwner(
        connection,
        defaultAccount.publicKey
      );

      const awareUri = await ownedMetadata.map((item) => item.data.uri);

      const ownedFullMetadata: IAwareNFT[] = await Promise.all(
        awareUri.map(fetchData)
      );

      console.log("ownedMetadata", ownedMetadata);
      console.log("ownedFullMetadata", ownedFullMetadata);

      if (ownedFullMetadata) {
        setNFTList(ownedFullMetadata);
        setOwnedMetadata(ownedMetadata);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = (symbol: string) => {
    if (!publicKey) {
      toast.error(
        <NotificationToastify message="Wallet not connected!" />,
        defaultToastOptions
      );
      // throw new WalletNotConnectedError();
      return;
    }

    let mint_string_address = ownedMetadata.find(
      (item) => item.data.symbol === symbol
    )?.mint;

    let mint_address = new PublicKey(mint_string_address || "");

    NFT.buyNFT(publicKey, mint_address, sendTransaction);
  };

  const NFTCardItem = ({ item }: { item: IAwareNFT }) => {
    return (
      <Card
        sx={{
          maxWidth: 345,
          bgcolor: "#282828",
          pr: 2,
          pl: 2,
          borderRadius: 2,
        }}
      >
        <CardHeader
          avatar={
            <Avatar
              alt="SOLANA"
              src="https://vectorlogo4u.com/wp-content/uploads/2021/09/solana-logo-vector-01.png"
              sx={{ width: 56, height: 56 }}
            />
          }
          title={
            <Typography
              sx={{
                fontSize: 18,
                color: "#ffffff",
                fontWeight: 600,
              }}
              component="div"
            >
              {item.symbol}
            </Typography>
          }
        ></CardHeader>
        <CardActionArea>
          <Box component="div" sx={{ bgcolor: "#333333", borderRadius: 3 }}>
            <CardMedia
              sx={{ borderRadius: 3 }}
              width={250}
              height={140}
              component="img"
              image={item.image}
              alt="failed"
            />
          </Box>

          <CardContent sx={{ height: 130 }}>
            <Typography
              gutterBottom
              sx={{
                fontSize: 24,
                color: "#ffffff",
                fontWeight: 600,
                display: "-webkit-box",
                overflow: "hidden",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 1,
              }}
              component="div"
            >
              {item.name}
            </Typography>
            <Typography
              gutterBottom
              sx={{
                fontSize: 16,
                color: "grey.500",
                fontWeight: 400,
                display: "-webkit-box",
                overflow: "hidden",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
              component="div"
            >
              {item?.description}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Typography
                sx={{
                  fontSize: 16,
                  color: "#fff",
                  fontWeight: 400,
                }}
                component="div"
              >
                0.49 SOL
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: "grey.500",
                  fontWeight: 400,
                }}
                component="div"
              >
                $73.68
              </Typography>
            </Stack>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button
            onClick={() => buyNFT(item.symbol)}
            variant="outlined"
            color="success"
            size="medium"
            sx={{ marginTop: 1 }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Buy
            </Typography>
          </Button>
        </CardActions>
      </Card>
    );
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ pt: 3, display: "flex" }}>
        <Grid container spacing={3}>
          {NFTList.map((item: IAwareNFT, index) => (
            <Grid key={index} item xs={6} lg={2.4} xl={2.4}>
              <NFTCardItem item={item} />
            </Grid>
          ))}
          {loading && <CardSkeleton displayNumber={10} />}
        </Grid>
      </Container>
    </>
  );
};
