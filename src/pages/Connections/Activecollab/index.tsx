import React, { useMemo } from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import {
  Form,
  Input,
  Row,
  Col,
  Button,
  Layout,
  message,
  PageHeader,
  Steps,
  Select,
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

import firebase from "firebase";
import find from "lodash/find";

import { useMutation } from "react-query";

type LoginFieldValues = {
  email: string;
  password: string;
};

type TokenFieldValues = {
  intent: string;
  client_name: string;
  client_vendor: string;
};

const ActivecollabList = () => {
  return null;
};

const ActivecollabCreate = () => {
  const {
    mutateAsync: onLogin,
    isLoading: isAuthenticating,
    data: loginResponse,
  } = useMutation(
    (variables: LoginFieldValues) => {
      return firebase
        .functions()
        .httpsCallable("authActivecollabLogin")(variables)
        .then(({ data }) => data as IActiveCollabLoginResponse);
    },
    {
      onError: (error: Error) => {
        message.error(error.message);
      },
    }
  );

  const {
    mutateAsync: onIssueToken,
    isLoading: isIssuingToken,
    data: tokenResponse,
    variables: tokenVariables,
  } = useMutation(
    (variables: TokenFieldValues) => {
      return firebase
        .functions()
        .httpsCallable("authActivecollabIssueToken")(variables)
        .then(({ data }) => data as { token: string });
    },
    {
      onError: (error: Error) => {
        message.error(error.message);
      },
    }
  );

  const current = useMemo(() => {
    const accounts = loginResponse?.accounts;

    if (!!tokenResponse?.token) {
      return 2;
    }

    if (accounts && Array.isArray(accounts) && accounts.length > 0) {
      return 1;
    }

    return 0;
  }, [loginResponse?.accounts, tokenResponse?.token]);

  console.log({
    token: tokenResponse?.token,
    accountId: tokenVariables?.client_name,
  });

  return (
    <>
      <PageHeader title="Activecollab" />

      <Layout.Content className="site-layout-content">
        <Steps current={current} type="default">
          <Steps.Step title="Login" />
          <Steps.Step title="Pick an account" />
          <Steps.Step title="Confirm" />
        </Steps>

        {current === 0 && (
          <Form layout="vertical" requiredMark="optional" onFinish={onLogin}>
            <Row style={{ paddingTop: "2rem" }}>
              <Col xs={20} sm={14} md={12} xl={8} xxl={6}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Please input your email!" },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<MailOutlined className="site-form-item-icon" />}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: "Please input your password!" },
                  ]}
                >
                  <Input.Password
                    size="large"
                    type="password"
                    prefix={<LockOutlined className="site-form-item-icon" />}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isAuthenticating}
                  >
                    Login
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
        {current === 1 && (
          <Form
            layout="vertical"
            requiredMark="optional"
            onFinish={(variables: { account: number }) => {
              const { account: accountId } = variables;

              if (!loginResponse?.user.intent) {
                return;
              }

              const account = find(
                loginResponse?.accounts,
                (item) => item?.name === accountId
              );

              if (!account) {
                return;
              }

              return onIssueToken({
                intent: loginResponse?.user.intent,
                client_name: `${account.name}`,
                client_vendor: `${account.display_name}`,
              });
            }}
          >
            <Row style={{ paddingTop: "2rem" }}>
              <Col xs={20} sm={14} md={12} xl={8} xxl={6}>
                <Form.Item
                  label="Account"
                  name="account"
                  rules={[
                    { required: true, message: "Please select an account" },
                  ]}
                >
                  <Select
                    showSearch
                    filterOption
                    optionFilterProp="label"
                    placeholder="Select an account"
                    showArrow={false}
                    defaultActiveFirstOption={false}
                    options={loginResponse?.accounts?.map(
                      ({ name, display_name }) => ({
                        value: name,
                        label: display_name,
                      })
                    )}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isIssuingToken}
                  >
                    Issue token
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
        {current === 2 && (
          <Form
            layout="vertical"
            requiredMark="optional"
            initialValues={{
              token: tokenResponse?.token,
              accountId: tokenVariables?.client_name,
            }}
            onFinish={(variables) => {
              console.log(variables);
              // prettier-ignore
              firebase.firestore().doc(`users/${firebase.auth()?.currentUser?.uid}/connections/activecollab`).set({
                accounts: firebase.firestore.FieldValue.arrayUnion(variables)
              })
            }}
          >
            <Row style={{ paddingTop: "2rem" }}>
              <Col xs={20} sm={14} md={12} xl={10} xxl={8}>
                <Form.Item
                  label="Account"
                  name="accountId"
                  rules={[{ required: true, message: "Account is mandatory" }]}
                >
                  <Input
                    size="large"
                    type="text"
                    readOnly
                    prefix={<LockOutlined className="site-form-item-icon" />}
                  />
                </Form.Item>
                <Form.Item
                  label="API Key"
                  name="token"
                  rules={[{ required: true, message: "Token is mandatory" }]}
                >
                  <Input.Password
                    size="large"
                    readOnly
                    prefix={<LockOutlined className="site-form-item-icon" />}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isAuthenticating}
                  >
                    Save
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}
      </Layout.Content>
    </>
  );
};

const ActivecollabRouter = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <ActivecollabList />
      </Route>
      <Route exact path={`${path}/create`}>
        <ActivecollabCreate />
      </Route>
    </Switch>
  );
};

export default ActivecollabRouter;
