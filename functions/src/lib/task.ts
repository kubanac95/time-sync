import { firestore } from "firebase-admin";

const db = firestore();

class Task {
  static createReference(fieldPath: string, value: string) {
    return db.collection("tasks").where(fieldPath, "==", value).limit(1);
  }

  static findOne(fieldPath: string, value: string) {
    return this.createReference(fieldPath, value)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          return;
        }

        return snapshot
          .docs[0] as firestore.QueryDocumentSnapshot<TaskDocument>;
      })
      .catch(() => undefined);
  }

  static deleteOne(fieldPath: string, value: string): Promise<void> {
    return this.createReference(fieldPath, value)
      .get()
      .then((snapshot) =>
        snapshot?.docs?.[0].ref.delete().then(() => undefined)
      );
  }

  static create(data: TaskDocument) {
    return db.collection("tasks").add(data);
  }

  static update(
    id: string,
    data: {
      activecollab: {
        id: string;
      };
    }
  ) {
    return db.doc(`tasks/${id}`).update(data);
  }
}

export default Task;
