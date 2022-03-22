import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export default functions.auth.user().onCreate((user) => {
  const userRef = admin.firestore().doc(`users/${user.uid}`);

  return userRef.set({
    email: user.email,
    createdAt: admin.firestore.Timestamp.now(),
  });
});
