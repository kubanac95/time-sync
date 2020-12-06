import React, { useState } from "react";

import firebase from "firebase";

import { Link } from "react-router-dom";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { Form, Input, Button, Row, Col, Space, Divider, message } from "antd";

const Login = React.memo(() => {
  const [loading, setLoading] = useState(false);

  const onSubmit = ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    setLoading(true);

    return firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .catch((error) => message.error(error.message))
      .finally(() => setLoading(false));
  };

  return (
    <Row
      justify="center"
      align="middle"
      className="login-layout bg-white vh-100"
    >
      <Col xs={20} sm={14} md={10} xl={6} xxl={4}>
        <Form
          layout="vertical"
          initialValues={{
            email: "",
            password: "",
          }}
          requiredMark="optional"
          onFinish={onSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input prefix={<MailOutlined className="site-form-item-icon" />} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password
              type="password"
              prefix={<LockOutlined className="site-form-item-icon" />}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-100"
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
        <Divider plain>or</Divider>
        <Space size="large" direction="vertical" className="w-100">
          <Link to="/register">
            <Button
              type="default"
              htmlType="submit"
              disabled={loading}
              className="w-100"
            >
              Register
            </Button>
          </Link>
          <Link to="/forgot-password">
            <Button
              type="default"
              htmlType="submit"
              disabled={loading}
              className="w-100"
            >
              Forgot Password
            </Button>
          </Link>
        </Space>
      </Col>
    </Row>
  );
});

export default Login;
