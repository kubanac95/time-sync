import * as express from "express";

import { logger } from "firebase-functions";

import { issueAutomation } from "../../lib/issue";
import { worklogAutomation } from "../../lib/worklog";

const router = express.Router();

router.use(express.json());

router.use((req, res, next) => {
  const identifier = req.headers["x-atlassian-webhook-identifier"];

  if (!identifier) {
    return res.sendStatus(500);
  }

  return next();
});

/**
 * https://us-central1-time-sync-a450f.cloudfunctions.net/hooks/jira/projects/${project.id}/issue/${issue.id}
 */
router.post<{ projectId: string; issueId: string }, any, JiraWebhookIssueEvent>(
  "/project/:projectId/issue/:issueId",
  async (req, res) => {
    const {
      params: { projectId, issueId },
      body: { webhookEvent, issue, user },
    } = req;

    logger.log(
      `[Webhook/Jira] Webhook received "project/${projectId}/issue/${issueId}"`,
      JSON.stringify(req.body)
    );

    try {
      await issueAutomation({
        eventType: webhookEvent,
        project: {
          id: projectId,
        },
        issue,
        user,
      });

      return res.sendStatus(200);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message });
      }

      return res.sendStatus(500);
    }
  }
);

/**
 * https://us-central1-time-sync-a450f.cloudfunctions.net/hooks/jira/project/${project.id}/issue/${issue.id}/worklog/${worklog.id}
 */
router.post<
  { projectId: string; issueId: string; worklogId: string },
  any,
  JiraWebhookWorklogEvent
>("/project/:projectId/issue/:issueId/worklog/:worklogId", async (req, res) => {
  const {
    params: { projectId, issueId, worklogId },
    body: { webhookEvent, worklog },
  } = req;

  logger.log(
    `[Webhook/Jira] Webhook received "project/${projectId}/issue/${issueId}/worklog/${worklogId}"`,
    JSON.stringify(req.body)
  );

  try {
    await worklogAutomation({
      eventType: webhookEvent,
      worklog,
      project: {
        id: projectId,
      },
      issue: {
        id: issueId,
      },
    });

    return res.sendStatus(200);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ message: error.message });
    }

    return res.sendStatus(500);
  }
});

export default router;
