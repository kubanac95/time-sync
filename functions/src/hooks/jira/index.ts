import * as express from "express";

import routesWebhooks from "./routes/webhooks";
import routesAutomation from "./routes/automation";

const router = express.Router();

router.use("/webhooks", routesWebhooks);
router.use("/automation", routesAutomation);

export default router;
