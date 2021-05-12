interface IActiveCollabTime {
  id: number;
  class: "TimeRecord";
  url_path: string;
  is_trashed: boolean;
  trashed_on: Nullable<string>;
  trashed_by_id: number;
  billable_status: 0 | 1 | 2;
  value: number;
  record_date: number;
  summary: string;
  // User
  user_id: number;
  user_name: string;
  user_email: string;
  // Parent
  parent_type: "Task" | "Project";
  parent_id: number;
  // Creator
  created_on: number;
  created_by_id: number;
  created_by_name: string;
  created_by_email: string;
  // Updater
  updated_on: number;
  updated_by_id: number;
  job_type_id: number;
  //
  source: string;
  original_is_trashed: boolean;
}

interface IActiveCollabTimeCreate {
  value: string;
  record_date: string;
  job_type_id: number;
  summary: string;
  task_id?: number;
  billable_status?: 0 | 1 | 2 | undefined;
}

interface IActiveCollabTimeUpdate {
  value: string;
  record_date: string;
  job_type_id: number;
  summary: string;
  task_id?: number;
}

// https://developers.activecollab.com/api-documentation/v1/projects/elements/time-records/time-records.html
interface IActiveCollabTimeMove {
  task_id?: number;
  project_id?: number;
}
