type ClockifyEventType =
  | "NEW_TASK"
  | "NEW_TIME_ENTRY"
  | "TIME_ENTRY_DELETED"
  | "TIME_ENTRY_UPDATED";

type ClockifyUserStatus = "ACTIVE";

type ClockifyTaskStatus = "ACTIVE" | "DONE";

interface ClockifyProject {
  id: string;
  name: string;
  clientId: string;
  workspaceId: string;
  billable: boolean;
}

interface ClockifyTask {
  id: string;
  projectId: string;
  workspaceId: string;
  name: string;
  status: ClockifyTaskStatus;
}

interface ClockifyUser {
  id: string;
  name: string;
  status: ClockifyUserStatus;
}

interface ClockifyTimeInterval {
  start: string;
  end: string;
  duration: string;
}

interface ClockifyEventTag {
  name: string;
}

interface ClockifyEventTimeEntry {
  id: string;
  description: string;
  userId: string;
  billable: boolean;
  projectId: string;
  timeInterval: ClockifyTimeInterval;
  isLocked: boolean;
  hourlyRate: null | unknown;
  costRate: null | unknown;
  customFieldValues: unknown[];
  workspaceId: string;
  project?: ClockifyProject;
  task?: ClockifyTask;
  user: ClockifyUser;
  tags: ClockifyEventTag[];
}

interface ClockifyTimeEntry {
  id: string;
  /**
   * If provided, time entries will be filtered by description.
   */
  description: string;
}

interface ClockifyEventNewTask {
  id: string;
  name: string;
  projectId: string;
  assigneeIds: string[];
  assigneeId: string;
  estimate: string;
  status: ClockifyTaskStatus;
  duration: string;
  billable: boolean;
  hourlyRate: unknown;
  costRate: unknown;
}
