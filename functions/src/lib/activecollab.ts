import * as axios from "axios";
import * as sup from "superstruct";

const LoginInputSchema = sup.object({
  email: sup.string(),
  password: sup.string(),
});

export type LoginInput = sup.Infer<typeof LoginInputSchema>;

const IssueTokenInputSchema = sup.object({
  intent: sup.string(),
  client_name: sup.string(),
  client_vendor: sup.string(),
});

export type IssueTokenInput = sup.Infer<typeof IssueTokenInputSchema>;

class Time {
  id: number;
  api: axios.AxiosInstance;

  constructor(id: number, api: axios.AxiosInstance) {
    this.id = id;
    this.api = api;
  }

  find(id: number | string) {
    return this.api
      .get<IActiveCollabResponseDocument<IActiveCollabTime>>(
        `/projects/${this.id}/time-records/${id}`
      )
      .then(({ data }) => data?.single);
  }

  create(body: IActiveCollabTimeCreate) {
    return this.api
      .post<IActiveCollabResponseDocument<IActiveCollabTime>>(
        `/projects/${this.id}/time-records`,
        {
          billable_status: 1,
          ...body,
        }
      )
      .then(({ data }) => data?.single);
  }

  move(id: number | string, data: IActiveCollabTimeMove) {
    return this.api.post(`/projects/${this.id}/time-records/${id}`, data);
  }

  async update(id: number | string, body: IActiveCollabTimeUpdate) {
    /**
     * Time log may have move to another task.
     * Check and move it if needed
     */
    if (body.task_id) {
      const timeRecord = await this.find(id);

      if (timeRecord.parent_id !== body.task_id) {
        await this.move(id, { task_id: body.task_id });
      }
    }

    return this.api
      .put<IActiveCollabResponseDocument<IActiveCollabTime>>(
        `/projects/${this.id}/time-records/${id}`,
        body
      )
      .then(({ data }) => data?.single);
  }

  delete(id: number | string) {
    return this.api.delete(`/projects/${this.id}/time-records/${id}`);
  }
}

class Task {
  id: number;
  api: axios.AxiosInstance;

  constructor(id: number, api: axios.AxiosInstance) {
    this.id = id;
    this.api = api;
  }

  find(id: number | string) {
    return this.api
      .get<IActiveCollabResponseDocument<IActiveCollabTask>>(
        `/projects/${this.id}/tasks/${id}`
      )
      .then(({ data }) => data?.single);
  }

  create({
    subscribers = [2],
    assignee_id = ActiveCollab.getUserFromToken(
      this.api.defaults.headers["X-Angie-AuthApiToken"]
    ),
    ...body
  }: IActiveCollabTaskCreate) {
    return this.api
      .post<IActiveCollabResponseDocument<IActiveCollabTask>>(
        `/projects/${this.id}/tasks`,
        {
          ...body,
          assignee_id,
          subscribers,
        }
      )
      .then(({ data }) => data?.single);
  }

  update(
    id: number | string,
    { subscribers = [2], ...body }: IActiveCollabTaskUpdate
  ) {
    return this.api
      .put<IActiveCollabResponseDocument<IActiveCollabTask>>(
        `/projects/${this.id}/tasks/${id}`,
        {
          ...body,
          subscribers,
        }
      )
      .then(({ data }) => data?.single);
  }

  delete(id: number | string) {
    return this.api.delete(`/projects/${this.id}/tasks/${id}`);
  }

  complete(id: number | string) {
    return this.api
      .put<IActiveCollabResponseDocument<IActiveCollabTask>>(
        `/complete/task/${id}`
      )
      .then(({ data }) => data?.single);
  }

  open(id: number | string) {
    return this.api
      .put<IActiveCollabResponseDocument<IActiveCollabTask>>(`/open/task/${id}`)
      .then(({ data }) => data?.single);
  }
}

class Project {
  id: number;
  api: axios.AxiosInstance;

  time: Time;
  task: Task;

  constructor(id: number, api: axios.AxiosInstance) {
    this.id = id;
    this.api = api;

    this.time = new Time(this.id, this.api);
    this.task = new Task(this.id, this.api);
  }
}

export class Account {
  api: axios.AxiosInstance;
  user_id: number;

  constructor({ token, accountId }: { token: string; accountId: string }) {
    this.user_id = ActiveCollab.getUserFromToken(token);

    this.api = axios.default.create({
      baseURL: `https://app.activecollab.com/${accountId}/api/v1`,
      headers: {
        "Content-Type": "application/json",
        "X-Angie-AuthApiToken": token,
      },
    });

    function onRejected(error: axios.AxiosError) {
      console.error(`['Account] error: `, error);

      return Promise.reject(error);
    }

    this.api.interceptors.response.use(undefined, onRejected);
  }

  Project(id: number) {
    return new Project(id, this.api);
  }

  projects() {
    return this.api
      .get<IActiveCollabResponseDocumentCollection<IActiveCollabProject>>(
        "/projects"
      )
      .then(({ data }) => data);
  }

  users() {
    return this.api
      .get<IActiveCollabResponseDocumentCollection<ActiveCollabUser>>("/users")
      .then(({ data }) => data);
  }
}

class ActiveCollab {
  static async login(input: LoginInput) {
    sup.assert(input, LoginInputSchema);

    return axios.default
      .post<IActiveCollabLoginResponse>(
        "https://my.activecollab.com/api/v1/external/login",
        input
      )
      .then(({ data }) => {
        if (!data?.user?.intent) {
          throw new Error("Failed to acquire access token");
        }

        if (!(Array.isArray(data?.accounts) && data?.accounts.length > 0)) {
          throw new Error("Your are not linked to any account");
        }

        return data;
      });
  }

  static issueToken(input: IssueTokenInput) {
    sup.assert(input, IssueTokenInputSchema);

    return axios.default
      .post<IActiveCollabIssueTokenResponse>(
        `https://app.activecollab.com/${input.client_name}/api/v1/issue-token`,
        input
      )
      .then(({ data }) => {
        if (!(data.is_ok && data.token)) {
          throw new Error("Invalid credentials");
        }

        return data;
      });
  }

  static getUserFromToken(token: string) {
    return parseInt(token.split("-")[0]);
  }
}

export default ActiveCollab;
