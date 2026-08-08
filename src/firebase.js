// Firebase bootstrap. Only initialises when real credentials are present;
// otherwise the app stays in local (browser-storage) mode.
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';

export const firebaseEnabled = isFirebaseConfigured;

let app = null;
let auth = null;
let db = null;

if (firebaseEnabled) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };

// ---- Auth helpers ----
export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}

// Turn a Firebase auth error code into a readable message.
export function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Could not sign in. Please try again.';
  }
}

// ---- Firestore layout ----
// students/{id}, staff/{id}, and single docs app/expenses, app/balanceSheets,
// app/misc ({ customCategories, settings }).
const STUDENTS = 'students';
const STAFF = 'staff';
const APP = 'app';

// Load the whole database into a plain object shaped like the local store.
export async function loadAll() {
  const [studentsSnap, staffSnap, expensesSnap, balanceSnap, miscSnap] = await Promise.all([
    getDocs(collection(db, STUDENTS)),
    getDocs(collection(db, STAFF)),
    getDocs(collection(db, `${APP}/data/singletons`)).catch(() => null),
    Promise.resolve(null),
    Promise.resolve(null),
  ]);

  const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const staff = staffSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Singleton docs live under app/data/singletons/{expenses|balanceSheets|misc}.
  let expenses = {};
  let balanceSheets = {};
  let customCategories = [];
  let settings = undefined;
  if (expensesSnap) {
    for (const d of expensesSnap.docs) {
      const data = d.data();
      if (d.id === 'expenses') expenses = data.value || {};
      if (d.id === 'balanceSheets') balanceSheets = data.value || {};
      if (d.id === 'misc') {
        customCategories = data.customCategories || [];
        settings = data.settings;
      }
    }
  }
  return { students, staff, expenses, balanceSheets, customCategories, settings };
}

const singleton = (name) => doc(db, `${APP}/data/singletons/${name}`);

export const remote = {
  async putStudent(student) {
    const { id, ...rest } = student;
    await setDoc(doc(db, STUDENTS, id), rest);
  },
  async deleteStudent(id) {
    await deleteDoc(doc(db, STUDENTS, id));
  },
  async putStaff(member) {
    const { id, ...rest } = member;
    await setDoc(doc(db, STAFF, id), rest);
  },
  async deleteStaff(id) {
    await deleteDoc(doc(db, STAFF, id));
  },
  async putExpenses(expenses) {
    await setDoc(singleton('expenses'), { value: expenses });
  },
  async putBalanceSheets(balanceSheets) {
    await setDoc(singleton('balanceSheets'), { value: balanceSheets });
  },
  async putMisc(customCategories, settings) {
    await setDoc(singleton('misc'), { customCategories, settings });
  },
  // Replace the whole database (used by Restore / initial import).
  async replaceAll(data) {
    // Wipe existing student/staff docs, then write the new set in batches.
    const [studentsSnap, staffSnap] = await Promise.all([
      getDocs(collection(db, STUDENTS)),
      getDocs(collection(db, STAFF)),
    ]);
    let batch = writeBatch(db);
    let ops = 0;
    const flush = async () => {
      if (ops > 0) {
        await batch.commit();
        batch = writeBatch(db);
        ops = 0;
      }
    };
    const stage = (ref, payload) => {
      if (payload === undefined) batch.delete(ref);
      else batch.set(ref, payload);
      if (++ops >= 400) return flush();
    };
    for (const d of studentsSnap.docs) await stage(doc(db, STUDENTS, d.id));
    for (const d of staffSnap.docs) await stage(doc(db, STAFF, d.id));
    for (const s of data.students) {
      const { id, ...rest } = s;
      await stage(doc(db, STUDENTS, id), rest);
    }
    for (const s of data.staff) {
      const { id, ...rest } = s;
      await stage(doc(db, STAFF, id), rest);
    }
    await stage(singleton('expenses'), { value: data.expenses });
    await stage(singleton('balanceSheets'), { value: data.balanceSheets });
    await stage(singleton('misc'), {
      customCategories: data.customCategories,
      settings: data.settings,
    });
    await flush();
  },
};
