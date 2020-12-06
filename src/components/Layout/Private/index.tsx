import React from "react";

import { Avatar, Dropdown, Layout, Menu, Badge } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";

import firebase from "firebase";
import useToggle from "react-use/lib/useToggle";

import { useAuthState } from "react-firebase-hooks/auth";

import Sidebar from "./Sidebar";

const { Header } = Layout;

const UserMenu = () => {
  const [user] = useAuthState(firebase.auth());

  const onLogout = () => null;

  const menu = (
    <Menu style={{ minWidth: 160 }}>
      <Menu.Item key="logout" onClick={onLogout} danger>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={["click"]}>
      <Badge count={0}>
        <Avatar shape="circle" size={32}>
          {user?.displayName?.[0]}
        </Avatar>
      </Badge>
    </Dropdown>
  );
};

const LayoutPrivate: React.FunctionComponent = ({ children }) => {
  const [collapsed, toggle] = useToggle(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} />
      <Layout className="site-layout">
        <Header
          className="site-layout-background"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0px 24px",
          }}
        >
          {React.createElement(
            collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
            {
              className: "trigger",
              onClick: toggle,
            }
          )}
          <UserMenu />
        </Header>
        {children}
      </Layout>
    </Layout>
  );
};

export default LayoutPrivate;
