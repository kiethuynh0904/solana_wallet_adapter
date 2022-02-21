import React, { FC, useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Avatar,
  message,
  Card,
  Layout,
} from "antd";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { createPost, initFeedback } from "../../api/feedback";

const { Title, Text } = Typography;
const { TextArea } = Input;

export const FeedBackContainer: FC = () => {
  const anchorWallet = useAnchorWallet();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  console.log("formRef", form);

  const onFinish = async (values: any) => {
    if (!anchorWallet) {
      message.error("please connect your wallet!");
      return;
    }
    if (!(values.title || values.content)) {
      message.warning("please do not empty input");
      return;
    }
    setLoading(true);
    try {
      console.log("success", values);
      await createPost(anchorWallet, values.title, values.content);
      // setLoading(false);
    } catch (error) {
      message.error("Your feedback was not sent!");
    } finally {
      form.resetFields();
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    if (anchorWallet) {
      initFeedback(anchorWallet, anchorWallet.publicKey);
    }
  }, [anchorWallet]);

  if (!anchorWallet) {
    return (
      <Row
        style={{ padding: 15, paddingTop: 50, paddingBottom: 50 }}
        justify="space-around"
      >
        <Col span={24} xs={8} lg={10} md={10}>
          <Title level={1}>Please connect your wallet first</Title>
        </Col>
      </Row>
    );
  }

  return (
    <Layout
      style={{
        height: "100vh",
        background: "linear-gradient(to right,#bdcbf8, #8fdfce)",
      }}
    >
      <Row
        style={{
          padding: 15,
          paddingTop: 50,
          paddingBottom: 50,
        }}
        justify="space-around"
      >
        <Col span={24} xs={8} lg={10} md={10}>
          <Card
            bordered={true}
            style={{ borderRadius: 8, backgroundColor: "#e6f4ff" }}
          >
            <Form
              name="post"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              form={form}
            >
              <Form.Item
                name="title"
                rules={[
                  { required: true, message: "Please input your title!" },
                ]}
              >
                <Input
                  placeholder="Post title"
                  size="middle"
                  style={{ borderRadius: 8, marginBottom: 10 }}
                />
              </Form.Item>
              <Form.Item
                name="content"
                rules={[
                  { required: true, message: "Feedback can not be empty!" },
                ]}
              >
                <TextArea
                  showCount
                  placeholder="Input your feedback here"
                  maxLength={100}
                  style={{ height: 60, borderRadius: 8, marginBottom: 10 }}
                />
              </Form.Item>
              <Button
                size="middle"
                type="primary"
                style={{
                  width: "100%",
                  backgroundColor: "#7f8df5",
                  borderColor: "#7c8ef3",
                }}
                loading={loading}
                htmlType="submit"
              >
                <Text strong style={{ color: "#ffffff" }}>
                  Post
                </Text>
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
