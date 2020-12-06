import React from "react";

import { Layout } from "antd";

import PageHeader from "../../../components/PageHeader";

const Dashboard = React.memo(() => {
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

      <Layout.Content className="site-layout-content"></Layout.Content>
    </>
  );
});

export default Dashboard;
