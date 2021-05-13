import { Switch, Route, useRouteMatch } from "react-router-dom";

import CreateIntegration from "./Create";

const IntegrationsRouter = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={`${path}/create`}>
        <CreateIntegration />
      </Route>
    </Switch>
  );
};

export default IntegrationsRouter;
