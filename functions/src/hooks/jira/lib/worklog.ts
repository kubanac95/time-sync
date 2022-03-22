import * as dayjs from "dayjs";

import { logger } from "firebase-functions";

import * as duration from "dayjs/plugin/duration";

import TaskLog from "../../../lib/task";
import TimeLog from "../../../lib/time";
import ProjectLog from "../../../lib/project";

import { createActiveCollabProjectInstance, getHookDocument } from "./common";

dayjs.extend(duration);

export interface WorklogAutomationInput {
  eventType: JiraWebhookEventWorklogType;
  project: Pick<JiraProject, "id">;
  issue: Pick<JiraIssue, "id"> & {
    key?: JiraIssue["key"];
    self?: JiraIssue["self"];
    fields?: Pick<JiraIssueFields, "summary" | "description">;
  };
  worklog: Pick<
    JiraWorklog,
    "id" | "author" | "comment" | "started" | "timeSpentSeconds"
  >;
}

export const worklogAutomation = async (input: WorklogAutomationInput) => {
  const {
    eventType,
    issue,
    issue: { id: issueId },
    project: { id: projectId },
    worklog: { id: worklogId },
    worklog,
  } = input;

  const hook = await getHookDocument(projectId, worklog.author.accountId);

  if (!hook) {
    throw new Error("Integration nto found");
  }

  const projectData = await ProjectLog.findOne(
    "activecollab.projectId",
    hook.activecollab.projectId
  ).then((d) => d?.data());

  const AC = createActiveCollabProjectInstance(hook.activecollab);

  const issueName = [
    `[Jira #${issueId}]`,
    [issue?.key, issue?.fields?.summary].filter(Boolean).join(" - "),
  ]
    .filter(Boolean)
    .join(": ");

  switch (eventType) {
    case "worklog_created": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const start = dayjs(worklog.started);
      const end = start.add(worklog.timeSpentSeconds, "second");

      let payload: IActiveCollabTimeCreate = {
        value: dayjs.duration(end.diff(start, "millisecond")).format("HH:mm"),
        record_date: dayjs(worklog.started).format("YYYY-MM-DD"),
        job_type_id: hook?.activecollab?.job_type_id ?? 1,
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
          name: issueName,
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

      return;
    }

    case "worklog_updated": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      const start = dayjs(worklog.started);
      const end = start.add(worklog.timeSpentSeconds, "second");

      let payload: IActiveCollabTimeCreate = {
        value: dayjs.duration(end.diff(start, "millisecond")).format("HH:mm"),
        record_date: dayjs(worklog.started).format("YYYY-MM-DD"),
        job_type_id: hook?.activecollab?.job_type_id ?? 1,
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
          name: issueName,
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

        return;
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

        return;
      }

      /**
       * Found the time log in ActiveCollab, go ahead and update it
       */
      await AC.time.update(parseInt(timeLogData.activecollab.id, 10), payload);

      return;
    }

    case "worklog_deleted": {
      const timeSnapshot = await TimeLog.findOne("jira.id", worklogId);

      if (!timeSnapshot?.exists) {
        return;
      }

      const timeLogData = timeSnapshot.data();

      await AC.time.delete(timeLogData.activecollab.id).catch(() => undefined);

      await timeSnapshot.ref.delete().catch(() => undefined);

      return;
    }

    default: {
      throw new Error("Unsupported eventType");
    }
  }
};
