import React, { useContext } from "react";

import map from "lodash/map";

import { useQuery } from "react-query";
import {
  Form,
  Button,
  Input,
  Layout,
  message,
  Alert,
  Tabs,
  Select,
  Col,
  Row,
  Card,
  Divider,
  Descriptions,
  Typography,
} from "antd";

import PageHeader from "../../../components/PageHeader";

import { clockify } from "../../../lib/api";
import { FormInstance } from "antd/lib/form";

const FormContext = React.createContext<{ form?: FormInstance }>({});

const FormProvider: React.FC<{ form?: FormInstance }> = ({
  children,
  form: initialForm,
}) => {
  const [form] = Form.useForm(initialForm);

  return (
    <FormContext.Provider value={{ form }}>{children}</FormContext.Provider>
  );
};

const useForm = () => {
  const { form } = useContext(FormContext);

  return form as FormInstance;
};

const ProjectSelect = () => {
  const form = useForm();

  const workspace = form.getFieldValue(["clockify", "workspace"]);

  const { data: projects } = useQuery<TAPIResponse<IWorkspace[]>["data"]>(
    [`workspaces/${workspace}/projects`],
    (key: string) => clockify.get(`/${key}`).then(({ data }) => data),
    {
      enabled: !!workspace,
    }
  );

  console.log(projects);

  return (
    <Form.Item
      name={["clockify", "project"]}
      label="Project"
      rules={[{ required: false }]}
    >
      <Select>
        {map(projects, (project) => (
          <Select.Option value={project.id}>
            {project.name}
            <br />
            {project.id}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  );
};

const Dashboard = React.memo(() => {
  const { data: workspaces } = useQuery<TAPIResponse<IWorkspace[]>["data"]>(
    ["workspaces"],
    () => clockify.get("/workspaces").then(({ data }) => data)
  );

  const onSubmit = (variables: any) => {
    console.log("variables: ", variables);
  };

  return (
    <>
      <PageHeader
        title="Task"
        breadcrumb={{
          routes: [
            {
              path: "/task",
              breadcrumbName: "Task",
            },
          ],
        }}
      />

      <Layout.Content className="site-layout-content">
        <FormProvider>
          <FormContext.Consumer>
            {({ form }) => (
              <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                onFinish={onSubmit}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={24} md={12} xxl={12}>
                    <Form.Item
                      name={["clockify", "workspace"]}
                      label="Workspace"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        {map(workspaces, (workspace) => (
                          <Select.Option value={workspace.id}>
                            {workspace.name}
                            <br />
                            {workspace.id}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <ProjectSelect />
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        Submit
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}
          </FormContext.Consumer>
        </FormProvider>
      </Layout.Content>
    </>
  );
});

export default Dashboard;
