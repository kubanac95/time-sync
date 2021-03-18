import * as express from "express";
import * as cors from "cors";

import * as functions from "firebase-functions";

import jira from "./jira";
import clockify from "./clockify";

const app = express();

app.use(cors({ origin: true }));

app.get("/", (_req, res) => res.send("Hello World"));

app.use("/jira", jira);
app.use("/clockify", clockify);

export default functions.https.onRequest(app);
