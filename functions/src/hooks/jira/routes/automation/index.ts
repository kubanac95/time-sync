import * as express from "express";
import * as functions from "firebase-functions";

import { logger } from "firebase-functions";

import { issueAutomation, IssueAutomationInput } from "../../lib/issue";
import { worklogAutomation, WorklogAutomationInput } from "../../lib/worklog";

const config = functions.config();

const router = express.Router();

router.use(express.json());

router.use((req, res, next) => {
  const token = req.headers["x-api-key"];

  /**
   * @todo TODO - make this configurable per project
   */
  if (token !== config.JIRA_AUTOMATION_API_KEY) {
    return res.sendStatus(403);
  }

  return next();
});

router.post<never, any, WorklogAutomationInput>(
  "/worklog",
  async (req, res) => {
    const {
      body: {
        issue: { id: issueId },
        project: { id: projectId },
        worklog: { id: worklogId },
      },
    } = req;

    logger.log(
      `[Automation/Jira] Webhook received "project/${projectId}/issue/${issueId}/worklog/${worklogId}"`,
      JSON.stringify(req.body)
    );

    try {
      await worklogAutomation(req.body);

      res.status(200).json({
        message: "Success",
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }

      return res.sendStatus(500);
    }
  }
);

router.post<never, any, IssueAutomationInput>("/issue", async (req, res) => {
  const {
    body: {
      issue: { id: issueId },
      project: { id: projectId },
    },
  } = req;

  logger.log(
    `[Automation/Jira] Webhook received "project/${projectId}/issue/${issueId}"`,
    JSON.stringify(req.body)
  );

  try {
    await issueAutomation(req.body);

    res.status(200).json({
      message: "Success",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.sendStatus(500);
  }
});

export default router;
