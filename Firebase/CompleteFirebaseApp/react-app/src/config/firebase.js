// Import the functions you need from the SDKs you need
import { getStorage } from "@firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "apiKEy",
  authDomain: "authDomain",
  projectId: "projectiD",
  storageBucket: "storageBucket",
  messagingSenderId: "messagingSenderId",
  appId: "appID",
  measurementId: "measurementID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initializes a cache. Cache is cleared when page is refreshed, but not when using the navbar
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: 100 * 1024 * 1024 /* 100MB */,
  }),
});

export const auth = getAuth(app);
export const functions = getFunctions(app, "us-east4");
export const storage = getStorage(app);
export default app;
