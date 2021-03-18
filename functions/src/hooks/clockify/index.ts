import * as axios from "axios";
import * as dayjs from "dayjs";
import * as express from "express";
import * as bodyParser from "body-parser";

import * as duration from "dayjs/plugin/duration";

dayjs.extend(duration);

import { firestore } from "firebase-admin";

const SUPPORTED_EVENTS = [
  "NEW_TASK",
  "NEW_TIME_ENTRY",
  "TIME_ENTRY_UPDATED",
  "TIME_ENTRY_DELETED",
];

const db = firestore();

const getHookDocument = (
  projectId: string
): Promise<HookDocument | undefined> =>
  db
    .collection("hooks")
    .where("clockify.projectId", "==", projectId)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return;
      }

      return snapshot.docs[0].data() as HookDocument;
    })
    .catch(() => undefined);

const getTimeDocument = (id: string): Promise<TimeDocument | undefined> =>
  db
    .collection("times")
    .where("clockify.id", "==", id)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return;
      }

      return snapshot.docs[0].data() as TimeDocument;
    })
    .catch(() => undefined);

const getTaskDocument = (id: string): Promise<TaskDocument | undefined> =>
  db
    .collection("tasks")
    .where("clockify.id", "==", id)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return;
      }

      return snapshot.docs[0].data() as TimeDocument;
    })
    .catch(() => undefined);

const router = express.Router();

router.use(bodyParser.json());

router.post("/", async (req, res) => {
  const { headers, body } = req;

  const event = headers["clockify-webhook-event-type"] as ClockifyEventType;

  if (!SUPPORTED_EVENTS.includes(event)) {
    return res.sendStatus(500);
  }

  const projectId = body.projectId as string;

  /**
   * Find information about the hook
   */
  const hook = await getHookDocument(projectId);

  if (!hook) {
    return res.status(500);
  }

  /**
   * Create instance for ActiveCollab API
   */
  const api = axios.default.create({
    baseURL: `${hook.activecollab.url}/api/v1`,
    headers: {
      "Content-Type": "application/json",
      "X-Angie-AuthApiToken": hook.activecollab.token,
    },
  });

  switch (event) {
    case "NEW_TASK": {
      const clockify_task = body as ClockifyEventNewTask;

      /**
       * Ged od of the user from the token
       */
      const assignee_id = parseInt(hook.activecollab.token.split("-")[0]);

      const payload = {
        name: clockify_task.name,
        assignee_id: assignee_id,
      };

      /**
       * Create a task in ActiveCollab
       */
      return api
        .post<IActiveCollabResponseDocument<IActiveCollabTask>>(
          `/projects/${hook.activecollab.projectId}/tasks`,
          payload
        )
        .then(({ data: { single } }) => {
          const task = {
            clockify: {
              id: clockify_task.id,
              projectId: clockify_task.projectId,
            },
            activecollab: {
              id: `${single.id}`,
            },
          } as TaskDocument;

          return db.collection("tasks").add(task);
        })
        .then(() => res.sendStatus(200))
        .catch((error) => {
          console.log(error);
          return res.status(500).send(error.message);
        });
    }

    case "NEW_TIME_ENTRY": {
      const clockify_timeEntry = body as ClockifyEventTimeEntry;

      const start = dayjs(new Date(clockify_timeEntry.timeInterval.start));
      const end = dayjs(new Date(clockify_timeEntry.timeInterval.end));

      /**
       * Time in HH:mm format
       */
      const value = dayjs
        .duration(end.diff(start, "millisecond"))
        .format("HH:mm");

      let task_id: number | undefined;

      if (clockify_timeEntry.task?.id) {
        const taskDocument = await getTaskDocument(clockify_timeEntry.task?.id);

        if (taskDocument?.activecollab.id) {
          task_id = parseInt(taskDocument?.activecollab.id, 10);
        }
      }

      /**
       * Check if tasks exists in ActiveCollab, if not remove the task and write the time on project level
       */
      if (task_id) {
        const projectTaskURL = `/projects/${hook.activecollab.projectId}/tasks/${task_id}`;

        await api
          .get<IActiveCollabResponseDocument<IActiveCollabTask>>(projectTaskURL)
          .catch(() => {
            // Unset the task_id if it is a deleted task
            task_id = undefined;
          });
      }

      const payload = {
        value: value,
        record_date: start.format("YYYY-MM-DD"),
        job_type_id: 12, //TODO - Find job types based on tags - Defaults to React ATM
        summary: clockify_timeEntry.description || "",
        task_id,
      };

      return api
        .post<IActiveCollabResponseDocument<IActiveCollabTime>>(
          `/projects/${hook.activecollab.projectId}/time-records`,
          payload
        )
        .then(({ data: { single } }) => {
          const time = {
            activecollab: {
              id: `${single.id}`,
              parent_id: `${single.parent_id}`,
              parent_type: single.parent_type,
            },
            clockify: {
              id: clockify_timeEntry.id,
              projectId: clockify_timeEntry.projectId,
              workspaceId: clockify_timeEntry.workspaceId,
            },
          } as TimeDocument;

          return db.collection("times").add(time);
        })
        .then(() => res.sendStatus(200))
        .catch((error) => {
          console.log(error?.response ?? error.message);
          return res.status(500).send(error.message);
        });
    }

    case "TIME_ENTRY_UPDATED": {
      const clockify_timeEntry = body as ClockifyEventTimeEntry;

      // Prepare payload to be entered in ActiveCollab
      const start = dayjs(new Date(clockify_timeEntry.timeInterval.start));
      const end = dayjs(new Date(clockify_timeEntry.timeInterval.end));

      const value = dayjs
        .duration(end.diff(start, "millisecond"))
        .format("HH:mm");

      let task_id: number | undefined;

      if (clockify_timeEntry.task?.id) {
        const taskDocument = await getTaskDocument(clockify_timeEntry.task?.id);

        if (taskDocument?.activecollab.id) {
          task_id = parseInt(taskDocument?.activecollab.id, 10);
        }
      }

      /**
       * Check if tasks exists in ActiveCollab, if not remove the task and write the time on project level
       */
      if (task_id) {
        const projectTaskURL = `/projects/${hook.activecollab.projectId}/tasks/${task_id}`;

        await api
          .get<IActiveCollabResponseDocument<IActiveCollabTask>>(projectTaskURL)
          .catch(() => {
            // Unset the task_id if it is a deleted task
            task_id = undefined;
          });
      }

      const payload = {
        value: value,
        record_date: start.format("YYYY-MM-DD"),
        job_type_id: 12, //React
        summary: clockify_timeEntry.description || "",
        task_id,
      };

      /**
       * Find existing time record with linking details
       */
      const timeRecord = await getTimeDocument(clockify_timeEntry.id);

      // No record found. In cases where we have old tasks but nio entires since integration was added later on
      if (!timeRecord) {
        return api
          .post<IActiveCollabResponseDocument<IActiveCollabTime>>(
            `/projects/${hook.activecollab.projectId}/time-records`,
            payload
          )
          .then(({ data: { single } }) => {
            const time = {
              activecollab: {
                id: `${single.id}`,
                parent_id: `${single.parent_id}`,
                parent_type: single.parent_type,
              },
              clockify: {
                id: clockify_timeEntry.id,
                projectId: clockify_timeEntry.projectId,
                workspaceId: clockify_timeEntry.workspaceId,
              },
            } as TimeDocument;

            return db.collection("times").add(time);
          })
          .then(() => {
            return res.sendStatus(200);
          })
          .catch((error) => {
            console.log(error?.response ?? error.message);
            return res.status(500).send(error.message);
          });
      }

      const timeRecordURL = `/projects/${hook.activecollab.projectId}/time-records/${timeRecord.activecollab.id}`;

      const updateTimeRecord = () =>
        api
          .put(timeRecordURL, payload)
          .then(() => res.sendStatus(200))
          .catch((error) => {
            console.log(error?.response?.data ?? error.message);
            return res.status(500).send(error.message);
          });

      return api
        .get<IActiveCollabResponseDocument<IActiveCollabTime>>(timeRecordURL)
        .then(({ data: { single } }) => {
          // ! Move time record to another task
          if (task_id && single.parent_id !== task_id) {
            return api
              .put(`${timeRecordURL}/move`, { task_id })
              .then(() => updateTimeRecord());
          }

          return updateTimeRecord();
        })
        .catch((error) => {
          console.log(error?.response?.data ?? error.message);
          return res.status(500).send(error.message);
        });
    }

    case "TIME_ENTRY_DELETED": {
      const clockify_timeEntry = body as ClockifyEventTimeEntry;

      const timeRecord = await getTimeDocument(clockify_timeEntry.id);

      if (!timeRecord) {
        return res.sendStatus(200);
      }

      const timeRecordURL = `/projects/${hook.activecollab.projectId}/time-records/${timeRecord.activecollab.id}`;

      return api
        .delete<IActiveCollabResponseDocument<IActiveCollabTime>>(timeRecordURL)
        .then(() => {
          return res.sendStatus(200);
        })
        .catch((error) => {
          console.log(error?.response?.data ?? error.message);
          return res.status(500).send(error.message);
        });
    }

    default: {
      break;
    }
  }

  return res.sendStatus(200);
});

export default router;
