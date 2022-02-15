import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import CardHeader from "@mui/material/CardHeader";

import {
  Box,
  CardActionArea,
  CardActions,
  CssBaseline,
  Grid,
  Skeleton,
} from "@mui/material";
const CardSkeleton = ({ displayNumber = 5 }: { displayNumber?: number }) => {
  const list = Array(displayNumber);
  console.log("list", list);
  return (
    <>
      {[...list].map((item, index) => (
        <Grid key={index} item xs={6} lg={2.4} xl={2.4}>
          <Card
            sx={{
              maxWidth: 345,
              bgcolor: "#282828",
              padding: 2,
              borderRadius: 2,
            }}
          >
            <CardHeader
              avatar={
                <Skeleton
                  animation="wave"
                  variant="circular"
                  width={50}
                  height={50}
                  sx={{ bgcolor: "grey.800" }}
                />
              }
              title={
                <Skeleton
                  animation="wave"
                  height={15}
                  width="80%"
                  sx={{ bgcolor: "grey.800" }}
                />
              }
            />
            <CardActionArea>
              <Box component="div" sx={{ bgcolor: "#333333", borderRadius: 3 }}>
                <Skeleton
                  sx={{ height: 140, width: 250, bgcolor: "grey.800",borderRadius: 3 }}
                  animation="wave"
                  variant="rectangular"
                />
              </Box>
              <CardContent sx={{ height: 100 }}>
                <Skeleton
                  height={15}
                  style={{ marginBottom: 6 }}
                  sx={{ bgcolor: "grey.800" }}
                />
                <Skeleton
                  sx={{ bgcolor: "grey.800" }}
                  height={15}
                  width="80%"
                />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </>
  );
};

export default CardSkeleton;
