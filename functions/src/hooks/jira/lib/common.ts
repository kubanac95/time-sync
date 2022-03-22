import * as axios from "axios";

import { firestore } from "firebase-admin";
import { logger } from "firebase-functions";

import { Account as ActiveCollabAccount } from "../../../lib/activecollab";

const db = firestore();

export const getHookDocument = (
  projectId: string,
  accountId: string
): Promise<HookDocument | undefined> => {
  return db
    .collection("hooks")
    .where("jira.accountId", "==", accountId)
    .where("jira.projectId", "==", projectId)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return;
      }

      return snapshot.docs[0].data() as HookDocument;
    })
    .catch(() => undefined);
};

export const createActiveCollabProjectInstance = (
  config: HookDocument["activecollab"]
) => {
  /**
   * Create API instance for particular account
   */
  const account = new ActiveCollabAccount({
    accountId: config.accountId,
    token: config.token,
  });

  /**
   * Create project instance for AC account
   */
  const project = account.Project(parseInt(config.projectId, 10));

  function onRejected(error: axios.AxiosError) {
    logger.error(`['ActiveCollab/api] error: `, error);

    return Promise.reject(error);
  }

  account.api.interceptors.response.use(undefined, onRejected);

  return project;
};
