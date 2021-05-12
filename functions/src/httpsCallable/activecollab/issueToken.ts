import * as functions from "firebase-functions";

import ActiveCollab, {
  IssueTokenInput,
  ActiveCollabAccount,
  IssueTokenResponse,
} from "../../lib/activecollab";

export default functions.https.onCall(
  async (data: IssueTokenInput, context) => {
    if (!context?.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Unauthenticated"
      );
    }

    let tokenResponse: IssueTokenResponse;

    try {
      tokenResponse = await ActiveCollab.issueToken(data);
    } catch (error) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        error.message,
        error
      );
    }

    const { token } = tokenResponse;

    const account = new ActiveCollabAccount({
      token,
      accountId: data.client_name,
    });

    const projects = await account.projects();

    return {
      token: tokenResponse.token,
      accountId: data.client_vendor,
      projects,
    };
  }
);
