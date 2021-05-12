import * as functions from "firebase-functions";

import ActiveCollab, { LoginInput } from "../../lib/activecollab";

export default functions.https.onCall(async (data: LoginInput, context) => {
  if (!context?.auth?.uid) {
    throw new functions.https.HttpsError("unauthenticated", "Unauthenticated");
  }

  let authResponse;

  try {
    authResponse = await ActiveCollab.login(data);
  } catch (error) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      error.message,
      error
    );
  }

  return authResponse;
});
