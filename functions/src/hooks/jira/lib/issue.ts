import { logger } from "firebase-functions";

import TaskLog from "../../../lib/task";
import ProjectLog from "../../../lib/project";

import { createActiveCollabProjectInstance, getHookDocument } from "./common";

export interface IssueAutomationInput {
  eventType: JiraWebhookEventIssueType;
  project: Pick<JiraProject, "id">;
  issue: Pick<JiraIssue, "id" | "key" | "self"> & {
    fields: Pick<JiraIssueFields, "summary" | "description" | "resolutiondate">;
  };
  user: Pick<JiraUser, "accountId">;
}

export const issueAutomation = async (input: IssueAutomationInput) => {
  const {
    user,
    issue,
    eventType,
    issue: { id: issueId },
    project: { id: projectId },
  } = input;

  const hook = await getHookDocument(projectId, user.accountId);

  if (!hook) {
    throw new Error("Integration not found");
  }

  const projectData = await ProjectLog.findOne(
    "activecollab.projectId",
    hook.activecollab.projectId
  ).then((d) => d?.data());

  if (!projectData) {
    throw new Error("Project not found");
  }

  const AC = createActiveCollabProjectInstance(hook.activecollab);

  switch (eventType) {
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

      return;
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

        return;
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

        return;
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

      return;
    }

    case "jira:issue_deleted": {
      const taskLogSnapshot = await TaskLog.findOne("jira.id", issueId);

      if (!taskLogSnapshot?.exists) {
        return;
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

      return;
    }

    default: {
      throw new Error("Unsupported eventType");
    }
  }
};
