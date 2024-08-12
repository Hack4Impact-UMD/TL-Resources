const cors = require("cors")({ origin: true });
const crypto = require("crypto");
const functions = require("firebase-functions");
const { onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp({});
const db = admin.firestore();

// Sample onRequest and onSchedule functions

exports.newSubmission = onRequest(
  { region: "us-east4", cors: true },
  async (req, res) => {
    const method = req.method; // 'GET', 'POST', etc
    const headers = req.headers;
    const rawBody = req.rawBody;
    res.status(200);
    res.send("Hello from Firebase!");
    res.end();
  }
);

exports.updateCourses = onSchedule(
  {
    schedule: "every day 05:00",
    region: "us-east4",
    timeoutSeconds: 1200, // Increase timeout to 20 minutes
    memory: "2GiB", // Optionally increase the memory allocation if needed
    timeZone: "America/New_York",
  },
  async (event) => {}
);

/*
 * This comment contains fake information, but it's not a bad example of how to structure a comment.
 * Creates a new user.
 * Takes an object as a parameter that should contain an email, name, chapterName and a role field.
 * This function can only be called by a user with admin status
 * Arguments: email: string, the user's email
 *            name: string, the user's name
 *            chapterName: string, the user's chapter name
 *            role: string, (Options: "ADMIN", "TEACHER")
 */

exports.createUser = onCall(
  { region: "us-east4", cors: true },
  async ({ auth, data }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const authorization = admin.auth();
        if (!data.email || !data.role || !data.name || !data.chapterName) {
          reject("Missing parameters");
        }
        if (!auth || !auth.token || auth.token.role.toLowerCase() != "admin") {
          reject("Permission Denied");
        }
        const pass = crypto.randomBytes(32).toString("hex");
        const user = await authorization.createUser({
          email: data.email,
          password: pass,
        });
        await authorization.setCustomUserClaims(user.uid, {
          role: data.role,
        });
        const collectionObject = {
          auth_id: user.uid,
          email: data.email,
          name: data.name,
          chapterName: data.chapterName,
          type: data.role.toUpperCase(),
        };
        await db.collection("users").doc(user.uid).set(collectionObject);
        resolve();
      } catch (e) {
        reject();
      }
    });
  }
);

/**
 * Deletes the user
 * Argument: firebase_id - the user's firebase_id
 */

exports.deleteUser = onCall(
  { region: "us-east4", cors: true },
  async ({ auth, data }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const authorization = admin.auth();
        if (
          !data.firebase_id ||
          !auth ||
          !auth.token ||
          auth.token.role.toLowerCase() != "admin"
        ) {
          reject("Permission Denied");
        }
        await authorization.deleteUser(data.firebase_id);
        await db.collection("users").doc(data.firebase_id).delete();
        resolve();
      } catch (e) {
        reject();
      }
    });
  }
);

/**
 * Updates a user's email
 * Arguments: email - the user's current email
 *            newEmail - the user's new email
 */

exports.updateUserEmail = onCall(
  { region: "us-east4", cors: true },
  async ({ auth, data }) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!data.email || !data.newEmail) {
          console.log("Missing parameters");
          reject("Missing parameters");
        }
        const authorization = admin.auth();
        // A user can only update their own email
        if (
          !auth ||
          !auth.token ||
          auth.token.email.toLowerCase() != data.email.toLowerCase()
        ) {
          console.log("Permission Denied");
          reject("Permission Denied");
        }
        await authorization.updateUser(auth.uid, {
          email: data.newEmail,
        });
        await db
          .collection("users")
          .doc(auth.uid)
          .update({ email: data.newEmail });
        resolve();
      } catch (e) {
        reject();
      }
    });
  }
);

/**
 * Let's a user delete themselves
 * Argument: firebase_id - the user's firebase_id
 */

exports.deleteSelf = onCall(
  { region: "us-east4", cors: true },
  async ({ auth, data }) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!data.firebase_id) {
          reject("Missing parameters");
        }
        if (
          !auth ||
          !auth.uid ||
          auth.uid != data.firebase_id ||
          !(
            auth.token.role.toLowerCase() == "admin" ||
            auth.token.role.toLowerCase() == "user"
          )
        ) {
          reject("Permission Denied");
        }
        const authorization = admin.auth();
        await db.collection("users").doc(data.firebase_id).delete();
        await authorization.deleteUser(data.firebase_id);
        resolve();
      } catch (e) {
        reject();
      }
    });
  }
);
