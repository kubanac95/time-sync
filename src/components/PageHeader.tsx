import React from "react";

import { PageHeader as AntPageHeader } from "antd";

import { Link } from "react-router-dom";
import { PageHeaderProps } from "antd/lib/page-header";

const PageHeader: React.FC<PageHeaderProps> = ({ breadcrumb, ...rest }) => {
  return (
    <>
      <AntPageHeader
        {...rest}
        breadcrumb={{
          itemRender: (route, _params, routes) => {
            const last = routes.indexOf(route) === routes.length - 1;

            return last ? (
              <span>{route.breadcrumbName}</span>
            ) : (
              <Link to={route.path}>{route.breadcrumbName}</Link>
            );
          },
          ...breadcrumb,
        }}
      />
    </>
  );
};

export default PageHeader;
