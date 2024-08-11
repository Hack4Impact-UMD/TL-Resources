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

type StudentID = {
  student: string;
  id: string;
};
type TeacherID = {
  student: string;
  id: string;
};
type Student = {
  student: string;
};
type Teacher = {
  student: string;
};

export function getAllStudents(): Promise<StudentID[]> {
  const studentsRef = collection(db, "Students");
  return new Promise((resolve, reject) => {
    getDocs(studentsRef)
      .then((snapshot) => {
        const allStudents: StudentID[] = [];
        const students = snapshot.docs.map((doc) => {
          const student: Student = doc.data() as Student;
          const newStudent: StudentID = { ...student, id: doc.id };
          allStudents.push(newStudent);
        });
        resolve(allStudents);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function getAllTeachers(): Promise<TeacherID[]> {
  const teachersRef = query(
    collection(db, "Users"),
    where("type", "!=", "ADMIN")
  );
  return new Promise((resolve, reject) => {
    getDocs(teachersRef)
      .then((snapshot) => {
        const teacherID: TeacherID[] = [];
        const teachers = snapshot.docs.map((doc) => {
          const teacher = doc.data() as Teacher;
          teacherID.push({ ...teacher, id: doc.id });
        });
        resolve(teacherID);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export function addStudent(student: Student): Promise<string> {
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

export function deleteCourse(id: string): Promise<void> {
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

export function updateCourse(id: string): Promise<void> {
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

export function removeStudentCourse(
  studentId: string,
  courseId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    /* runTransaction provides protection against race conditions where
       2 people are modifying the data at once. It also ensures that either
       all of these writes succeed or none of them do.

       All Reads before all writes
    */
   /*
   Students contain courses  + courses contain students => delete from both
   */
    runTransaction(db, async (transaction) => {
      const studentRef = await transaction.get(doc(db, "Students", studentId));
      const courseRef = await transaction.get(doc(db, "Courses", courseId));
      if (!studentRef.exists() || !courseRef.exists()) {
        throw "Document does not exist!";
      }
      const student: Student = studentRef.data() as Student;
      if (
        student.courseInformation.find((student) => student.id === courseId)
      ) {
        student.courseInformation = student.courseInformation.filter(
          ({ id }) => !id.includes(courseId)
        );
        await transaction.update(doc(db, "Students", studentId), {
          courseInformation: student.courseInformation,
        });
      } else {
        reject(new Error("Course does not exist in student"));
      }
      const course: Course = courseRef.data() as Course;
      if (course.students.includes(studentId)) {
        course.students = course.students.filter(function (s) {
          return s !== studentId;
        });
        await transaction.update(doc(db, "Courses", courseId), {
          students: course.students,
        });
      } else {
        reject(new Error("Student does not exist in course"));
      }
    })
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });
  });
}
