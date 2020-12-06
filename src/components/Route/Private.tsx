import React from "react";
import { Route, Redirect, RouteProps } from "react-router-dom";

import firebase from "firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const PrivateRoute = React.memo(({ children, ...rest }: RouteProps) => {
  const [user] = useAuthState(firebase.auth());

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
});

export default PrivateRoute;
