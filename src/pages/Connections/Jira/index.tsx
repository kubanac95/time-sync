// https://id.atlassian.com/manage-profile/security/api-tokens

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
} from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

import firebase from "firebase";

type FieldValues = {
  email: string;
  token: string;
};

const JiraList = () => {
  return null;
};

const JiraCreate = () => {
  const [form] = Form.useForm();

  const onLogin = (variables: FieldValues) => {
    return firebase
      .functions()
      .httpsCallable("authJiraLogin")(variables)
      .then((authResponse) => {
        console.log(authResponse);
      })
      .catch((error) => {
        message.error(error.message);
      });
  };

  return (
    <>
      <PageHeader
        title="Jira"
        // breadcrumb={{
        //   routes: [
        //     {
        //       path: "/connections",
        //       breadcrumbName: "Connections",
        //     },
        //     {
        //       path: "/connections/Jira",
        //       breadcrumbName: "Jira",
        //     },
        //   ],
        // }}
      />

      <Layout.Content className="site-layout-content">
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={onLogin}
        >
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
                name="token"
                label="API Token"
                rules={[
                  { required: true, message: "Please input your token!" },
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
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Layout.Content>
    </>
  );
};

const JiraRouter = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <JiraList />
      </Route>
      <Route exact path={`${path}/create`}>
        <JiraCreate />
      </Route>
    </Switch>
  );
};

export default JiraRouter;
