import firebase from "firebase/app";

import "firebase/auth";
import "firebase/functions";
import "firebase/firestore";

const config = {
  apiKey: "AIzaSyA78jJJwXyFnCYa8KHtVYema6mSwzDdjCI",
  authDomain: "time-sync-a450f.firebaseapp.com",
  projectId: "time-sync-a450f",
  storageBucket: "time-sync-a450f.appspot.com",
  messagingSenderId: "514660510665",
  appId: "1:514660510665:web:1c3493708b4a020dac1618",
  measurementId: "G-3WW9SFEX1F",
};

firebase.initializeApp(config);
