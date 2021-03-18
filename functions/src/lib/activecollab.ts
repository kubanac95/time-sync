import * as axios from "axios";

class Time {
  api: axios.AxiosInstance;
  user_id: number;

  constructor(api: axios.AxiosInstance, user_id: number) {
    this.api = api;
    this.user_id = user_id;
  }

  find(id: number) {
    return this.api
      .get<IActiveCollabResponseDocument<IActiveCollabTime>>(
        `/time-records/${id}`
      )
      .then(({ data }) => data?.single);
  }

  create(body: IActiveCollabTimeCreate) {
    return this.api
      .post<IActiveCollabResponseDocument<IActiveCollabTime>>(`/time-records`, {
        billable_status: 2,
        ...body,
      })
      .then(({ data }) => data?.single);
  }

  move(id: number, data: IActiveCollabTimeMove) {
    return this.api(`/time-records/${id}`);
  }

  async update(id: number, body: IActiveCollabTimeUpdate) {
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
        `/time-records/${id}`,
        body
      )
      .then(({ data }) => data?.single);
  }

  delete(id: string) {
    return this.api.delete(`/time-records/${id}`);
  }
}

class Task {
  api: axios.AxiosInstance;
  user_id: number;

  constructor(api: axios.AxiosInstance, user_id: number) {
    this.api = api;
    this.user_id = user_id;
  }

  find(id: number) {
    return this.api
      .get<IActiveCollabResponseDocument<IActiveCollabTask>>(`/tasks/${id}`)
      .then(({ data }) => data?.single);
  }

  create({
    subscribers = [2],
    assignee_id = this.user_id,
    ...body
  }: IActiveCollabTaskCreate) {
    return this.api
      .post<IActiveCollabResponseDocument<IActiveCollabTask>>(`/tasks`, {
        ...body,
        assignee_id,
        subscribers,
      })
      .then(({ data }) => data?.single);
  }

  update(id: number, { subscribers = [2], ...body }: IActiveCollabTaskUpdate) {
    return this.api
      .put<IActiveCollabResponseDocument<IActiveCollabTask>>(`/tasks/${id}`, {
        ...body,
        subscribers,
      })
      .then(({ data }) => data?.single);
  }

  delete(id: number) {
    return this.api.delete(`/tasks/${id}`);
  }
}

class ActiveCollab {
  api: axios.AxiosInstance;
  user_id: number;

  time: Time;
  task: Task;

  constructor(account: HookDocument["activecollab"]) {
    this.api = axios.default.create({
      baseURL: `https://app.activecollab.com/${account.accountId}/api/v1/projects/${account.projectId}`,
      headers: {
        "Content-Type": "application/json",
        "X-Angie-AuthApiToken": account.token,
      },
    });

    this.user_id = ActiveCollab.getUserFromToken(account.token);

    this.time = new Time(this.api, this.user_id);
    this.task = new Task(this.api, this.user_id);
  }

  static getUserFromToken(token: string) {
    return parseInt(token.split("-")[0]);
  }
}

export default ActiveCollab;
