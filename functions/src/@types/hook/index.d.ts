interface TimeDocument {
  activecollab: {
    id: string;
    parent_id: string;
    parent_type: string;
  };
  clockify: {
    id: string;
    projectId: string;
    workspaceId: string;
  };
}

interface TaskDocument {
  activecollab: {
    id: string;
  };
  clockify: {
    id: string;
    projectId: string;
  };
}

interface HookDocument {
  activecollab: {
    url: string;
    token: string;
    accountId: string;
    projectId: string;
  };
  clockify: {
    projectId: string;
    workspaceId: string;
  };
}
