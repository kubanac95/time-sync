import React from "react";
import { Layout } from "antd";

const { Content } = Layout;

const PublicLayout: React.FC = ({ children }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content>{children}</Content>
    </Layout>
  );
};

export default PublicLayout;
