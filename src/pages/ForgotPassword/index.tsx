import React, { useState } from "react";

import firebase from "firebase";

import { Link } from "react-router-dom";
import { MailOutlined } from "@ant-design/icons";
import { Form, Input, Button, Row, Col, message } from "antd";

const ForgotPassword = React.memo(() => {
  const [loading, setLoading] = useState(false);

  const onSubmit = ({ email }: { email: string }) => {
    setLoading(true);

    return firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(() =>
        message.success(
          `An email has been sent to ${email} with further instructions`
        )
      )
      .catch((error) => {
        message.error(error.message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Row
      justify="center"
      align="middle"
      className="login-layout bg-white vh-100"
    >
      <Col xs={20} sm={14} md={10} xl={6} xxl={4}>
        <div className="logo" />
        <Form
          layout="vertical"
          initialValues={{
            email: "",
          }}
          requiredMark="optional"
          onFinish={onSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            extra="Enter your email so we can send you further instructions"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input prefix={<MailOutlined className="site-form-item-icon" />} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-100"
            >
              Reset password
            </Button>
          </Form.Item>
        </Form>
        <Link to="/login">
          <Button
            type="default"
            htmlType="submit"
            disabled={loading}
            className="w-100"
          >
            Back to Login
          </Button>
        </Link>
      </Col>
    </Row>
  );
});

export default ForgotPassword;
