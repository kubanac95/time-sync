import React from "react";

import firebase from "firebase";

import { useAuthState } from "react-firebase-hooks/auth";
import { QueryCache, ReactQueryCacheProvider } from "react-query";
import { Route, Switch, Redirect, BrowserRouter } from "react-router-dom";

import * as Layout from "../components/Layout";
import * as AppRoute from "../components/Route";

import * as Page from "../pages";

const queryCache = new QueryCache();

const publicPaths = ["/login", "/register", "/forgot-password"];

const PublicRouter = React.memo(() => (
  <Layout.Public>
    <Switch>
      <Route exact path="/forgot-password">
        <Page.ForgotPassword />
      </Route>
      <Route exact path="/register">
        <Page.Register />
      </Route>
      <Route exact path="/login">
        <Page.Login />
      </Route>
      <Redirect to="/login" />
    </Switch>
  </Layout.Public>
));

const PrivateRouter = React.memo(() => {
  return (
    <Layout.Private>
      <Switch>
        <Route exact path="/">
          <Page.Dashboard />
        </Route>
        <Route path="/task">
          <Page.Tasks />
        </Route>
        <Redirect to="/" />
      </Switch>
    </Layout.Private>
  );
});

const Root = () => {
  const [, loading] = useAuthState(firebase.auth());

  if (loading) {
    return null;
  }

  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      <BrowserRouter>
        <Switch>
          <AppRoute.Public path={publicPaths}>
            <PublicRouter />
          </AppRoute.Public>
          <AppRoute.Private path="/">
            <PrivateRouter />
          </AppRoute.Private>
        </Switch>
      </BrowserRouter>
    </ReactQueryCacheProvider>
  );
};

export default Root;
