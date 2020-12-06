import React from "react";

import firebase from "firebase";

import { Link } from "react-router-dom";
import { Form, Input, Button, Row, Col, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

export interface RegisterVariables {
  email: string;
  password: string;
}

const Register = React.memo(() => {
  const onSubmit = (variables: RegisterVariables) => {
    firebase
      .auth()
      .createUserWithEmailAndPassword(variables.email, variables.password)
      .then(() => {
        message.success("Success");
      })
      .catch((error) => {
        message.error(error.message);
      });
  };

  return (
    <Row
      justify="center"
      align="middle"
      className="login-layout bg-white vh-100"
    >
      <Col xs={20} sm={14} md={10} xl={6} xxl={4}>
        <Form
          name="register"
          layout="vertical"
          initialValues={{
            email: "",
            password: "",
            passwordConfirm: "",
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
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
            hasFeedback
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
              // loading={loading}
              className="w-100"
            >
              Register
            </Button>
          </Form.Item>
        </Form>
        <Link
          to={{
            pathname: "/login",
          }}
        >
          <Button
            type="default"
            htmlType="submit"
            // disabled={loading}
            className="w-100"
          >
            Login
          </Button>
        </Link>
      </Col>
    </Row>
  );
});

export default Register;
