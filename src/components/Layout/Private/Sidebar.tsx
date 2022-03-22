import React, { useMemo } from "react";
import { Layout, Menu } from "antd";
import { DashboardOutlined, OrderedListOutlined } from "@ant-design/icons";

import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({ collapsed }: { collapsed: boolean }) => {
  const { pathname } = useLocation();

  const defaultSelectedKeys = useMemo(
    () => [`/${pathname.split("/")[1] || ""}`],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      collapsedWidth={0}
      trigger={null}
    >
      <div className="logo" />
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={defaultSelectedKeys}
      >
        <Menu.Item key="/" icon={<DashboardOutlined />}>
          <NavLink exact to="/">
            Dashboard
          </NavLink>
        </Menu.Item>
        <Menu.Item key="/connections" icon={<OrderedListOutlined />}>
          <NavLink to="/connections">Connections</NavLink>
        </Menu.Item>
        <Menu.Item key="/task" icon={<OrderedListOutlined />}>
          <NavLink to="/task">Tasks</NavLink>
        </Menu.Item>
      </Menu>
    </Layout.Sider>
  );
};

export default Sidebar;
