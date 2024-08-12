import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";

export function basicGetter() {
  return new Promise((resolve, reject) => {
    const studentsRef = collection(db, "Students");
    getDocs(studentsRef)
      .then((snapshot) => {
        const allStudents = [];
        const students = snapshot.docs.map((doc) => {
          const student = doc.data();
          const newStudent = { ...student, id: doc.id };
          allStudents.push(newStudent);
        });
        resolve(allStudents);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function filteredGetter() {
  return new Promise((resolve, reject) => {
    const teachersRef = query(
      collection(db, "Users"),
      where("type", "!=", "ADMIN")
    );
    getDocs(teachersRef)
      .then((snapshot) => {
        const teacherID = [];
        const teachers = snapshot.docs.map((doc) => {
          const teacher = doc.data();
          teacherID.push({ ...teacher, id: doc.id });
        });
        resolve(teacherID);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function addData(student) {
  return new Promise((resolve, reject) => {
    addDoc(collection(db, "Students"), student)
      .then((docRef) => {
        // return id of student added
        resolve(docRef.id);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function addDataWithID(student) {
  return new Promise((resolve, reject) => {
    setDoc(doc(db, "Students", "customID"), student)
      .then((docRef) => {
        // return id of student added
        resolve(docRef.id);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function updateCourse(id) {
  return new Promise((resolve, reject) => {
    updateDoc(doc(db, "Courses", id), { online: false })
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function deleteCourse(id) {
  return new Promise((resolve, reject) => {
    deleteDoc(doc(db, "Courses", id))
      .then(() => {
        resolve();
      })
      .catch((e) => {
        reject(e);
      });
  });
}
export function batchedWrite(id) {
  return new Promise((resolve, reject) => {
    const batch = writeBatch(db);

    const docRef = doc(db, "Students", id);
    const newDocRef = doc(db, "Students", id);
    // Update an existing student
    batch.set(docRef, { name: "New Name" });
    // Create a new student
    batch.set(newDocRef, { name: "New Name", age: 10 });
    // Delete an existing student
    batch.delete(docRef);
    batch.commit.then(() => resolve()).catch((e) => reject(e));
  });
}

// CACHE SECTION
// Initializes a cache. Cache is cleared when page is refreshed, but not when using the navbar
// export const db = initializeFirestore(app, {
//     localCache: persistentLocalCache({
//       cacheSizeBytes: 100 * 1024 * 1024 /* 100MB */,
//     }),
// });

export function getCachedData() {
  const collectionRef = collection(db, "chapters");
  return new Promise(async (resolve, reject) => {
    const docs = await getDocsFromCache(collectionRef)
      .then((snapshot) => {
        return snapshot.docs.map((doc) => doc.data());
      })
      .catch((error) => {
        reject(error);
      });
    if (docs.length > 0) {
      resolve(docs);
    } else {
      getDocs(collectionRef)
        .then((snapshot) => {
          resolve(snapshot.docs.map((doc) => doc.data()));
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
}

export function removeStudentCourse(studentId, courseId) {
  return new Promise((resolve, reject) => {
    /*
     Students contain courses  + courses contain students => delete from both
     */
    runTransaction(db, async (transaction) => {
      // First we read both documents
      const studentRef = await transaction.get(doc(db, "Students", studentId));
      const courseRef = await transaction.get(doc(db, "Courses", courseId));
      if (!studentRef.exists() || !courseRef.exists()) {
        throw "Document does not exist!";
      }

      // Next we update both documents
      const student = studentRef.data();
      student.courseInformation = student.courseInformation.filter(
        ({ id }) => !id.includes(courseId)
      );
      await transaction.update(doc(db, "Students", studentId), {
        courseInformation: student.courseInformation,
      });

      const course = courseRef.data();
      course.students = course.students.filter(function (s) {
        return s !== studentId;
      });
      await transaction.update(doc(db, "Courses", courseId), {
        students: course.students,
      });
    })
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
}
