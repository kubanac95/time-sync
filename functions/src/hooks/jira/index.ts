import * as dayjs from "dayjs";
import * as axios from "axios";
import * as express from "express";
import * as bodyParser from "body-parser";

import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";

import * as duration from "dayjs/plugin/duration";

import { ActiveCollabAccount } from "../../lib/activecollab";

import TaskLog from "../../lib/task";
import TimeLog from "../../lib/time";
import ProjectLog from "../../lib/project";

// Trigger CI

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

const createActiveCollabProjectInstance = (
  config: HookDocument["activecollab"]
) => {
  /**
   * Create API instance for particular account
   */
  const account = new ActiveCollabAccount({
    accountId: config.accountId,
    token: config.token,
  });

  /**
   * Create project instance for AC account
   */
  const project = account.project(parseInt(config.projectId, 10));

  function onRejected(error: axios.AxiosError) {
    logger.error(`['ActiveCollab/api] error: `, error);

    return Promise.reject(error);
  }

  account.api.interceptors.response.use(undefined, onRejected);

  return project;
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

  const projectData = await ProjectLog.findOne(
    "activecollab.projectId",
    hook.activecollab.projectId
  ).then((d) => d?.data());

  if (!projectData) {
    return res.status(500);
  }

  const AC = createActiveCollabProjectInstance(hook.activecollab);

  switch (webhookEvent) {
    case "jira:issue_created": {
      const {
        key: issueKey,
        self: issueLink,
        fields: { summary, description },
      } = issue;

      logger.log(
        `[Webhook/Jira] jira:issue_created: Creating task for issue: ${JSON.stringify(
          issue
        )}}`
      );

      const activeCollabTask = await AC.task.create({
        name: `[Jira #${issueId}]: ${issueKey} - ${summary}`,
        body: [
          `<p>
            <a href="${new URL(issueLink).origin}/browse/${issueKey}">
              ${issueKey}
            </a>
          </p>`,
          description && `<p>${description}</p>`,
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
        fields: { summary, description, resolutiondate },
      } = issue;

      logger.log(
        `[Webhook/Jira] jira:issue_update: Updating task for issue: ${JSON.stringify(
          issue
        )}}`
      );

      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const payload: IActiveCollabTaskCreate = {
        name: `[Jira #${issueId}]: ${issueKey} - ${summary}`,
        body: [
          `<p>
            <a href="${new URL(issueLink).origin}/browse/${issueKey}">
              ${issueKey}
            </a>
          </p>`,
          description && `<p>${description}</p>`,
        ].join("<br />"),
        subscribers: projectData?.activecollab?.subscribers,
      };

      let activeCollabTask: IActiveCollabTask | undefined;

      /**
       * Create a task because it is non existing
       *
       * @todo - Remove later
       */
      if (!taskLogSnapshot?.exists) {
        activeCollabTask = await AC.task.create(payload);

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

      activeCollabTask = await AC.task
        .find(parseInt(taskLogData.activecollab.id, 10))
        .catch(() => undefined);

      /**
       * Task ahs been removed from active collab,
       * we need to add a new one
       */
      if (!activeCollabTask) {
        activeCollabTask = await AC.task.create(payload);

        /**
         * Update task log reference
         */
        await TaskLog.update(taskLogData.activecollab.id, {
          activecollab: {
            id: `${activeCollabTask.id}`,
          },
        });

        return res.sendStatus(200);
      }

      activeCollabTask = await AC.task.update(
        parseInt(taskLogData.activecollab.id, 10),
        payload
      );

      if (!activeCollabTask.is_completed && !!resolutiondate) {
        await AC.task.complete(parseInt(taskLogData.activecollab.id, 10));
      }

      if (activeCollabTask.is_completed && !resolutiondate) {
        await AC.task.open(parseInt(taskLogData.activecollab.id, 10));
      }

      return res.sendStatus(200);
    }

    case "jira:issue_deleted": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      if (!taskLogSnapshot?.exists) {
        return res.sendStatus(200);
      }

      logger.log(
        `[Webhook/Jira] jira:issue_deleted: Deleting task for issue: ${JSON.stringify(
          issue
        )}}`
      );

      const taskLogData = taskLogSnapshot.data();

      await AC.task
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
 * https://bc2b36a45c2c.ngrok.io/time-sync-a450f/us-central1/hooks/jira/project/${project.id}/issue/${issue.id}/worklog/${worklog.id}
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

  const AC = createActiveCollabProjectInstance(hook.activecollab);

  switch (webhookEvent) {
    case "worklog_created": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const start = dayjs(worklog.started);
      const end = start.add(worklog.timeSpentSeconds, "second");

      let payload: IActiveCollabTimeCreate = {
        value: dayjs.duration(end.diff(start, "millisecond")).format("HH:mm"),
        record_date: dayjs(worklog.started).format("YYYY-MM-DD"),
        job_type_id: 12, //React
        summary: worklog.comment || "",
      };

      logger.log(
        `[Webhook/Jira] worklog_created: Creating log for issue: ${issueId} based on worklog: ${JSON.stringify(
          worklog
        )} with payload: ${JSON.stringify(payload)}`
      );

      let activeCollabTask: IActiveCollabTask | undefined;

      /**
       * Create a task for this issue if there is none,
       * before writing the time log
       *
       * @todo - Remove later
       */
      if (!taskLogSnapshot?.exists) {
        activeCollabTask = await AC.task.create({
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

        activeCollabTask = await AC.task
          .find(parseInt(taskLogData.activecollab.id, 10))
          .catch(() => undefined);

        if (activeCollabTask) {
          payload = {
            ...payload,
            task_id: activeCollabTask.id,
          };
        }
      }

      const activeCollabTime = await AC.time.create(payload);

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
        record_date: dayjs(worklog.started).format("YYYY-MM-DD"),
        job_type_id: 12, // React(12), Design & Content & Editing(8)
        summary: worklog.comment || "",
      };

      logger.log(
        `[Webhook/Jira] worklog_updated: Updating log for issue: ${issueId} based on worklog: ${JSON.stringify(
          worklog
        )} with payload: ${JSON.stringify(payload)}`
      );

      let activeCollabTask: IActiveCollabTask | undefined;
      let activeCollabTime: IActiveCollabTime | undefined;

      /**
       * Create a task for this issue if there is none,
       * before writing the time log
       *
       * @todo - Remove later
       */
      if (!taskLogSnapshot?.exists) {
        activeCollabTask = await AC.task.create({
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

        activeCollabTask = await AC.task
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
        activeCollabTime = await AC.time.create(payload);

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

      activeCollabTime = await AC.time.find(
        parseInt(timeLogData.activecollab.id, 10)
      );

      /**
       * Trying to update but te time log has been deleted from ActiveCollab.
       * Creating new log
       */
      if (!activeCollabTime) {
        activeCollabTime = await AC.time.create(payload);

        /**
         * Update time log reference
         */
        await TimeLog.update(timeLogData.activecollab.id, {
          activecollab: {
            id: `${activeCollabTime.id}`,
          },
        });

        return res.sendStatus(200);
      }

      /**
       * Found the time log in ActiveCollab, go ahead and update it
       */
      await AC.time.update(parseInt(timeLogData.activecollab.id, 10), payload);

      return res.sendStatus(200);
    }

    case "worklog_deleted": {
      const timeSnapshot = await TimeLog.findOne("jira.id", worklogId);

      if (!timeSnapshot?.exists) {
        return res.sendStatus(200);
      }

      const timeLogData = timeSnapshot.data();

      await AC.time.delete(timeLogData.activecollab.id).catch(() => undefined);

      await timeSnapshot.ref.delete().catch(() => undefined);

      return res.sendStatus(200);
    }

    default: {
      return res.sendStatus(500);
    }
  }
});

export default router;
