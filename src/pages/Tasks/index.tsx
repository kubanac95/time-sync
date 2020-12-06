import React from "react";

import { Switch, Route, useRouteMatch } from "react-router-dom";

import Task from "./Task";
import Tasks from "./Tasks";

const TasksRouter = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <Tasks />
      </Route>
      <Route exact path={`${path}/new`}>
        <Task />
      </Route>
      <Route path={`${path}/:taskId`}>
        <Task />
      </Route>
    </Switch>
  );
};

export default TasksRouter;
