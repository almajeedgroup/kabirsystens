export const COLLEGE = {
  name: 'Kabir Ind PU College for Women',
  fullName: 'Kabir Independent PU College for Women',
  unit: 'A Unit of Islamic Information Centre',
  developer: 'Al-Majeed Algorithms',
};

// Academic year runs June through May.
export const MONTHS = [
  'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
  'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May',
];

export const EXPENSE_CATEGORIES = [
  'Salaries',
  'Transport (Auto)',
  'College Rent',
  'Electricity',
  'Water',
  'Telephone',
  'Petrol',
  'WiFi',
  'Pantry',
  'Beverage',
  'Housekeeping',
  'Miscellaneous',
];

export const CLASSES = ['I PUC', 'II PUC'];

// "2025-26" style labels. Month labels for a year like 2025-26 are
// Jun-25 ... Dec-25, Jan-26 ... May-26.
export function monthLabel(year, monthIndex) {
  const [start] = year.split('-');
  const startYY = Number(start) % 100;
  const yy = monthIndex < 7 ? startYY : (startYY + 1) % 100;
  return `${MONTHS[monthIndex]}-${String(yy).padStart(2, '0')}`;
}

export function academicYearOptions() {
  // From 2022-23 up to two years past the current academic year.
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [];
  for (let y = 2022; y <= startYear + 2; y++) {
    years.push(`${y}-${String((y + 1) % 100).padStart(2, '0')}`);
  }
  return years;
}

export function currentAcademicYear() {
  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function formatINR(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
