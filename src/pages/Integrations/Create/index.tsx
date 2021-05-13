import { useMemo } from "react";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import {
  PageHeader,
  Steps,
  Layout,
  Form,
  Input,
  Row,
  Col,
  Button,
  Select,
  message,
  Divider,
  Typography,
} from "antd";

import map from "lodash/map";
import find from "lodash/find";

import firebase from "firebase";
import useSetState from "react-use/lib/useSetState";

const { Step } = Steps;
const { Paragraph, Title } = Typography;

type FieldValues = {
  email: string;
  password: string;
};

type CreateIntegrationInput = {
  token?: string;
  user?: ActiveCollabUserSimple;
  project?: IActiveCollabProject;
  projects?: IActiveCollabProject[];
  account?: ActiveCollabAccountSimple;
  accounts?: ActiveCollabAccountSimple[];
};

type StepProps = {
  value: CreateIntegrationInput;
  onChange: (input: CreateIntegrationInput) => any;
};

const StepConfirmForm = ({ value, onChange }: StepProps) => {
  return (
    <Row style={{ paddingTop: "2rem" }}>
      <Col xs={20} sm={14} md={12} xl={8} xxl={6}>
        <Title level={4}>Project</Title>
        <Paragraph copyable>{value?.project?.id}</Paragraph>
        <Divider />
        <Title level={4}>Account</Title>
        <Paragraph copyable>{value?.account?.display_name}</Paragraph>
        <Divider />
        <Title level={4}>Token</Title>
        <Paragraph copyable>{value?.token}</Paragraph>
      </Col>
      <Col span={24}>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Finish
          </Button>
        </Form.Item>
      </Col>
    </Row>
  );
};

const StepProjectForm = ({ value, onChange }: StepProps) => {
  const [form] = Form.useForm<{ project: number }>();

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      onFinish={({ project: projectId }) =>
        onChange({ project: find(value.projects, { id: projectId }) })
      }
    >
      <Row style={{ paddingTop: "2rem" }}>
        <Col xs={20} sm={14} md={12} xl={8} xxl={6}>
          <Form.Item
            name="project"
            label="Email"
            rules={[{ required: true, message: "Please select a project" }]}
          >
            <Select
              showSearch
              filterOption
              optionFilterProp="label"
              placeholder="Select a project"
              showArrow={false}
              defaultActiveFirstOption={false}
              options={map(value.projects ?? [], ({ name, id }) => ({
                value: id,
                label: name,
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Next
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

const StepLoginForm = ({ onChange }: StepProps) => {
  const [form] = Form.useForm();

  const onLogin = (variables: FieldValues) => {
    return firebase
      .functions()
      .httpsCallable("authActivecollabLogin")(variables)
      .then((authResponse) => {
        const authData = authResponse.data as IActiveCollabLoginResponse;

        if (authData.accounts.length !== 1) {
          return onChange({ accounts: authData.accounts, user: authData.user });
        }

        const {
          accounts: [account],
        } = authData;

        return firebase
          .functions()
          .httpsCallable("authActivecollabIssueToken")({
            intent: authData.user.intent,
            client_name: `${account.name}`,
            client_vendor: `${account.display_name}`,
          })
          .then((tokenResponse) => {
            const { token, projects } =
              tokenResponse.data as IActiveCollabIssueTokenResponse & {
                accountId: string;
                projects: IActiveCollabProject[];
              };

            return onChange({
              token,
              account,
              projects,
              accounts: authData.accounts,
              user: authData.user,
            });
          })
          .catch(console.log);
      })
      .catch((error) => {
        message.error(error.message);
      });
  };

  return (
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
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input
              size="large"
              prefix={<MailOutlined className="site-form-item-icon" />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
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
  );
};

const IntegrationCreate = () => {
  const [state, setState] = useSetState<CreateIntegrationInput>();

  const current = useMemo(() => {
    if (state.project) {
      return 3;
    }

    if (state.account) {
      return 2;
    }

    if (state.token) {
      return 1;
    }

    return 0;
  }, [state]);

  console.log(state, current);

  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumb={{
          routes: [
            {
              path: "/",
              breadcrumbName: "Dashboard",
            },
          ],
        }}
      />

      <Layout.Content className="site-layout-content">
        <Steps current={current} type="default">
          <Step title="Login" />
          <Step title="Pick an account" />
          <Step title="Select project" />
          <Step title="Confirm" />
        </Steps>
        {current === 0 && <StepLoginForm value={state} onChange={setState} />}
        {current === 2 && <StepProjectForm value={state} onChange={setState} />}
        {current === 3 && <StepConfirmForm value={state} onChange={setState} />}
      </Layout.Content>
    </>
  );
};

export default IntegrationCreate;
