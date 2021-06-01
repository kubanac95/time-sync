interface TimeDocument {
  activecollab: {
    id: string;
    parent_id: string;
    parent_type: string;
  };
  clockify?: {
    id: string;
    projectId: string;
    workspaceId: string;
  };
  jira?: {
    id: string;
  };
}

interface TaskDocument {
  activecollab: {
    id: string;
  };
  clockify?: {
    id: string;
    projectId: string;
  };
  jira?: {
    id: string;
  };
}

interface HookDocument {
  activecollab: {
    url: string;
    token: string;
    accountId: string;
    projectId: string;
    job_type_id?: number;
  };
  clockify?: {
    projectId: string;
    workspaceId: string;
  };
  jira?: {
    projectId: string;
    accountId: string;
  };
}

interface ProjectDocument {
  activecollab: {
    projectId: string;
    name?: string;
    subscribers?: number[];
  };
}
