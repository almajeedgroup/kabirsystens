import { currentAcademicYear, EXPENSE_CATEGORIES } from '../constants.js';

// A realistic, self-contained dataset for exploring the app. Not used in
// Firebase mode — it's an exploration aid for the local preview.
export function buildSampleData() {
  const year = currentAcademicYear();

  const blank = { amount: '', date: '', receipt: '', mode: '' };
  const pay = (adm, i1, i2) => ({
    admission: adm ? { amount: adm, date: '2025-06-05', receipt: 'R-101', mode: 'Cash' } : { ...blank },
    inst1: i1 ? { amount: i1, date: '2025-09-10', receipt: 'R-142', mode: 'UPI' } : { ...blank },
    inst2: i2 ? { amount: i2, date: '2026-01-08', receipt: 'R-205', mode: 'Bank Transfer' } : { ...blank },
    inst3: { ...blank },
  });

  const students = [
    ['Ayesha Siddiqua', 'I PUC', 'PCMB', 'Urdu', 'Mohammed Rafiq', 26000, 24000, pay(12000, 12000)],
    ['Fathima Zahra', 'I PUC', 'CEBA', 'Kannada', 'Abdul Kareem', 26000, 26000, pay(14000, 12000)],
    ['Khadija Bano', 'I PUC', 'PCMB', 'Urdu', 'Rahmat Ali', 26000, 22000, pay(0, 0)],
    ['Sumaiya Kausar', 'I PUC', 'PCMC', 'Hindi', 'Iqbal Ahmed', 26000, 24000, pay(10000, 7000)],
    ['Zainab Begum', 'II PUC', 'PCMC', 'Urdu', 'Syed Hussain', 28000, 25000, pay(9000, 6000)],
    ['Maryam Khan', 'II PUC', 'CEBA', 'Hindi', 'Imran Khan', 28000, 28000, pay(14000, 14000)],
    ['Hafsa Anjum', 'II PUC', 'CEBA', 'Kannada', 'Nazeer Ahmed', 28000, 28000, pay(28000, 0)],
    ['Ruqayya Sultana', 'II PUC', 'PCMB', 'Urdu', 'Ghulam Mustafa', 28000, 26000, pay(10000, 0)],
  ].map(([name, className, combination, language, guardianName, actualAmount, agreedAmount, payments], i) => ({
    id: `sample-s${i + 1}`,
    admissionNo: `2025/0${i + 1}`,
    name,
    className,
    combination,
    language,
    guardianName,
    phone: `98450 1${String(i).padStart(4, '0')}`,
    email: '',
    address: 'Bengaluru, Karnataka',
    dob: '',
    year,
    actualAmount,
    agreedAmount,
    remarks: agreedAmount < actualAmount ? 'Fee concession approved' : '',
    photo: '',
    payments,
  }));

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const tt = (subject) => ({
    Mon: `P1 ${subject} · P4 ${subject}`,
    Tue: `P2 ${subject} · P5 ${subject} Lab`,
    Wed: `P1 ${subject} · P3 ${subject}`,
    Thu: `P2 ${subject} · P6 ${subject}`,
    Fri: `P3 ${subject} · P5 ${subject}`,
    Sat: `P1 ${subject}`,
  });

  const staff = [
    ['Prof. Nusrath Jahan', 'Teaching (Full-time)', 'Principal', 'Administration', 'M.A, B.Ed, Ph.D', 45000, '2022-06-01', 'active', '', 'B+'],
    ['Sana Tabassum', 'Teaching (Full-time)', 'Lecturer', 'Physics', 'M.Sc, B.Ed', 28000, '2023-06-01', 'active', '', 'O+'],
    ['Rehana Parveen', 'Teaching (Full-time)', 'Lecturer', 'Chemistry', 'M.Sc', 28000, '2023-06-01', 'active', '', 'A+'],
    ['Asma Farheen', 'Teaching (Part-time)', 'Lecturer', 'Mathematics', 'M.Sc, B.Ed', 27000, '2024-06-01', 'active', '', 'AB+'],
    ['Bibi Hajira', 'Non-Teaching', 'Office Staff', 'Accounts', 'B.Com', 18000, '2023-06-15', 'active', '', 'O-'],
    ['Shabana Kausar', 'Teaching (Full-time)', 'Lecturer', 'Biology', 'M.Sc', 27000, '2022-06-01', 'left', '2026-07-15', 'B-'],
  ].map(([name, jobType, designation, subject, qualification, salary, joinDate, status, exitDate, bloodGroup], i) => {
    const teaching = jobType.startsWith('Teaching');
    const days = jobType === 'Teaching (Part-time)' ? ['Mon', 'Wed', 'Fri'] : allDays;
    return {
      id: `sample-t${i + 1}`,
      name,
      employeeId: `EMP-${String(i + 1).padStart(3, '0')}`,
      jobType,
      designation,
      subject,
      qualification,
      phone: `98800 2${String(i).padStart(4, '0')}`,
      email: '',
      address: 'Bengaluru, Karnataka',
      dob: `19${85 + i}-0${(i % 9) + 1}-1${i % 9}`,
      bloodGroup,
      aadhar: `${4000 + i} ${5000 + i} ${6000 + i}`,
      salary,
      joinDate,
      status,
      exitDate,
      workingHours: teaching ? '9:00 AM – 4:00 PM' : '9:30 AM – 5:30 PM',
      workingDays: days,
      timeTable: teaching && subject !== 'Administration' ? tt(subject) : {},
      photo: '',
    };
  });

  // Monthly expenses (June–Jan filled), salaries dominant.
  const monthlyBase = {
    Salaries: 146000,
    'Transport (Auto)': 3000,
    'College Rent': 35000,
    Electricity: 5200,
    Water: 1800,
    Telephone: 1200,
    Petrol: 2600,
    WiFi: 1500,
    Pantry: 3400,
    Beverage: 1600,
    Housekeeping: 6000,
    Miscellaneous: 2500,
  };
  const expenses = { [year]: {} };
  for (const cat of EXPENSE_CATEGORIES) {
    expenses[year][cat] = {};
    for (let m = 0; m < 8; m++) {
      const base = monthlyBase[cat] || 2000;
      expenses[year][cat][m] = Math.round(base * (0.94 + (m % 3) * 0.03));
    }
  }

  const sum = (cls, field) =>
    students.filter((s) => s.className === cls).reduce((a, s) => a + Number(s[field] || 0), 0);
  const paid = (cls) =>
    students
      .filter((s) => s.className === cls)
      .reduce((a, s) => a + Object.values(s.payments).reduce((x, p) => x + Number(p.amount || 0), 0), 0);

  const balanceSheets = {
    [year]: {
      iPucActual: sum('I PUC', 'actualAmount'),
      iPucReceived: paid('I PUC'),
      iiPucActual: sum('II PUC', 'actualAmount'),
      iiPucReceived: paid('II PUC'),
    },
  };

  return {
    students,
    staff,
    expenses,
    balanceSheets,
    customCategories: ['Stationery', 'Exam Fees'],
    settings: {
      collegeName: 'Kabir Ind PU College for Women',
      unit: 'A Unit of Islamic Information Centre',
      address: 'Bengaluru, Karnataka',
      phone: '',
      email: '',
      logo: '',
    },
  };
}
