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

    try {
      const { is_ok, token } = await ActiveCollab.issueToken(data);

      if (!is_ok) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid input"
        );
      }

      return {
        token,
      };
    } catch (error) {
      throw new functions.https.HttpsError("invalid-argument", error.message);
    }
  }
);
