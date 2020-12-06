import React from "react";
import ReactDOM from "react-dom";

import Root from "./containers/Root";

import "./scss/index.scss";

import "./lib/firebase";

ReactDOM.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
  document.getElementById("root")
);
