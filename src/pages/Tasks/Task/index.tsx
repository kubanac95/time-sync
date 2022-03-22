import React, { useContext, useEffect } from "react";

import map from "lodash/map";
import firebase from "firebase";

import { useQuery } from "react-query";
import { Form, Button, Layout, Select, Col, Row } from "antd";
import { useDocumentDataOnce } from "react-firebase-hooks/firestore";

import PageHeader from "../../../components/PageHeader";

import { clockify } from "../../../lib/api";
import { FormInstance } from "antd/lib/form";
import { useParams } from "react-router-dom";

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

const ProjectSelect = (props: any) => {
  const form = useForm();

  const workspace = form.getFieldValue(["clockify", "workspace"]);

  const { data: projects } = useQuery(
    [`workspaces/${workspace}/projects`],
    ({ queryKey: [key] }) =>
      clockify.get<IWorkspace[]>(`/${key}`).then(({ data }) => data),
    {
      enabled: !!workspace,
    }
  );

  return (
    <Select>
      {map(projects, (project) => (
        <Select.Option value={project.id}>
          {project.name}
          <br />
          {project.id}
        </Select.Option>
      ))}
    </Select>
  );
};

const Dashboard = React.memo(() => {
  const { taskId } = useParams<{ taskId?: string }>();

  const { data: workspaces } = useQuery(["workspaces"], () =>
    clockify.get<IWorkspace[]>("/workspaces").then(({ data }) => data)
  );

  const [taskData] = useDocumentDataOnce(
    taskId ? firebase.firestore().doc(`tasks/${taskId}`) : undefined
  );

  const [form] = Form.useForm();

  useEffect(() => {
    console.log(taskData);
    if (taskData) {
      form.setFieldsValue(taskData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskData]);

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
        <FormProvider form={form}>
          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
            onFinish={onSubmit}
          >
            <Row gutter={16}>
              <Col xs={24} sm={24} md={12} xxl={12}>
                <Form.Item
                  name={["clockify", "id"]}
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
                <Form.Item
                  name={["clockify", "projectId"]}
                  shouldUpdate
                  label="Project"
                  rules={[{ required: false }]}
                >
                  <ProjectSelect />
                </Form.Item>
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
        </FormProvider>
      </Layout.Content>
    </>
  );
});

export default Dashboard;
