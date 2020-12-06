import React from "react";
import { Route, Redirect, useLocation, RouteProps } from "react-router-dom";

import firebase from "firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const PublicRoute = React.memo(({ children, ...rest }: RouteProps) => {
  const location: {
    state: { from?: { pathname?: string } };
  } = useLocation();

  const pathname = location.state?.from?.pathname ?? "/";

  const [user] = useAuthState(firebase.auth());

  return (
    <Route
      {...rest}
      render={() =>
        !user ? (
          children
        ) : (
          <Redirect
            to={{
              pathname,
            }}
          />
        )
      }
    />
  );
});

export default PublicRoute;
