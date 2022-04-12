import * as _ from "lodash";
import * as express from "express";
import * as functions from "firebase-functions";

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
  if (token !== config?.jira?.automation?.api_key) {
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

    functions.logger.log(
      `[Automation/Jira] Webhook received "project/${projectId}/issue/${issueId}/worklog/${worklogId}"`,
      req.body
    );

    if (req?.body?.issue?.fields?.description) {
      try {
        const decodedDescription = encodeURIComponent(
          req?.body?.issue?.fields?.description ?? ""
        );

        _.set(req.body, "issue.fields.description", decodedDescription);
      } catch (error) {
        return res.sendStatus(500);
      }
    }

    try {
      await worklogAutomation(req.body);

      return res.status(200).json({
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

  functions.logger.log(
    `[Automation/Jira] Webhook received "project/${projectId}/issue/${issueId}"`,
    req.body
  );

  if (req?.body?.issue?.fields?.description) {
    try {
      const decodedDescription = encodeURIComponent(
        req?.body?.issue?.fields?.description ?? ""
      );

      _.set(req.body, "issue.fields.description", decodedDescription);
    } catch (error) {
      return res.sendStatus(500);
    }
  }

  try {
    await issueAutomation(req.body);

    return res.status(200).json({
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
