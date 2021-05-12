import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * hooks
 */
export { default as hooks } from "./hooks";

export { default as authActivecollabLogin } from "./auth/activecollab/login";
export { default as authActivecollabIssueToken } from "./auth/activecollab/issueToken";
