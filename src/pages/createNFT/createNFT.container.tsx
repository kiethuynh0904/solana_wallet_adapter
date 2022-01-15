import React, { FC } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import Grid from "@mui/material/Grid";
import { Stack } from "@mui/material";
// import { MetaDataJsonCategory } from "@metaplex/js";

const steps = [
  {
    label: "Select campaign settings",
  },
  {
    label: "Create an ad group",
  },
  {
    label: "Create an ad",
  },
];

export const CreateNFTContainer: FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const Item = styled(Paper)(({ theme }) => ({
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  }));

  // const CategoryStep = (props: {
  //   confirm: (category: MetadataCategory) => void;
  // }) => {
  //   const { width } = useWindowDimensions();
  //   return (
  //     <>
  //       <Stack className="call-to-action" direction="row">
  //         <h2>Create a new item</h2>
  //         <p>
  //           First time creating on Metaplex?{" "}
  //           <a href="#">Read our creators’ guide.</a>
  //         </p>
  //       </Stack>
  //       <Stack>
  //         <Stack direction="row">
  //           <Button
  //             className="type-btn"
  //             size="large"
  //             onClick={() => props.confirm(MetadataCategory.Image)}
  //           >
  //             <div>
  //               <div>Image</div>
  //               <div className="type-btn-description">JPG, PNG, GIF</div>
  //             </div>
  //           </Button>
  //         </Stack>
  //         <Stack direction="row">
  //           <Button
  //             className="type-btn"
  //             size="large"
  //             onClick={() => props.confirm(MetadataCategory.Video)}
  //           >
  //             <div>
  //               <div>Video</div>
  //               <div className="type-btn-description">MP4, MOV</div>
  //             </div>
  //           </Button>
  //         </Stack>
  //         <Stack direction="row">
  //           <Button
  //             className="type-btn"
  //             size="large"
  //             onClick={() => props.confirm(MetadataCategory.Audio)}
  //           >
  //             <div>
  //               <div>Audio</div>
  //               <div className="type-btn-description">MP3, WAV, FLAC</div>
  //             </div>
  //           </Button>
  //         </Stack>
  //         <Stack direction="row">
  //           <Button
  //             className="type-btn"
  //             size="large"
  //             onClick={() => props.confirm(MetadataCategory.VR)}
  //           >
  //             <div>
  //               <div>AR/3D</div>
  //               <div className="type-btn-description">GLB</div>
  //             </div>
  //           </Button>
  //         </Stack>
  //         <Stack direction="row">
  //           <Button
  //             className="type-btn"
  //             size="large"
  //             onClick={() => props.confirm(MetadataCategory.HTML)}
  //           >
  //             <div>
  //               <div>HTML Asset</div>
  //               <div className="type-btn-description">HTML</div>
  //             </div>
  //           </Button>
  //         </Stack>
  //       </Stack>
  //     </>
  //   );
  // };

  return (
    <React.Fragment>
      <CssBaseline />
      <Container maxWidth="xl">
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Item>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        index === 2 ? (
                          <Typography variant="caption">Last step</Typography>
                        ) : null
                      }
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Item>
          </Grid>
          <Grid item xs={8}>
            <Item>
              {/* {step === 0 && (
                <CategoryStep
                  confirm={(category: MetaDataJsonCategory) => {
                    setAttributes({
                      ...attributes,
                      properties: {
                        ...attributes.properties,
                        category,
                      },
                    });
                    gotoStep(1);
                  }}
                />
              )} */}
            </Item>
          </Grid>
        </Grid>
      </Container>
    </React.Fragment>
  );
};
