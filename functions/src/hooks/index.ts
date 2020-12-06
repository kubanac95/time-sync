import * as express from "express";
import * as cors from "cors";

import * as functions from "firebase-functions";

import clockify from "./clockify";

const app = express();

app.use(cors({ origin: true }));

app.get("/", (_req, res) => res.send("Hello World"));
app.use("/clockify", clockify);

export default functions.https.onRequest(app);
