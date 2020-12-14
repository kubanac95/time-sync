import React from "react";

import firebase from "firebase";

import { Layout, Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import { Link } from "react-router-dom";
import { useCollectionData } from "react-firebase-hooks/firestore";

import PageHeader from "../../../components/PageHeader";

const Dashboard = React.memo(() => {
  const [data, loading, error] = useCollectionData<ITask>(
    firebase.firestore().collection("tasks"),
    {
      idField: "id",
    }
  );

  const columns: ColumnsType<ITask> = [
    {
      dataIndex: "id",
      title: "id",
      render: (value: string, data) => (
        <Link to={`/task/${data.id}`}>{value}</Link>
      ),
    },
  ];

  console.log(data, loading, error);

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
        <Table
          columns={columns}
          dataSource={data || []}
          rowKey="id"
          loading={loading}
          scroll={{ x: true }}
          // onChange={onChange}
        />
      </Layout.Content>
    </>
  );
});

export default Dashboard;
