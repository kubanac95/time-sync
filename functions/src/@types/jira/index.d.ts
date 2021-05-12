type JiraWebhookEventIssueType =
  | "jira:issue_created"
  | "jira:issue_updated"
  | "jira:issue_deleted";

type JiraWebhookEventWorklogType =
  | "worklog_created"
  | "worklog_updated"
  | "worklog_deleted";

interface JiraAvatar {
  "48x48": string;
  "24x24": string;
  "16x16": string;
  "32x32": string;
}

interface JiraProject {
  self: string;
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  simplified: boolean;
  avatarUrls: JiraAvatar;
}

interface JiraIssueFieldPriority {
  id: string;
  name: string;
  self: string;
  iconUrl: string;
}

interface JiraIssueResolution {
  id: string;
  self: string;
  description: string;
  name: string;
}

interface JiraIssueType {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  subtask: boolean;
  avatarId: number;
}

interface JiraUser {
  self: string;
  accountId: string;
  avatarUrls: JiraAvatar;
  displayName: string;
  active: boolean;
  timeZone: string;
  accountType: string;
}

interface JiraIssueFieldStatusCategory {
  self: string;
  id: number;
  key: string;
  colorName: string;
  name: string;
}

interface JiraIssueFieldStatus {
  self: string;
  description: string;
  iconUrl: string;
  name: string;
  id: string;
  statusCategory: JiraIssueFieldStatusCategory;
}

interface JiraIssueFields {
  statuscategorychangedate: string;
  issuetype: JiraIssueType;
  parent?: JiraIssue;
  timespent: number;
  project: JiraProject;
  fixVersions: any[];

  aggregatetimespent: number;
  resolution: Nullable<JiraIssueResolution>;
  resolutiondate: Nullable<string>;
  workratio: number;
  lastViewed: string;
  watches: {
    self: string;
    watchCount: number;
    isWatching: boolean;
  };
  issuerestriction: unknown;
  created: string;
  priority: JiraIssueFieldPriority;
  labels: string[];
  assignee: Nullable<JiraUser>;
  updated: Nullable<string>;
  status: JiraIssueFieldStatus;
  timeoriginalestimate: unknown;
  description: Nullable<string>;
  components: unknown[];
  timetracking: {
    remainingEstimate: string;
    timeSpent: string;
    remainingEstimateSeconds: number;
    timeSpentSeconds: number;
  };
  attachment: unknown[];
  summary: string;
  creator: JiraUser;
  subtasks: unknown[];
  reporter: JiraUser;
  aggregateprogress: {
    progress: number;
    total: number;
    percent: number;
  };
  progress: {
    progress: number;
    total: number;
    percent: number;
  };
  votes: {
    self: string;
    votes: number;
    hasVoted: boolean;
  };
}

interface JiraIssue {
  id: string;
  self: string;
  key: string;
  fields: JiraIssueFields;
}

interface JiraWorklog {
  self: string;
  author: JiraUser;
  updateAuthor: JiraUser;
  comment: string;
  created: string;
  updated: string;
  started: string;
  timeSpent: string;
  timeSpentSeconds: number;
  id: string;
  issueId: string;
}

interface JiraChangelog {
  toString: string;
  to: string | null;
  fromString: string;
  from: string | null;
  fieldtype: string;
  field: string;
}

interface JiraIssueChangelog {
  id: string;
  items: JiraChangelog[];
}

interface JiraWebhookIssueEvent {
  timestamp: number;
  webhookEvent: JiraWebhookEventIssueType;
  issue: JiraIssue;
  user: JiraUser;
}

interface JiraWebhookWorklogEvent {
  timestamp: number;
  webhookEvent: JiraWebhookEventWorklogType;
  worklog: JiraWorklog;
}

interface JiraWebhookIssueUpdatedEvent extends JiraWebhookIssueEvent {
  changelog: JiraIssueChangelog;
  webhookEvent: "jira:issue_updated";
}

type JiraWebhookIssue = JiraWebhookIssueEvent | JiraWebhookWorklogEvent;
