import { firestore } from "firebase-admin";

const db = firestore();

class Time {
  static createReference(fieldPath: string, value: string) {
    return db.collection("times").where(fieldPath, "==", value).limit(1);
  }

  static findOne(fieldPath: string, value: string) {
    return this.createReference(fieldPath, value)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) {
          return;
        }

        return snapshot
          .docs[0] as firestore.QueryDocumentSnapshot<TimeDocument>;
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

  static create(data: TimeDocument) {
    return db.collection("times").add(data);
  }

  static update(
    id: string,
    data: {
      activecollab: {
        id: string;
      };
    }
  ) {
    return db.doc(`times/${id}`).update(data);
  }
}

export default Time;
