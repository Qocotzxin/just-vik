import firebase from 'firebase/app';

export interface FirebaseModel {
  id?: string;
  lastModification: string | firebase.firestore.Timestamp;
}
