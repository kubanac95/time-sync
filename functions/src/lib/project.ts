import { firestore } from "firebase-admin";

const db = firestore();

class Project {
  static createReference(fieldPath: string, value: string) {
    return db.collection("projects").where(fieldPath, "==", value).limit(1);
  }

  static findOne(fieldPath: string, value: string) {
    return this.createReference(fieldPath, value)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          return;
        }

        return snapshot
          .docs[0] as firestore.QueryDocumentSnapshot<ProjectDocument>;
      })
      .catch(() => undefined);
  }
}

export default Project;
