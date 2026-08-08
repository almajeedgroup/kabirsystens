// Data layer for the college administration app.
//
// Reads are always synchronous from the in-memory `data` model. Persistence
// is pluggable: in LOCAL mode it writes to the browser's localStorage; in
// FIREBASE mode (after the admin signs in) it writes through to Firestore.
// The UI never changes — it always talks to this module's API.
import { firebaseEnabled, loadAll, remote } from './firebase.js';

const STORAGE_KEY = 'kabir_college_admin_v1';

const DEFAULT_SETTINGS = {
  collegeName: 'Kabir Ind PU College for Women',
  unit: 'A Unit of Islamic Information Centre',
  address: '',
  phone: '',
  email: '',
  logo: '', // optional uploaded logo (data URL); falls back to the built-in emblem
};

const DEFAULT_DATA = {
  students: [],   // {id, admissionNo, name, guardianName, className, combination, language, phone, email,
                  //  address, dob, year, actualAmount, agreedAmount, remarks, photo,
                  //  payments: {admission|inst1|inst2|inst3: {amount, date, receipt, mode}}
  staff: [],      // {id, name, designation, subject, qualification, phone, email, address, salary, joinDate, photo}
  expenses: {},   // { [year]: { [category]: { [monthIndex]: amount } } }
  balanceSheets: {}, // { [year]: { iPucActual, iPucReceived, iiPucActual, iiPucReceived } }
  customCategories: [], // user-added expense categories beyond the defaults
  settings: { ...DEFAULT_SETTINGS },
};

const EMPTY_PAYMENTS = {
  admission: { amount: '', date: '', receipt: '', mode: '' },
  inst1: { amount: '', date: '', receipt: '', mode: '' },
  inst2: { amount: '', date: '', receipt: '', mode: '' },
  inst3: { amount: '', date: '', receipt: '', mode: '' },
};

// Bring records saved by earlier versions (feeAssigned/feePaid) onto the
// fee-register schema (actual/agreed amounts + staged payments).
function migrateStudent(s) {
  const payments = { ...structuredClone(EMPTY_PAYMENTS), ...(s.payments || {}) };
  if (!s.payments && s.feePaid) payments.admission.amount = s.feePaid;
  return {
    combination: '',
    language: '',
    remarks: '',
    ...s,
    actualAmount: s.actualAmount ?? s.feeAssigned ?? '',
    agreedAmount: s.agreedAmount ?? s.feeAssigned ?? '',
    payments,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
    parsed.students = parsed.students.map(migrateStudent);
    parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
    return parsed;
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

// Total received across the admission payment and all instalments.
export function paidTotal(student) {
  return Object.values(student.payments || {}).reduce(
    (a, p) => a + Number(p.amount || 0),
    0
  );
}

// Due = agreed amount minus everything received so far.
export function dueAmount(student) {
  return Number(student.agreedAmount || 0) - paidTotal(student);
}

// Deficit (concession) = actual fee minus the agreed fee.
export function feeDeficit(student) {
  return Number(student.actualAmount || 0) - Number(student.agreedAmount || 0);
}

export function updatePayment(studentId, stage, patch) {
  data.students = data.students.map((s) =>
    s.id === studentId
      ? { ...s, payments: { ...s.payments, [stage]: { ...s.payments[stage], ...patch } } }
      : s
  );
  notify();
  const updated = data.students.find((s) => s.id === studentId);
  if (updated) cloud.studentDebounced(updated);
}

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

let data = load();
let mode = 'local'; // 'local' | 'firebase'
const listeners = new Set();

export const firebaseAvailable = firebaseEnabled;

function notify() {
  if (mode === 'local') saveLocal();
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getData() {
  return data;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- Cloud sync (Firebase mode) ----
let syncErrorHandler = null;
export function onSyncError(fn) {
  syncErrorHandler = fn;
}
function fail(err) {
  console.error('Cloud sync error:', err);
  if (syncErrorHandler) syncErrorHandler(err);
}

const timers = {};
function debounce(key, op, delay = 700) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => Promise.resolve(op()).catch(fail), delay);
}

// Targeted write-through helpers. No-ops in local mode.
const cloud = {
  student: (s) => mode === 'firebase' && remote.putStudent(s).catch(fail),
  studentDebounced: (s) =>
    mode === 'firebase' && debounce(`student:${s.id}`, () => remote.putStudent(s)),
  deleteStudent: (id) => mode === 'firebase' && remote.deleteStudent(id).catch(fail),
  students: (list) =>
    mode === 'firebase' && list.forEach((s) => remote.putStudent(s).catch(fail)),
  staff: (m) => mode === 'firebase' && remote.putStaff(m).catch(fail),
  deleteStaff: (id) => mode === 'firebase' && remote.deleteStaff(id).catch(fail),
  staffAll: (list) =>
    mode === 'firebase' && list.forEach((m) => remote.putStaff(m).catch(fail)),
  expenses: () => mode === 'firebase' && debounce('expenses', () => remote.putExpenses(data.expenses)),
  balanceSheets: () =>
    mode === 'firebase' && debounce('balance', () => remote.putBalanceSheets(data.balanceSheets)),
  misc: () =>
    mode === 'firebase' && debounce('misc', () => remote.putMisc(data.customCategories, data.settings)),
};

// Switch to Firebase mode and load the whole database from Firestore.
// Called once the admin has signed in.
export async function activateFirebaseData() {
  const remoteData = await loadAll();
  data = {
    ...structuredClone(DEFAULT_DATA),
    ...remoteData,
    settings: { ...DEFAULT_SETTINGS, ...(remoteData.settings || {}) },
  };
  data.students = data.students.map(migrateStudent);
  mode = 'firebase';
  listeners.forEach((fn) => fn());
  return { students: data.students.length, staff: data.staff.length };
}

// Return to a clean local state (used on sign-out).
export function deactivateFirebaseData() {
  mode = 'local';
  data = structuredClone(DEFAULT_DATA);
  listeners.forEach((fn) => fn());
}

// ---- Settings ----
export function getSettings() {
  return data.settings || { ...DEFAULT_SETTINGS };
}

export function updateSettings(patch) {
  data.settings = { ...getSettings(), ...patch };
  notify();
  cloud.misc();
}

// ---- Backup & restore (whole database) ----
export function exportAllData() {
  return {
    app: 'kabir-college-admin',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      students: data.students,
      staff: data.staff,
      expenses: data.expenses,
      balanceSheets: data.balanceSheets,
      customCategories: data.customCategories,
      settings: data.settings,
    },
  };
}

// Replace the entire database from a backup file. Returns a short summary.
export function importAllData(backup) {
  const payload = backup && backup.data ? backup.data : backup;
  if (!payload || !Array.isArray(payload.students)) {
    throw new Error('This file is not a valid backup of this system.');
  }
  data = {
    ...structuredClone(DEFAULT_DATA),
    ...payload,
    settings: { ...DEFAULT_SETTINGS, ...(payload.settings || {}) },
  };
  data.students = data.students.map(migrateStudent);
  notify();
  if (mode === 'firebase') remote.replaceAll(data).catch(fail);
  return {
    students: data.students.length,
    staff: data.staff.length,
  };
}

// ---- Students ----
export function addStudent(student) {
  const record = migrateStudent({ ...student, id: uid() });
  data.students = [...data.students, record];
  notify();
  cloud.student(record);
}

export function updateStudent(id, patch) {
  data.students = data.students.map((s) => (s.id === id ? { ...s, ...patch } : s));
  notify();
  const updated = data.students.find((s) => s.id === id);
  if (updated) cloud.student(updated);
}

export function deleteStudent(id) {
  data.students = data.students.filter((s) => s.id !== id);
  notify();
  cloud.deleteStudent(id);
}

// Bulk import: merge incoming students into the given year. Matches an
// existing record by admission number, falling back to name; non-empty
// incoming fields overwrite, everything else is preserved.
export function importStudents(incoming, year) {
  let added = 0;
  let updated = 0;
  let students = [...data.students];
  const touched = [];
  for (const rec of incoming) {
    const match = students.find(
      (s) =>
        s.year === year &&
        ((rec.admissionNo && s.admissionNo === rec.admissionNo) ||
          s.name.trim().toLowerCase() === rec.name.trim().toLowerCase())
    );
    if (match) {
      const merged = { ...match };
      for (const [k, v] of Object.entries(rec)) {
        if (k === 'payments') continue;
        if (v !== '' && v !== undefined && v !== null) merged[k] = v;
      }
      if (rec.payments) {
        merged.payments = { ...match.payments };
        for (const [stage, p] of Object.entries(rec.payments)) {
          const clean = Object.fromEntries(
            Object.entries(p).filter(([, v]) => v !== '' && v !== undefined)
          );
          merged.payments[stage] = { ...merged.payments[stage], ...clean };
        }
      }
      students = students.map((s) => (s.id === match.id ? merged : s));
      touched.push(merged);
      updated++;
    } else {
      const record = migrateStudent({ ...rec, year, id: uid() });
      students.push(record);
      touched.push(record);
      added++;
    }
  }
  data.students = students;
  notify();
  cloud.students(touched);
  return { added, updated };
}

// ---- Staff ----
export function addStaff(member) {
  const record = { ...member, id: uid() };
  data.staff = [...data.staff, record];
  notify();
  cloud.staff(record);
}

export function updateStaff(id, patch) {
  data.staff = data.staff.map((s) => (s.id === id ? { ...s, ...patch } : s));
  notify();
  const updated = data.staff.find((s) => s.id === id);
  if (updated) cloud.staff(updated);
}

export function deleteStaff(id) {
  data.staff = data.staff.filter((s) => s.id !== id);
  notify();
  cloud.deleteStaff(id);
}

// Bulk import: merge incoming staff records, matching by name.
export function importStaffMembers(incoming) {
  let added = 0;
  let updated = 0;
  let staff = [...data.staff];
  const touched = [];
  for (const rec of incoming) {
    const match = staff.find(
      (s) => s.name.trim().toLowerCase() === rec.name.trim().toLowerCase()
    );
    if (match) {
      const merged = { ...match };
      for (const [k, v] of Object.entries(rec)) {
        if (v !== '' && v !== undefined && v !== null) merged[k] = v;
      }
      staff = staff.map((s) => (s.id === match.id ? merged : s));
      touched.push(merged);
      updated++;
    } else {
      const record = { ...rec, id: uid() };
      staff.push(record);
      touched.push(record);
      added++;
    }
  }
  data.staff = staff;
  notify();
  cloud.staffAll(touched);
  return { added, updated };
}

// Bulk import of a monthly-expenses sheet for one year. Categories not in
// the sheet yet are created automatically.
export function importExpenses(year, rows, knownCategories) {
  const known = knownCategories.map((c) => c.toLowerCase());
  let cells = 0;
  for (const { category, months } of rows) {
    if (!known.includes(category.toLowerCase())) {
      data.customCategories = [...data.customCategories, category];
      known.push(category.toLowerCase());
    }
    // Match stored category casing.
    const canonical =
      knownCategories.find((c) => c.toLowerCase() === category.toLowerCase()) ||
      category;
    const yearData = { ...(data.expenses[year] || {}) };
    yearData[canonical] = { ...(yearData[canonical] || {}), ...months };
    data.expenses = { ...data.expenses, [year]: yearData };
    cells += Object.keys(months).length;
  }
  notify();
  cloud.expenses();
  cloud.misc();
  return { rows: rows.length, cells };
}

// ---- Expenses ----
export function setExpense(year, category, monthIndex, amount) {
  const yearData = { ...(data.expenses[year] || {}) };
  const catData = { ...(yearData[category] || {}) };
  if (amount === '' || amount === null || Number.isNaN(Number(amount))) {
    delete catData[monthIndex];
  } else {
    catData[monthIndex] = Number(amount);
  }
  yearData[category] = catData;
  data.expenses = { ...data.expenses, [year]: yearData };
  notify();
  cloud.expenses();
}

export function getExpense(year, category, monthIndex) {
  return data.expenses[year]?.[category]?.[monthIndex] ?? '';
}

export function expensesAnnualTotal(year) {
  const yearData = data.expenses[year] || {};
  return Object.values(yearData).reduce(
    (sum, months) => sum + Object.values(months).reduce((a, b) => a + Number(b || 0), 0),
    0
  );
}

// ---- Expense categories ----
export function addCategory(name) {
  const clean = name.trim();
  if (!clean) return;
  if (!data.customCategories.includes(clean)) {
    data.customCategories = [...data.customCategories, clean];
    notify();
    cloud.misc();
  }
}

export function removeCategory(name) {
  data.customCategories = data.customCategories.filter((c) => c !== name);
  // Drop the category's recorded amounts across all years.
  const expenses = {};
  for (const [year, cats] of Object.entries(data.expenses)) {
    const { [name]: _removed, ...rest } = cats;
    expenses[year] = rest;
  }
  data.expenses = expenses;
  notify();
  cloud.misc();
  cloud.expenses();
}

// ---- Balance sheet ----
export function getBalanceSheet(year) {
  return (
    data.balanceSheets[year] || {
      iPucActual: 0,
      iPucReceived: 0,
      iiPucActual: 0,
      iiPucReceived: 0,
    }
  );
}

export function setBalanceSheet(year, sheet) {
  data.balanceSheets = { ...data.balanceSheets, [year]: { ...getBalanceSheet(year), ...sheet } };
  notify();
  cloud.balanceSheets();
}

// Fill the balance sheet from student fee records for the given year.
// Actual = sum of actual fee amounts; received = everything collected
// across the admission payment and instalments.
export function syncBalanceSheetFromStudents(year) {
  const students = data.students.filter((s) => s.year === year);
  const byClass = (cls) => students.filter((s) => s.className === cls);
  const actual = (cls) => byClass(cls).reduce((a, s) => a + Number(s.actualAmount || 0), 0);
  const received = (cls) => byClass(cls).reduce((a, s) => a + paidTotal(s), 0);
  setBalanceSheet(year, {
    iPucActual: actual('I PUC'),
    iPucReceived: received('I PUC'),
    iiPucActual: actual('II PUC'),
    iiPucReceived: received('II PUC'),
  });
}
