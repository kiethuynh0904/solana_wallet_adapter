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
  Tooltip,
  Popconfirm,
  Modal,
} from "antd";
import * as anchor from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import moment from "moment";

import {
  createPost,
  deleteLatestPost,
  deletePost,
  getAllPosts,
  getPostById,
  initFeedback,
  Post,
  updatePost,
} from "../../api/feedback";
import { maskedAddress } from "../../helper";
import { RootState } from "../../store";
import { connection, getProgram } from "../../utils";

const { Title, Text } = Typography;
const { TextArea } = Input;

export const FeedBackContainer: FC = () => {
  const [visible, setVisible] = useState(false);

  const anchorWallet = useAnchorWallet();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const user = useSelector((state: RootState) => state.auth.user);

  //updated post state
  const [editingPostKey, setEditingPostKey] = useState("");
  const [updatedTitle, setUpdatedTitle] = useState("");
  const [updatedContent, setUpdatedContent] = useState("");

  let navigate = useNavigate();

  const showModal = () => {
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  const onChangeUpdatedPost = (e, type: "title" | "content") => {
    console.log(e);
    if (type === "title") {
      setUpdatedTitle(e.target.value);
    } else if (type === "content") {
      setUpdatedContent(e.target.value);
    } else {
      return;
    }
  };

  const onFinish = async (values: any) => {
    if (!anchorWallet) {
      message.error("please connect your wallet!");
      return;
    }

    if (!user.id) {
      showModal();
      return;
    }

    setLoading(true);
    try {
      console.log("success", values);
      await createPost(
        anchorWallet,
        new PublicKey(user.id),
        values.title,
        values.content
      );
      // setLoading(false);
    } catch (error) {
      console.log("error", error);
      message.error("Your feedback was not sent!");
    } finally {
      form.resetFields();
      setLoading(false);
    }
  };

  const onUpdate = useCallback(async () => {
    if (!anchorWallet) {
      message.error("please connect your wallet!");
      return;
    }
    if (!(updatedTitle && updatedContent)) {
      message.warning("please do not empty input");
      return;
    }
    try {
      await updatePost(
        anchorWallet,
        new PublicKey(editingPostKey),
        updatedTitle,
        updatedContent
      );
      setEditingPostKey("");
    } catch (error) {
      console.log("updated error", error);
    }
  }, [updatedTitle, updatedContent, editingPostKey]);

  const onDeletePost = async (postId: string, nextPostId: string) => {
    if (!anchorWallet) {
      message.error("please connect your wallet!");
      return;
    }
    try {
      if (nextPostId) {
        await deletePost(anchorWallet, postId, nextPostId);
      } else {
        await deleteLatestPost(anchorWallet, postId);
      }
      message.success("deleted post");
    } catch (error) {
      console.log("delete error", error);
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

  useEffect(() => {
    let POST_EVENT_LISTENER: any;

    async function start() {
      if (anchorWallet) {
        const feedback: any = await initFeedback(
          anchorWallet,
          anchorWallet.publicKey
        );

        // initially load all the posts
        const [observer] = getAllPosts({
          anchorWallet,
          fromPostId: feedback.currentPostKey.toString(),
        });

        observer.subscribe({
          next(post) {
            setPosts((posts) => [...posts, post]);
          },
          complete() {
            // listen create/update/delete post events,
            // after fetching all posts
            const provider = new anchor.Provider(connection, anchorWallet, {});
            const program = getProgram(provider);

            POST_EVENT_LISTENER = program.addEventListener(
              "PostEvent",
              async (event) => {
                const postId = event?.postId?.toString();
                const nextPostId = event?.nextPostId?.toString();
                console.log("event", event);
                if (postId) {
                  switch (event.label) {
                    case "CREATE":
                      const post = await getPostById(anchorWallet, postId);

                      if (post) {
                        setPosts((posts) => [post, ...posts]);
                      }
                      break;

                    case "UPDATE":
                      const updatedPost = await getPostById(
                        anchorWallet,
                        postId
                      );
                      if (updatedPost) {
                        setPosts((posts) =>
                          posts.map((post) => {
                            if (post.id === postId) {
                              return updatedPost;
                            }
                            return post;
                          })
                        );
                      }
                      break;

                    case "DELETE":
                      console.log("run delete event");
                      const nextPost = nextPostId
                        ? await getPostById(anchorWallet, nextPostId)
                        : null;
                      setPosts((posts) =>
                        posts
                          .filter(({ id }) => id !== postId)
                          .map((post) => {
                            if (post.id === nextPostId && nextPost) {
                              return nextPost;
                            }

                            return post;
                          })
                      );
                      break;
                    default:
                      break;
                  }
                }
              }
            );
          },
        });
      }
    }

    start();

    return () => {
      if (anchorWallet && POST_EVENT_LISTENER) {
        const provider = new anchor.Provider(connection, anchorWallet, {});
        const program = getProgram(provider);

        program.removeEventListener(POST_EVENT_LISTENER).catch((e) => {
          console.log("error: ", e.message);
        });
      }
    };
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

  console.log("posts", posts);

  return (
    <Layout
      style={{
        background: "linear-gradient(to right,#bdcbf8, #8fdfce)",
        minHeight: "100vh",
      }}
    >
      <Modal
        title={<Title level={4}>Invalid user</Title>}
        visible={visible}
        onOk={() => {
          navigate("/");
        }}
        onCancel={hideModal}
        okText="Ok"
        cancelText="Cancel"
      >
        Do you want to sign up for sending feedback ?
      </Modal>
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
            style={{
              borderRadius: 8,
              backgroundColor: "#e6f4ff",
              marginBottom: 20,
            }}
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
          {posts.map(
            (
              {
                title,
                content,
                userId,
                id,
                prePostId,
                avatar,
                name,
                createdTime,
              },
              i
            ) => {
              const nextPostId = posts[i - 1]?.id;
              return (
                <Card
                  key={id.toString()}
                  bordered={true}
                  style={{
                    borderRadius: 8,
                    backgroundColor: "#e6f4ff",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    {avatar && (
                      <Avatar
                        src={avatar}
                        size={40}
                        style={{ backgroundColor: "#ffffff", marginRight: 4 }}
                      />
                    )}
                    <div>
                      <Title
                        style={{
                          marginBottom: 0,
                          marginTop: 0,
                          color: "#4b5563",
                        }}
                        level={5}
                      >
                        @{maskedAddress(userId)} -{" "}
                        <Text style={{ color: "#4b5563" }} strong>
                          ({name})
                        </Text>
                      </Title>
                      <Tooltip
                        title={moment(createdTime.toNumber() * 1000).format(
                          // convert second to ms
                          "YYYY-MM-DD HH:mm:ss"
                        )}
                      >
                        <span>
                          {moment(createdTime.toNumber() * 1000).fromNow()}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                  {editingPostKey === id.toString() ? (
                    <>
                      <Input
                        placeholder="Post title"
                        size="middle"
                        style={{ borderRadius: 8, marginBottom: 10 }}
                        defaultValue={title}
                        onChange={(e) => onChangeUpdatedPost(e, "title")}
                      />
                      <TextArea
                        showCount
                        placeholder="Input your feedback here"
                        maxLength={100}
                        defaultValue={content}
                        style={{
                          height: 60,
                          borderRadius: 8,
                          marginBottom: 10,
                        }}
                        onChange={(e) => onChangeUpdatedPost(e, "content")}
                      />
                    </>
                  ) : (
                    <>
                      <Title level={5}>{title}</Title>
                      <Text>{content}</Text>
                    </>
                  )}

                  {user.id === userId && (
                    <div>
                      {editingPostKey === id.toString() ? (
                        <>
                          <Button
                            type="text"
                            onClick={() => {
                              setEditingPostKey("");
                              setUpdatedTitle("");
                              setUpdatedContent("");
                            }}
                          >
                            <Text strong type="danger">
                              Cancel
                            </Text>
                          </Button>
                          <Button type="text" onClick={onUpdate}>
                            <Text strong style={{ color: "#31a8ed" }}>
                              Save
                            </Text>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Popconfirm
                            placement="bottom"
                            title="Are you sure？"
                            okText="Yes"
                            cancelText="No"
                            onConfirm={() => onDeletePost(id, nextPostId)}
                          >
                            <Button type="text">
                              <Text strong type="danger">
                                Delete
                              </Text>
                            </Button>
                          </Popconfirm>
                          <Button
                            type="text"
                            onClick={() => {
                              setEditingPostKey(id.toString());
                              setUpdatedTitle(title);
                              setUpdatedContent(content);
                            }}
                          >
                            <Text strong style={{ color: "#31a8ed" }}>
                              Edit
                            </Text>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            }
          )}
        </Col>
      </Row>
    </Layout>
  );
};
