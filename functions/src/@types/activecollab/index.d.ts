interface DataBaseRecord {
  id: number | string;
  class: string;
  url_path: string;

  is_trashed: boolean;
  trashed_on: number | null;
  trashed_by_id: number | null;

  created_on: number;
  created_by_id: number;
  created_by_name: string;
  created_by_email: string;
}

interface ActiveCollabProject extends DataBaseRecord {
  name: string;
  completed_on: number | null;
  completed_by_id: number | null;
  is_completed: boolean;
  members: number[];
  category_id: number;
  label_id: number;
  updated_on: number | null;
  updated_by_id: number | null;
  body: string;
  body_formatted: string;
  company_id: number;
  leader_id: number;
  currency_id: number;
  template_id: number;
  based_on_type: unknown;
  based_on_id: unknown;
  email: string;
  is_tracking_enabled: boolean;
  is_billable: boolean;
  members_can_change_billable: boolean;
  is_client_reporting_enabled: boolean;
  is_sample: boolean;
  budget_type: string;
  budget: number;
  count_tasks: number;
  count_discussions: number;
  count_files: number;
  count_notes: number;
  last_activity_on: number;
}

interface ActiveCollabUser extends DataBaseRecord {
  is_archived: boolean;
  updated_on: number | null;
  language_id: number | null;
  first_name: string;
  last_name: string;
  display_name: string;
  short_display_name: string;
  email: string;
  is_email_at_example: boolean;
  additional_email_addresses: string[];
  daily_capacity: null;
  is_pending_activation: boolean;
  avatar_url: string;
  custom_permissions: [];
  company_id: number;
  title: string;
  phone: string;
  im_type: string;
  im_handle: string;
  workspace_count: number;
  first_login_on: number;
}

interface IActiveCollabTask {
  id: number;
  class: "Task";
  url_path: string;
  name: string;
  assignee_id?: number;
  body?: string;
  body_formatted?: string;
  completed_on?: Nullable<number>;
  completed_by_id?: Nullable<number>;
  is_completed?: boolean;
  subscribers?: number[];
}

interface IActiveCollabTaskCreate
  extends Omit<IActiveCollabTask, "id" | "class" | "url_path"> {}

interface IActiveCollabTaskUpdate
  extends Omit<IActiveCollabTask, "id" | "class" | "url_path" | "name"> {
  name?: string;
}

interface IActiveCollabTime {
  id: number;
  class: "TimeRecord";
  url_path: string;
  value: number;
  record_date: number;
  parent_id: number;
  parent_type: "Task" | "Project";
  billable_status: 0 | 1 | 2;
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

type IActiveCollabResponseDocument<T> = {
  single: T;
};

type IActiveCollabResponseDocumentCollection<T> = Array<T>;
