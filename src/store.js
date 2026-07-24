// Data layer for the college administration app.
//
// All reads and writes go through this module so the storage backend can be
// swapped for Firebase Firestore later without touching the UI: replace the
// load/save implementations with Firestore calls and keep the same API.

const STORAGE_KEY = 'kabir_college_admin_v1';

const DEFAULT_DATA = {
  students: [],   // {id, admissionNo, name, guardianName, className, phone, email, address, dob, year, feeAssigned, feePaid, photo}
  staff: [],      // {id, name, designation, subject, qualification, phone, email, address, salary, joinDate, photo}
  expenses: {},   // { [year]: { [category]: { [monthIndex]: amount } } }
  balanceSheets: {}, // { [year]: { iPucActual, iPucReceived, iiPucActual, iiPucReceived } }
  customCategories: [], // user-added expense categories beyond the defaults
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    return { ...structuredClone(DEFAULT_DATA), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = load();
const listeners = new Set();

function notify() {
  save(data);
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

// ---- Students ----
export function addStudent(student) {
  data.students = [...data.students, { ...student, id: uid() }];
  notify();
}

export function updateStudent(id, patch) {
  data.students = data.students.map((s) => (s.id === id ? { ...s, ...patch } : s));
  notify();
}

export function deleteStudent(id) {
  data.students = data.students.filter((s) => s.id !== id);
  notify();
}

// ---- Staff ----
export function addStaff(member) {
  data.staff = [...data.staff, { ...member, id: uid() }];
  notify();
}

export function updateStaff(id, patch) {
  data.staff = data.staff.map((s) => (s.id === id ? { ...s, ...patch } : s));
  notify();
}

export function deleteStaff(id) {
  data.staff = data.staff.filter((s) => s.id !== id);
  notify();
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
}

// Fill the balance sheet from student fee records for the given year.
export function syncBalanceSheetFromStudents(year) {
  const students = data.students.filter((s) => s.year === year);
  const sum = (cls, field) =>
    students
      .filter((s) => s.className === cls)
      .reduce((a, s) => a + Number(s[field] || 0), 0);
  setBalanceSheet(year, {
    iPucActual: sum('I PUC', 'feeAssigned'),
    iPucReceived: sum('I PUC', 'feePaid'),
    iiPucActual: sum('II PUC', 'feeAssigned'),
    iiPucReceived: sum('II PUC', 'feePaid'),
  });
}
