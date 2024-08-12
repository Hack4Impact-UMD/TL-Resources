const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const { onCall, onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const { onSchedule } = require("firebase-functions/v2/scheduler");

/*
 * Creates a new user.
 * Takes an object as a parameter that should contain an email, name, and a role field.
 * This function can only be called by a user with admin status
 * Arguments: email: string, the user's email
 *            name: string, the user's name
 *            role: string, (Options: "ADMIN", "TEACHER")
 */

exports.createUser = onCall(
  { region: "us-east4", cors: true },
  async ({ auth, data }) => {
    return new Promise(async (resolve, reject) => {
      const authorization = admin.auth();
      if (
        data.email != null &&
        data.role != null &&
        data.name != null &&
        auth &&
        auth.token &&
        auth.token.role.toLowerCase() == "admin"
      ) {
        const pass = crypto.randomBytes(32).toString("hex");
        await authorization
          .createUser({
            email: data.email,
            password: pass,
          })
          .then(async (userRecord) => {
            await authorization
              .setCustomUserClaims(userRecord.uid, {
                role: data.role,
              })
              .then(async () => {
                const collectionObject = {
                  auth_id: userRecord.uid,
                  email: data.email,
                  name: data.name,
                  type: data.role.toUpperCase(),
                };
                if (data.role.toLowerCase() == "teacher") {
                  collectionObject.courses = [];
                }
                await db
                  .collection("Users")
                  .doc(userRecord.uid)
                  .set(collectionObject)
                  .then(async () => {
                    const msg = {
                      from: '"Y-KNOT" <info@yknotinc.org>', // sender address
                      to: data.email, // list of receivers
                      subject: "Welcome to Y-KNOT", // Subject line

                      html: `
                      <div>
                          <div style="max-width: 600px; margin: auto">
                              <br><br><br>
                              <p style="font-size: 16px">
                              Hello,<br>
                              <br>
                              Your account has been created. Welcome to the Y-KNOT Course Management Portal, as an teacher you will be able to track and manage Y-KNOT classes. 
                              Here is a link to the portal: https://yknot-42027.web.app/. You can find your credentials listed below: <br>
                              <br>
                              <span style="font-weight: 600; text-decoration: underline">Course Management Portal Information</span><br>
                              <br>
                              Username: ${data.email}<br>
                              <br>
                              Password: ${pass}<br>
                              <br>
                              Please look out for a reset password email which will allow you to reset your password for security purposes.
                              <br>
                              <br>
                              Welcome to the Y-KNOT Course Management Portal! 
                          <div>
                      </div>
                          
                      `, // html body
                    };

                    await transporter
                      .sendMail(msg)
                      .then(() => {
                        resolve({ reason: "Success", text: "Success" });
                      })
                      .catch((error) => {
                        reject({
                          reason: "Intro Email Not Sent",
                          text: "User has been created, but the introduction email failed to be sent to them.",
                        });
                        throw new functions.https.HttpsError(
                          "Unknown",
                          "Unable to send introduction email to new user."
                        );
                      });
                  })
                  .catch((error) => {
                    reject({
                      reason: "Database Add Failed",
                      text: "User has been created in login, but has not been added to database.",
                    });
                    throw new functions.https.HttpsError(
                      "Unknown",
                      "Failed to add user to database"
                    );
                  });
              })
              .catch((error) => {
                reject({
                  reason: "Role Set Failed",
                  text: "User has been created, but their role was not set properly",
                });
                throw new functions.https.HttpsError(
                  "Unknown",
                  "Failed to set user's role"
                );
              });
          })
          .catch((error) => {
            reject({
              reason: "Creation Failed",
              text: "Failed to create user. Please make sure the email is not already in use.",
            });
            throw new functions.https.HttpsError(
              "Unknown",
              "Failed to create user in the auth."
            );
          });
      } else {
        reject({
          reason: "Permission Denied",
          text: "Only an admin user can create users. If you are an admin, make sure the email and name passed in are correct.",
        });
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only an admin user can create users. If you are an admin, make sure the email and name passed into the function are correct."
        );
      }
    });
  }
);

exports.newSubmission = onRequest(
  { region: "us-east4", cors: true },
  async (req, res) => {
    let submissionId = undefined;
    let formId = undefined;
    try {
      if (req.method != "POST") {
        throw new Error();
      }
      const busboy = Busboy({ headers: req.headers });
      const fields = [];
      busboy.on("field", (field, val) => {
        fields[field] = val;
      });

      busboy.on("finish", async () => {
        // Once all the fields have been read, we can start processing
        const data = JSON.parse(fields["rawRequest"]);
        submissionId = fields["submissionID"];
        formId = fields["formID"];

        // First find the class with the corresponding form id
        const selectedClass = await db
          .collection("Courses")
          .where("formId", "==", formId)
          .get()
          .then(async (querySnapshot) => {
            if (querySnapshot.docs.length == 0) {
              await sendNewSubmissionErrorEmail(formId, submissionId).finally(
                () => {
                  throw new Error();
                }
              );
            } else {
              // We make sure that the class is an upcoming one
              const matchingClass = querySnapshot.docs.find((doc) => {
                const sampleClass = doc.data();

                // This finds the current date in the EST timezone
                const currentAmericanDate = new Date().toLocaleDateString(
                  "en-US",
                  {
                    timeZone: "America/New_York",
                  }
                );
                const currentFormattedDate = new Date(
                  currentAmericanDate
                ).toLocaleDateString("fr-CA");
                if (
                  sampleClass.startDate.toString() >=
                  currentFormattedDate.toString()
                ) {
                  return sampleClass;
                }
              });
              if (matchingClass) {
                return matchingClass;
              }
              // No class found, throw an error
              await sendNewSubmissionErrorEmail(formId, submissionId).finally(
                () => {
                  throw new Error();
                }
              );
            }
          });

        const studentBirth =
          data["q15_dateOf"]["year"] +
          "-" +
          data["q15_dateOf"]["month"] +
          "-" +
          data["q15_dateOf"]["day"];

        let possibleStudentMatches = [];

        // Next we check if the student exists in the database
        const matchingStudent = await db
          .collection("Students")
          .where("birthDate", "==", studentBirth)
          .get()
          .then(async (querySnapshot) => {
            if (querySnapshot.docs.length == 0) {
              return undefined;
            } else {
              const student = querySnapshot.docs.find((doc) => {
                const studentData = doc.data();
                const formName =
                  data["q3_name"]["first"].toLowerCase() +
                  data["q3_name"]["middle"].toLowerCase() +
                  data["q3_name"]["last"].toLowerCase();
                const databaseName =
                  studentData.firstName.toLowerCase() +
                  (studentData.middleName || "").toLowerCase() +
                  studentData.lastName.toLowerCase();

                // We check for similarity in order to suggest whether two students might be the same
                const similarity = stringSimilarity.compareTwoStrings(
                  formName,
                  databaseName
                );
                if (similarity == 1) {
                  return doc;
                } else if (similarity > 0.35) {
                  possibleStudentMatches.push(doc.id);
                }
              });
              if (student) {
                /* If the student already exists, we don't need to indicate possible matches
                   as that was already done when the student was first created
                */
                possibleStudentMatches = [];
              }
              return student;
            }
          });
        const student = {
          firstName: data["q3_name"]["first"],
          middleName: data["q3_name"]["middle"],
          lastName: data["q3_name"]["last"],
          addrFirstLine: data["q12_address"]["addr_line1"],
          addrSecondLine: data["q12_address"]["addr_line2"],
          city: data["q12_address"]["city"],
          state: data["q12_address"]["state"],
          zipCode: data["q12_address"]["postal"],
          email: data["q4_email"],
          phone: parseInt(
            data["q5_phoneNumber"]["full"].replace(/[\(\)-\s]/g, "")
          ),
          guardianFirstName:
            data["q14_areYou"] != "Minor"
              ? ""
              : data["q9_guardianName"]["first"],
          guardianLastName:
            data["q14_areYou"] != "Minor"
              ? ""
              : data["q9_guardianName"]["last"],
          guardianEmail:
            data["q14_areYou"] != "Minor" ? "" : data["q10_guardianEmail"],
          guardianPhone:
            data["q14_areYou"] != "Minor"
              ? ""
              : parseInt(
                  data["q11_guardianPhone"]["full"].replace(/[\(\)-\s]/g, "")
                ),
          birthDate:
            data["q15_dateOf"]["year"] +
            "-" +
            data["q15_dateOf"]["month"] +
            "-" +
            data["q15_dateOf"]["day"], // "YYYY-MM-DD"
          gradeLevel: data["q14_areYou"] != "Minor" ? "" : data["q8_grade"],
          schoolName: data["q14_areYou"] != "Minor" ? "" : data["q6_nameOf"],
          courseInformation: [
            {
              id: selectedClass.id,
              attendance: [],
              homeworks: [],
              progress: "NA",
            },
          ],
        };
        // Update the current student's course information if there is a match
        if (matchingStudent) {
          student.courseInformation = matchingStudent.data().courseInformation;

          const studentClass = matchingStudent
            .data()
            .courseInformation.find((course) => course.id == selectedClass.id);

          if (!studentClass) {
            const attendances = [];
            const homeworks = [];
            selectedClass.data().attendance.forEach((day) => {
              attendances.push({ date: day.date, attended: false });
            });
            selectedClass.data().homeworks.forEach((homework) => {
              homeworks.push({ name: homework.name, completed: false });
            });
            student.courseInformation.push({
              id: selectedClass.id,
              attendance: attendances,
              homeworks: homeworks,
              progress: "NA",
            });
          }
        }

        const batch = new WriteBatch(db);
        // Creates a new auto-generated id
        const studentRef = matchingStudent
          ? matchingStudent.ref
          : db.collection("Students").doc();
        batch.set(studentRef, student);

        const studentId = matchingStudent
          ? matchingStudent.id
          : studentRef._path.segments[1];

        // Update the class's students
        const classStudents = selectedClass.data().students || [];
        if (!classStudents.includes(studentId)) {
          classStudents.push(studentId);
        }

        batch.update(selectedClass.ref, { students: classStudents });
        if (possibleStudentMatches.length > 0) {
          const docRef = db.collection("StudentMatches").doc();
          batch.set(docRef, {
            studentOne: studentId,
            matches: possibleStudentMatches,
          });
        }

        await batch
          .commit()
          .then(async () => {
            const fileFormatted = [];
            for (const file of selectedClass.data().introEmail.files) {
              const buffer = await axios({
                url: file.downloadURL,
                method: "GET",
                responseType: "arraybuffer",
              }).then((response) => {
                return Buffer.from(response.data, "binary");
              });

              fileFormatted.push({
                filename: file.name,
                content: buffer,
              });
            }

            await sendEmailToStudent(
              student.email,
              selectedClass.data().name,
              selectedClass.data().introEmail.content,
              fileFormatted
            );
          })
          .catch(async () => {
            await sendNewSubmissionErrorEmail(formId, submissionId).finally(
              () => {
                throw new Error();
              }
            );
          });

        res.end();
      });
      busboy.end(req.rawBody);
    } catch (error) {
      res.end();
    }
  }
);

exports.updateCourses = onSchedule(
  {
    schedule: "every day 05:00",
    region: "us-east4",
    timeoutSeconds: 1200, // Increase timeout to 9 minutes
    memory: "2GB", // Optionally increase the memory allocation if needed
    timeZone: "America/New_York",
  },
  async (event) => {
    try {
      const recentlyStarted = [];
      const recentlyEnded = [];
      const currentDate = new Date();
      await db
        .collection("Courses")
        .get()
        .then((snapshot) => {
          snapshot.docs.map((doc) => {
            const course = doc.data();
            const endDate = new Date(course.endDate + "T00:00:00.000-04:00");
            const endTimeDiff = currentDate.getTime() - endDate.getTime();
            //  Find the courses that recently ended
            if (
              endTimeDiff < 1000 * 3600 * 48 &&
              endTimeDiff > 1000 * 3600 * 24
            ) {
              recentlyEnded.push({ ...course, id: doc.id });
              return;
            }

            const startDate = new Date(
              course.startDate + "T00:00:00.000-04:00"
            );

            // Find the courses that recently started
            const startTimeDiff = currentDate.getTime() - startDate.getTime();
            if (startTimeDiff < 1000 * 3600 * 72 && startTimeDiff > 0) {
              recentlyStarted.push({ ...course, id: doc.id });
            }
          });
        });
      const studentMap = {};
      await db
        .collection("Students")
        .get()
        .then((snapshot) => {
          snapshot.docs.map((doc) => {
            const student = doc.data();
            studentMap[doc.id] = student;
          });
        });
      const changedIDs = [];
      const certificates = [];
      recentlyStarted.map((course) => {
        course.students.map((student) => {
          const studentData = studentMap[student];
          for (const specCourse of studentData.courseInformation) {
            if (
              specCourse.id == course.id &&
              specCourse.progress != "INPROGRESS"
            ) {
              specCourse.progress = "INPROGRESS";
              if (!changedIDs.includes(student)) {
                changedIDs.push(student);
              }

              return;
            }
          }
        });
      });
      recentlyEnded.map((course) => {
        course.students.map((student) => {
          const studentData = studentMap[student];
          for (const specCourse of studentData.courseInformation) {
            if (
              specCourse.id == course.id &&
              !(specCourse.progress == "PASS" || specCourse.progress == "FAIL")
            ) {
              if (!changedIDs.includes(student)) {
                changedIDs.push(student);
              }
              let attended = 0;
              specCourse.attendance.map((day) => {
                attended += day.attended ? 1 : 0;
              });
              attended = attended / specCourse.attendance.length;
              if (attended < 0.85) {
                specCourse.progress = "FAIL";
              } else {
                specCourse.progress = "PASS";
                certificates.push({
                  email: studentData.email,
                  studentName:
                    studentData.firstName +
                    " " +
                    (studentData?.middleName || "") +
                    " " +
                    studentData.lastName,
                  courseName: course.name,
                });
              }
            }
          }
        });
      });

      const promises = [];
      for (const student of changedIDs) {
        const studentData = studentMap[student];
        promises.push(
          db.collection("Students").doc(student).update(studentData)
        );
      }
      certificates.map(async (cert) => {
        const pdf = await createAndModifyPdf(cert.studentName, cert.courseName);
        promises.push(sendCertificate(cert.email, pdf));
      });

      await Promise.all(promises);
    } catch (error) {
      functions.logger.log("Error while updating course data: ", error);
    }
  }
);
