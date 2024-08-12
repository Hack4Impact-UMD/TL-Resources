const cors = require("cors")({ origin: true });
const { onCall, onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// Here's how to call them from your app
// const firstCloudFunction = httpsCallable(functions, "firstFunction");

// await firstCloudFunction({
//   email: "newEmail",
//   name: "newName",
//   height: "newHeight",
// })
//   .then(async () => {
//     console.log("finsihed!");
//   })
//   .catch((error) => {
//     console.log("error");
//   });

exports.sampleOnCall = onCall(
  { region: "us-east4", cors: true },
  async ({ auth, data }) => {
    return new Promise(async (resolve, reject) => {
      const role = auth.token.role;
      const email = auth.token.email;
      const uid = auth.token.uid;
      const parameter = data.parameterName;
    });
  }
);

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
