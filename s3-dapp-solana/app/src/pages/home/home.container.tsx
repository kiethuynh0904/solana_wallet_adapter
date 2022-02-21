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
} from "antd";
import { fetchUser, signup, User } from "../../api/auth";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useSelector, useDispatch } from "react-redux";
import { saveUser } from "../../slices/authSlice";
import { RootState } from "../../store";

const { Title } = Typography;

export const HomeContainer: FC = () => {
  const anchorWallet = useAnchorWallet();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const onFinish = async (values: any) => {
    if (!anchorWallet) {
      return;
    }
    await signup(anchorWallet, anchorWallet.publicKey, values.username);
    getUser();
    message.success("sign up success!!!");
  };

  const onFinishFailed = (errorInfo: any) => {
    message.error(`Failed: ${errorInfo}`);
  };

  const getUser = async () => {
    if (!anchorWallet) {
      return;
    }
    const user = await fetchUser(anchorWallet);
    dispatch(saveUser(user));
  };

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
    <Row
      style={{ padding: 15, paddingTop: 50, paddingBottom: 50 }}
      justify="space-around"
    >
      <Col span={24} xs={8} lg={10} md={10}>
        {user.name ? (
          <Title level={1}>Welcome back {user.name}, Have a good day ❤️</Title>
        ) : (
          <>
            <Title level={2}>Sign Up</Title>
            <Form
              name="basic"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              layout="vertical"
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: "Please input your username!" },
                ]}
              >
                <Input />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Signup
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Col>
    </Row>
  );
};
