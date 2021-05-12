import * as functions from "firebase-functions";

import ActiveCollab, { IssueTokenInput } from "../../lib/activecollab";

export default functions.https.onCall(
  async (data: IssueTokenInput, context) => {
    if (!context?.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Unauthenticated"
      );
    }

    let tokenResponse;

    try {
      tokenResponse = await ActiveCollab.issueToken(data);
    } catch (error) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        error.message,
        error
      );
    }

    return tokenResponse;
  }
);
