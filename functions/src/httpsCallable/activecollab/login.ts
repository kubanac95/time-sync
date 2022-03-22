import * as functions from "firebase-functions";

import ActiveCollab, { LoginInput } from "../../lib/activecollab";

export default functions.https.onCall(async (data: LoginInput, context) => {
  if (!context?.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Unauthenticated");
  }

  try {
    const { is_ok, user, accounts } = await ActiveCollab.login(data);

    if (!is_ok) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid credentials"
      );
    }

    return {
      user,
      accounts,
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid credentials"
    );
  }
});
