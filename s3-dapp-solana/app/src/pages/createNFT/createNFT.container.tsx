import React, { FC, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Container from "@mui/material/Container";

import { mintNFT } from "../../utils/nftCreation";
import {
  Creator,
  IMetadataExtension,
  MetadataFile,
} from "../../model/metadata";
import {
  Upload,
  Typography,
  Button,
  Row,
  Col,
  Input,
  InputNumber,
  Spin,
  Card,
  Steps,
  message,
  Form,
  Space,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";

import { useWallet } from "@solana/wallet-adapter-react";
import { connection } from "../../utils";
// import { MetaDataJsonCategory } from "@metaplex/js";
import { PublicKey } from "@solana/web3.js";
import {
  LoadingOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import "antd/dist/antd.css";
import "./index.css";

const { Dragger } = Upload;
const { Text } = Typography;
const { Step } = Steps;

export const CreateNFTContainer: FC = () => {
  const wallet = useWallet();
  const { publicKey } = wallet;

  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverArtError, setCoverArtError] = useState<string>();
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [nftCreateProgress, setNFTcreateProgress] = useState<number>(0);

  const [form] = Form.useForm();

  const [attributes, setAttributes] = useState<IMetadataExtension>({
    name: "",
    symbol: "",
    description: "",
    external_url: "",
    image: "",
    animation_url: undefined,
    attributes: undefined,
    creators: [],
    seller_fee_basis_points: 0,
    properties: {
      files: [],
      category: "image",
    },
  });

  const setIconForStep = (currentStep: number, componentStep: number) => {
    if (currentStep === componentStep) {
      return <LoadingOutlined />;
    }
    return null;
  };

  const mintNFTHandler = async (nftAttributes:any) => {
    console.log("mintNFTHandler got called");

    if (!wallet || !publicKey) {
      message.error("Please connect your wallet!");
      return;
    }

    if (!coverFile) {
      message.error("Please enter your image!");
      return;
    }

    const ownerPublicKey = new PublicKey(publicKey).toBase58();
    const selfCreator = new Creator({
      address: ownerPublicKey,
      verified: true,
      share: 100,
    });
    const metadata = {
      name: attributes.name,
      symbol: attributes.symbol,
      creators: [selfCreator],
      description: attributes.description,
      sellerFeeBasisPoints: 0,
      image: coverFile?.name,
      attributes: nftAttributes ? nftAttributes : undefined,
      animation_url: "",
      external_url: "",
      properties: {
        files: attributes.properties.files,
        category: attributes.properties?.category,
      },
    };

    console.log('metadata',metadata)
    
    try {
      setIsSpinning(true);
      await mintNFT(
        connection,
        wallet,
        "devnet",
        [coverFile],
        metadata,
        setNFTcreateProgress
      );

      message.success("NFT created successfully");
    } catch (e) {
      setIsSpinning(false);
    } finally {
      setIsSpinning(false);
    }
  };

  const handlerChange = (e: any) => {
    console.log("e", e);
  };

  return (
    <>
      <Spin
        size="large"
        spinning={isSpinning}
        tip={
          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Card className="dark-card">
              <Steps direction="vertical" current={nftCreateProgress}>
                <Step
                  className={"white-description"}
                  title="Minting"
                  description="Starting Mint Process"
                  icon={setIconForStep(nftCreateProgress, 0)}
                />
                <Step
                  className={"white-description"}
                  title="Preparing Assets"
                  icon={setIconForStep(nftCreateProgress, 1)}
                />
                <Step
                  className={"white-description"}
                  title="Signing Metadata Transaction"
                  description="Approve the transaction from your wallet"
                  icon={setIconForStep(nftCreateProgress, 2)}
                />
                <Step
                  className={"white-description"}
                  title="Sending Transaction to Solana"
                  description="This will take a few seconds."
                  icon={setIconForStep(nftCreateProgress, 3)}
                />
                <Step
                  className={"white-description"}
                  title="Waiting for Initial Confirmation"
                  icon={setIconForStep(nftCreateProgress, 4)}
                />
                <Step
                  className={"white-description"}
                  title="Waiting for Final Confirmation"
                  icon={setIconForStep(nftCreateProgress, 5)}
                />
                <Step
                  className={"white-description"}
                  title="Uploading to Arweave"
                  icon={setIconForStep(nftCreateProgress, 6)}
                />
                <Step
                  className={"white-description"}
                  title="Updating Metadata"
                  icon={setIconForStep(nftCreateProgress, 7)}
                />
                <Step
                  className={"white-description"}
                  title="Signing Token Transaction"
                  description="Approve the final transaction from your wallet"
                  icon={setIconForStep(nftCreateProgress, 8)}
                />
              </Steps>
            </Card>
          </div>
        }
      >
        <Row
          style={{ padding: 15, paddingTop: 50, paddingBottom: 50 }}
          justify="space-around"
        >
          <Col span={24} xs={8} lg={10} md={10}>
            <Dragger
              accept=".png,.jpg,.gif,.mp4,.svg"
              style={{
                padding: 20,
                background: "rgba(255, 255, 255, 0.08)",
                maxHeight: 300,
              }}
              multiple={false}
              fileList={coverFile ? [coverFile as any] : []}
              customRequest={(info) => {
                // dont upload files here, handled outside of the control
                info?.onSuccess?.({}, null as any);
              }}
              onChange={async (info) => {
                const file = info.file.originFileObj;
                console.log("file", file);
                if (!file) {
                  return;
                }

                const sizeKB = file.size / 1024;

                if (sizeKB < 25) {
                  setCoverArtError(
                    `The file ${file.name} is too small. It is ${
                      Math.round(10 * sizeKB) / 10
                    }KB but should be at least 25KB.`
                  );
                  return;
                }
                setAttributes({
                  ...attributes,
                  properties: {
                    ...attributes.properties,
                    files: [file].map((f) => {
                      console.log(f, typeof f);
                      const uri = typeof f === "string" ? f : f?.name || "";
                      const type =
                        typeof f === "string" || !f
                          ? "unknown"
                          : f.type || "unknown";
                      return {
                        uri,
                        type,
                      } as MetadataFile;
                    }),
                  },
                });

                setCoverFile(file);
                setCoverArtError(undefined);
              }}
              onDrop={(e) => {
                console.log("Dropped files", e.dataTransfer.files);
              }}
            >
              <div className="ant-upload-drag-icon">
                <h3 style={{ fontWeight: 700 }}>
                  Upload your cover image (PNG, JPG, GIF, SVG)
                </h3>
              </div>
              {coverArtError ? (
                <Text type="danger">{coverArtError}</Text>
              ) : (
                <p className="ant-upload-text" style={{ color: "#6d6d6d" }}>
                  Drag and drop, or click to browse
                </p>
              )}
            </Dragger>
          </Col>
          <Col className="section" span={24} xs={16} lg={12} md={12}>
            <label className="action-field">
              <span className="field-title">Title</span>
              <Input
                autoFocus
                className="input"
                style={{
                  borderRadius: 8,
                  padding: 10,
                }}
                placeholder="Max 50 characters"
                maxLength={50}
                allowClear
                value={attributes.name}
                onChange={(info) =>
                  setAttributes({
                    ...attributes,
                    name: info.target.value,
                  })
                }
              />
            </label>
            <label className="action-field">
              <span className="field-title">Symbol</span>
              <Input
                className="input"
                placeholder="Max 10 characters"
                maxLength={10}
                allowClear
                style={{
                  borderRadius: 8,
                  padding: 10,
                }}
                value={attributes.symbol}
                onChange={(info) =>
                  setAttributes({
                    ...attributes,
                    symbol: info.target.value,
                  })
                }
              />
            </label>

            <label className="action-field">
              <span className="field-title">Description</span>
              <Input.TextArea
                className="input textarea"
                placeholder="Max 500 characters"
                maxLength={500}
                style={{
                  borderRadius: 8,
                  padding: 10,
                  minHeight: 100,
                }}
                value={attributes.description}
                onChange={(info) =>
                  setAttributes({
                    ...attributes,
                    description: info.target.value,
                  })
                }
                allowClear
              />
            </label>
            <label className="action-field">
              <span className="field-title">Maximum Supply</span>
              <InputNumber
                placeholder="Quantity"
                style={{
                  borderRadius: 8,
                  padding: 10,
                  width: "100%",
                  height: 50,
                  display: "flex",
                }}
                onChange={(val: number) => {
                  setAttributes({
                    ...attributes,
                    properties: {
                      ...attributes.properties,
                      maxSupply: val,
                    },
                  });
                }}
                className="royalties-input"
              />
            </label>
            <label className="action-field">
              <span className="field-title">Attributes</span>
            </label>
            <Form
              onChange={handlerChange}
              name="dynamic_attributes"
              form={form}
              autoComplete="off"
            >
              <Form.List name="attributes">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name }) => (
                      <Space key={key} align="baseline">
                        <Form.Item name={[name, "trait_type"]} hasFeedback>
                          <Input placeholder="trait_type (Optional)" />
                        </Form.Item>
                        <Form.Item
                          name={[name, "value"]}
                          rules={[{ required: true, message: "Missing value" }]}
                          hasFeedback
                        >
                          <Input placeholder="value" />
                        </Form.Item>
                        <Form.Item name={[name, "display_type"]} hasFeedback>
                          <Input placeholder="display_type (Optional)" />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                      >
                        Add attribute
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form>
          </Col>
        </Row>
        <Row justify="center">
          <Button
            size="large"
            style={{ width: "95%" }}
            onClick={() => {
             
              form.validateFields().then((values) => {
                let nftAttributes = values.attributes;
                // value is number if possible
                for (const nftAttribute of nftAttributes || []) {
                  const newValue = Number(nftAttribute.value);
                  if (!isNaN(newValue)) {
                    nftAttribute.value = newValue;
                  }
                }
                console.log("Adding NFT attributes:", nftAttributes);
                setAttributes({
                  ...attributes,
                  attributes: nftAttributes,
                });
                mintNFTHandler(nftAttributes);
              });     
            }}
            type="primary"
          >
            Mint NFT
          </Button>
        </Row>
      </Spin>
    </>
  );
};
