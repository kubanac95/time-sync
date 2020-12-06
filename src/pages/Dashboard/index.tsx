import React from "react";

import { Layout } from "antd";

import PageHeader from "../../components/PageHeader";

const Dashboard = React.memo(() => {
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

      <Layout.Content className="site-layout-content" />
    </>
  );
});

export default Dashboard;
