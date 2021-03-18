type JiraWebhookEventIssueType =
  | "jira:issue_created"
  | "jira:issue_updated"
  | "jira:issue_deleted";

type JiraWebhookEventWorklogType =
  | "worklog_created"
  | "worklog_updated"
  | "worklog_deleted";

interface JiraIssueFieldPriority {
  id: string;
  name: string;
  self: string;
  iconUrl: string;
}

interface JiraIssueFields {
  summary: string;
  created: string;
  description: string;
  labels: string[];
  priority: JiraIssueFieldPriority;
}

interface JiraIssue {
  id: string;
  self: string;
  key: string;
  fields: JiraIssueFields;
}

interface JiraUser {
  self: string;
  accountId: string;
  accountType: string;
  avatarUrls: {
    "16x16": string;
    "48x48": string;
  };
  displayName: string;
  active: boolean;
  timeZone: string;
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
