import * as axios from "axios";

interface Config {
  user_id: number;
  project_id: number;
}

class BaseElement {
  api: axios.AxiosInstance;
  config: Config;

  constructor(api: axios.AxiosInstance, config: Config) {
    this.api = api;
    this.config = config;
  }
}

class Time extends BaseElement {
  find(id: number | string) {
    return this.api
      .get<IActiveCollabResponseDocument<IActiveCollabTime>>(
        `/projects/${this.config.project_id}/time-records/${id}`
      )
      .then(({ data }) => data?.single);
  }

  create(body: IActiveCollabTimeCreate) {
    return this.api
      .post<IActiveCollabResponseDocument<IActiveCollabTime>>(
        `/projects/${this.config.project_id}/time-records`,
        {
          billable_status: 1,
          ...body,
        }
      )
      .then(({ data }) => data?.single);
  }

  move(id: number | string, data: IActiveCollabTimeMove) {
    return this.api.post(
      `/projects/${this.config.project_id}/time-records/${id}`,
      data
    );
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
        `/projects/${this.config.project_id}/time-records/${id}`,
        body
      )
      .then(({ data }) => data?.single);
  }

  delete(id: number | string) {
    return this.api.delete(
      `/projects/${this.config.project_id}/time-records/${id}`
    );
  }
}

class Task extends BaseElement {
  find(id: number | string) {
    return this.api
      .get<IActiveCollabResponseDocument<IActiveCollabTask>>(
        `/projects/${this.config.project_id}/tasks/${id}`
      )
      .then(({ data }) => data?.single);
  }

  create({
    subscribers = [2],
    assignee_id = this.config.user_id,
    ...body
  }: IActiveCollabTaskCreate) {
    return this.api
      .post<IActiveCollabResponseDocument<IActiveCollabTask>>(
        `/projects/${this.config.project_id}/tasks`,
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
        `/projects/${this.config.project_id}/tasks/${id}`,
        {
          ...body,
          subscribers,
        }
      )
      .then(({ data }) => data?.single);
  }

  delete(id: number | string) {
    return this.api.delete(`/projects/${this.config.project_id}/tasks/${id}`);
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

class ActiveCollab {
  api: axios.AxiosInstance;
  user_id: number;

  time: Time;
  task: Task;

  constructor(account: HookDocument["activecollab"]) {
    this.api = axios.default.create({
      baseURL: `https://app.activecollab.com/${account.accountId}/api/v1`,
      headers: {
        "Content-Type": "application/json",
        "X-Angie-AuthApiToken": account.token,
      },
    });

    this.user_id = ActiveCollab.getUserFromToken(account.token);

    const config: Config = {
      user_id: this.user_id,
      project_id: parseInt(account.projectId, 10),
    };

    this.time = new Time(this.api, config);
    this.task = new Task(this.api, config);
  }

  static getUserFromToken(token: string) {
    return parseInt(token.split("-")[0]);
  }
}

export default ActiveCollab;
