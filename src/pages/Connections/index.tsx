import { Switch, Route, useRouteMatch } from "react-router-dom";

import Activecollab from "./Activecollab";

const ConnectionsRouter = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/activecollab`}>
        <Activecollab />
      </Route>
    </Switch>
  );
};

export default ConnectionsRouter;
