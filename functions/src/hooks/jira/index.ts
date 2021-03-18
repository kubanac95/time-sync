import * as dayjs from "dayjs";
import * as express from "express";
import * as bodyParser from "body-parser";

import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";

import * as duration from "dayjs/plugin/duration";

import ActiveCollab from "../../lib/activecollab";

import TaskLog from "../../lib/task";
import TimeLog from "../../lib/time";
import ProjectLog from "../../lib/project";

dayjs.extend(duration);

const db = firestore();

const getHookDocument = (
  projectId: string,
  accountId: string
): Promise<HookDocument | undefined> => {
  return db
    .collection("hooks")
    .where("jira.accountId", "==", accountId)
    .where("jira.projectId", "==", projectId)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return;
      }

      return snapshot.docs[0].data() as HookDocument;
    })
    .catch(() => undefined);
};

const router = express.Router();

router.use(bodyParser.json());

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
router.post<
  { projectId: string; issueId: string },
  never,
  JiraWebhookIssueEvent
>("/project/:projectId/issue/:issueId", async (req, res) => {
  const {
    params: { projectId, issueId },
    body: { webhookEvent, issue, user },
  } = req;

  const hook = await getHookDocument(projectId, user.accountId);

  if (!hook) {
    logger.error(
      `[Webhook/Jira] Could not find a hook associated with projectId: ${projectId}`
    );

    return res.status(500);
  }

  console.log(req.body);

  const projectData = await ProjectLog.findOne(
    "activecollab.projectId",
    hook.activecollab.projectId
  ).then((d) => d?.data());

  if (!projectData) {
    return res.status(500);
  }

  const activeCollab = new ActiveCollab(hook.activecollab);

  switch (webhookEvent) {
    case "jira:issue_created": {
      const {
        key: issueKey,
        self: issueLink,
        fields: { summary, description },
      } = issue;

      const activeCollabTask = await activeCollab.task.create({
        name: `[Jira #${issueId}]: ${issueKey} - ${summary}`,
        body: [
          `<p><a href="${
            new URL(issueLink).origin
          }/browse/${issueKey}">${issueKey}</a></p>`,
          `<p>${description}</p>`,
        ].join("<br />"),
        subscribers: projectData?.activecollab?.subscribers,
      });

      await TaskLog.create({
        activecollab: {
          id: `${activeCollabTask.id}`,
        },
        jira: {
          id: issueId,
        },
      });

      return res.sendStatus(200);
    }

    case "jira:issue_updated": {
      // const { changelog } = body as JiraWebhookIssueUpdatedEvent;
      const {
        key: issueKey,
        self: issueLink,
        fields: { summary, description },
      } = issue;

      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const payload = {
        name: `[Jira #${issueId}]: ${issueKey} - ${summary}`,
        body: [
          `<p><a href="${
            new URL(issueLink).origin
          }/browse/${issueKey}">${issueKey}</a></p>`,
          `<p>${description}</p>`,
        ].join("<br />"),
        subscribers: projectData?.activecollab?.subscribers,
      };

      /**
       * Create a task because it is non existing
       *
       * @todo - Remove later
       */
      if (!taskLogSnapshot?.exists) {
        const activeCollabTask = await activeCollab.task.create(payload);

        await TaskLog.create({
          activecollab: {
            id: `${activeCollabTask.id}`,
          },
          jira: {
            id: issueId,
          },
        });

        return res.sendStatus(200);
      }

      const taskLogData = taskLogSnapshot.data();

      await activeCollab.task
        .update(parseInt(taskLogData.activecollab.id, 10), payload)
        .catch((error) => {
          console.log(JSON.stringify(error));
        });

      return res.sendStatus(200);
    }

    case "jira:issue_deleted": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      if (!taskLogSnapshot?.exists) {
        return res.sendStatus(200);
      }

      const taskLogData = taskLogSnapshot.data();

      await activeCollab.task
        .delete(parseInt(taskLogData.activecollab.id, 10))
        .catch(() => undefined);

      await taskLogSnapshot.ref.delete().catch(() => undefined);

      return res.sendStatus(200);
    }

    default: {
      return res.sendStatus(500);
    }
  }
});

/**
 * https://0bc838fd4679.ngrok.io/hooks/jira/project/${project.id}/issue/${issue.id}/worklog/${worklog.id}
 * https://us-central1-time-sync-a450f.cloudfunctions.net/hooks/jira/project/${project.id}/issue/${issue.id}/worklog/${worklog.id}
 */
router.post<
  { projectId: string; issueId: string; worklogId: string },
  never,
  JiraWebhookWorklogEvent
>("/project/:projectId/issue/:issueId/worklog/:worklogId", async (req, res) => {
  const {
    params: { projectId, issueId, worklogId },
    body: { webhookEvent, worklog },
  } = req;

  const hook = await getHookDocument(projectId, worklog.author.accountId);

  if (!hook) {
    return res.status(500);
  }

  const projectData = await ProjectLog.findOne(
    "activecollab.projectId",
    hook.activecollab.projectId
  ).then((d) => d?.data());

  const activeCollab = new ActiveCollab(hook.activecollab);

  switch (webhookEvent) {
    case "worklog_created": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const start = dayjs(worklog.started);
      const end = start.add(worklog.timeSpentSeconds, "second");

      let payload: IActiveCollabTimeCreate = {
        value: dayjs.duration(end.diff(start, "millisecond")).format("HH:mm"),
        record_date: dayjs(worklog.created).format("YYYY-MM-DD"),
        job_type_id: 12, //React
        summary: worklog.comment || "",
      };

      /**
       * Create a task for this issue if there is none,
       * before writing the time log
       *
       * @todo - Remove later
       */
      if (!taskLogSnapshot?.exists) {
        const activeCollabTask = await activeCollab.task.create({
          // Placeholder task name
          name: `[Jira #${issueId}]`,
          subscribers: projectData?.activecollab?.subscribers,
        });

        await TaskLog.create({
          activecollab: {
            id: `${activeCollabTask.id}`,
          },
          jira: {
            id: issueId,
          },
        });

        payload = {
          ...payload,
          task_id: activeCollabTask.id,
        };
      }

      if (taskLogSnapshot?.exists) {
        const taskLogData = taskLogSnapshot?.data();

        const activeCollabTask = await activeCollab.task
          .find(parseInt(taskLogData.activecollab.id, 10))
          .catch(() => undefined);

        if (activeCollabTask) {
          payload = {
            ...payload,
            task_id: activeCollabTask.id,
          };
        }
      }

      const activeCollabTime = await activeCollab.time.create(payload);

      await TimeLog.create({
        activecollab: {
          id: `${activeCollabTime.id}`,
          parent_id: `${activeCollabTime.parent_id}`,
          parent_type: activeCollabTime.parent_type,
        },
        jira: {
          id: worklogId,
        },
      });

      return res.sendStatus(200);
    }

    case "worklog_updated": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const start = dayjs(worklog.started);
      const end = start.add(worklog.timeSpentSeconds, "second");

      let payload: IActiveCollabTimeCreate = {
        value: dayjs.duration(end.diff(start, "millisecond")).format("HH:mm"),
        record_date: dayjs(worklog.created).format("YYYY-MM-DD"),
        job_type_id: 12, //React
        summary: worklog.comment || "",
      };

      /**
       * Create a task for this issue if there is none,
       * before writing the time log
       *
       * @todo - Remove later
       */
      if (!taskLogSnapshot?.exists) {
        const activeCollabTask = await activeCollab.task.create({
          // Placeholder task name
          name: `[Jira #${issueId}]`,
          subscribers: projectData?.activecollab?.subscribers,
        });

        await TaskLog.create({
          activecollab: {
            id: `${activeCollabTask.id}`,
          },
          jira: {
            id: issueId,
          },
        });

        payload = {
          ...payload,
          task_id: activeCollabTask.id,
        };
      }

      if (taskLogSnapshot?.exists) {
        const taskLogData = taskLogSnapshot?.data();

        const activeCollabTask = await activeCollab.task
          .find(parseInt(taskLogData.activecollab.id, 10))
          .catch(() => undefined);

        if (activeCollabTask) {
          payload = {
            ...payload,
            task_id: activeCollabTask.id,
          };
        }
      }

      const timeSnapshot = await TimeLog.findOne("jira.id", worklogId);

      /**
       * Create a time log for this issue,
       * if it is not existing
       *
       * @todo - Remove later
       */
      if (!timeSnapshot?.exists) {
        const activeCollabTime = await activeCollab.time.create(payload);

        await TimeLog.create({
          activecollab: {
            id: `${activeCollabTime.id}`,
            parent_id: `${activeCollabTime.parent_id}`,
            parent_type: activeCollabTime.parent_type,
          },
          jira: {
            id: worklogId,
          },
        });

        return res.sendStatus(200);
      }

      const timeLogData = timeSnapshot.data();

      await activeCollab.time.update(
        parseInt(timeLogData.activecollab.id, 10),
        payload
      );

      return res.sendStatus(200);
    }

    case "worklog_deleted": {
      const timeSnapshot = await TimeLog.findOne("jira.id", worklogId);

      if (!timeSnapshot?.exists) {
        return res.sendStatus(200);
      }

      const timeLogData = timeSnapshot.data();

      await activeCollab.time
        .delete(timeLogData.activecollab.id)
        .catch(() => undefined);

      await timeSnapshot.ref.delete().catch(() => undefined);

      return res.sendStatus(200);
    }

    default: {
      return res.sendStatus(500);
    }
  }
});

export default router;