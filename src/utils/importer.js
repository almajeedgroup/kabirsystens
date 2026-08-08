import * as XLSX from 'xlsx';

// Excel / CSV importer with explicit column mapping.
// Reads a spreadsheet into { headers, rows }, suggests which source column
// feeds each app attribute, and lets the caller map/override before saving.

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
        // Find the header row: first row with 2+ non-empty cells.
        let headerIdx = matrix.findIndex((r) => r.filter((c) => String(c).trim() !== '').length >= 2);
        if (headerIdx < 0) headerIdx = 0;
        const headers = (matrix[headerIdx] || []).map((h) => String(h).trim());
        const rows = matrix.slice(headerIdx + 1).filter((r) => r.some((c) => String(c).trim() !== ''));
        resolve({ headers, rows });
      } catch {
        reject(new Error('This file could not be read as a spreadsheet.'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Target attributes per record type, in display order.
export const FIELD_SETS = {
  students: [
    { key: 'admissionNo', label: 'Admission No.', aliases: ['admno', 'admission'] },
    { key: 'name', label: 'Name', required: true, aliases: ['studentname', 'student'] },
    { key: 'guardianName', label: 'Guardian Name', aliases: ['guardian', 'fathername', 'father'] },
    { key: 'className', label: 'Class', aliases: ['class', 'course'] },
    { key: 'combination', label: 'Combination', aliases: ['group', 'stream'] },
    { key: 'language', label: 'Language' },
    { key: 'phone', label: 'Phone', aliases: ['mobile', 'contact', 'phoneno'] },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'dob', label: 'Date of Birth', aliases: ['dateofbirth', 'dob', 'birthdate'] },
    { key: 'actualAmount', label: 'Actual Amount', aliases: ['actual'] },
    { key: 'agreedAmount', label: 'Agreed Amount', aliases: ['agreed', 'feeassigned', 'totalfee'] },
    { key: 'admission.amount', label: 'Admission Fee Paid', aliases: ['feepaidatthetimeofadmission', 'admissionfee', 'feepaid'] },
    { key: 'admission.date', label: 'Admission Payment Date' },
    { key: 'admission.receipt', label: 'Admission Receipt #' },
    { key: 'admission.mode', label: 'Admission Mode' },
    { key: 'inst1.amount', label: '1st Instalment', aliases: ['1stinstalment', 'firstinstalment'] },
    { key: 'inst1.date', label: '1st Inst. Date' },
    { key: 'inst1.receipt', label: '1st Inst. Receipt #' },
    { key: 'inst1.mode', label: '1st Inst. Mode' },
    { key: 'inst2.amount', label: '2nd Instalment', aliases: ['2ndinstalment', 'secondinstalment'] },
    { key: 'inst2.date', label: '2nd Inst. Date' },
    { key: 'inst2.receipt', label: '2nd Inst. Receipt #' },
    { key: 'inst2.mode', label: '2nd Inst. Mode' },
    { key: 'inst3.amount', label: '3rd Instalment', aliases: ['3rdinstalment', 'thirdinstalment'] },
    { key: 'inst3.date', label: '3rd Inst. Date' },
    { key: 'inst3.receipt', label: '3rd Inst. Receipt #' },
    { key: 'inst3.mode', label: '3rd Inst. Mode' },
    { key: 'remarks', label: 'Remarks', aliases: ['remark', 'note'] },
  ],
  staff: [
    { key: 'employeeId', label: 'Employee ID', aliases: ['empid', 'empcode', 'emp', 'employeecode', 'staffid', 'code'] },
    { key: 'name', label: 'Name', required: true, aliases: ['staffname', 'teachername'] },
    { key: 'jobType', label: 'Job Type', aliases: ['type', 'employmenttype'] },
    { key: 'designation', label: 'Designation', aliases: ['role', 'post'] },
    { key: 'subject', label: 'Subject' },
    { key: 'qualification', label: 'Qualification', aliases: ['qualifications'] },
    { key: 'dob', label: 'Date of Birth', aliases: ['dateofbirth', 'dob', 'birthdate'] },
    { key: 'bloodGroup', label: 'Blood Group', aliases: ['blood'] },
    { key: 'aadhar', label: 'Aadhar No.', aliases: ['aadhaar', 'aadharno', 'uid'] },
    { key: 'phone', label: 'Phone', aliases: ['mobile', 'contact', 'phoneno'] },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'joinDate', label: 'Joining Date', aliases: ['joindate', 'joiningdate', 'joined'] },
    { key: 'salary', label: 'Monthly Salary', aliases: ['salary', 'monthlysalary', 'pay'] },
    { key: 'status', label: 'Status', aliases: ['active'] },
    { key: 'exitDate', label: 'Date of Leaving', aliases: ['leavingdate', 'exitdate'] },
    { key: 'workingHours', label: 'Working Hours', aliases: ['hours', 'workhours'] },
    { key: 'workingDays', label: 'Working Days', aliases: ['days', 'workdays'] },
    { key: 'timeTable', label: 'Time Table', aliases: ['timetable', 'schedule'] },
  ],
};

export const TYPE_LABELS = { students: 'Students', staff: 'Teachers & Staff' };

// Best-guess a source column index for each field (−1 = unmapped).
export function guessMapping(type, headers) {
  const normHeaders = headers.map(norm);
  const mapping = {};
  for (const field of FIELD_SETS[type]) {
    const candidates = [norm(field.label), norm(field.key.replace('.', '')), ...(field.aliases || []).map(norm)];
    let found = -1;
    for (let i = 0; i < normHeaders.length; i++) {
      const h = normHeaders[i];
      if (!h) continue;
      if (candidates.some((c) => c && (h === c || h.includes(c) || c.includes(h)))) {
        found = i;
        break;
      }
    }
    mapping[field.key] = found;
  }
  return mapping;
}

const clean = (v) => String(v ?? '').trim();
const money = (v) => clean(v).replace(/[^0-9.]/g, '');

function normClass(v) {
  const n = norm(v);
  if (n.startsWith('ii') || n.startsWith('2')) return 'II PUC';
  if (n.startsWith('i') || n.startsWith('1')) return 'I PUC';
  return clean(v);
}

// Build app records from rows + a mapping. Returns an array of records.
export function buildRecords(type, rows, mapping) {
  const at = (row, key) => {
    const i = mapping[key];
    return i >= 0 && i != null ? clean(row[i]) : '';
  };

  if (type === 'students') {
    const stage = (row, name) => {
      const amount = money(row[mapping[`${name}.amount`]] ?? '');
      const date = at(row, `${name}.date`);
      const receipt = at(row, `${name}.receipt`);
      const mode = at(row, `${name}.mode`);
      if (!amount && !date && !receipt && !mode) return null;
      return { amount, date, receipt, mode };
    };
    return rows
      .map((row) => {
        const rec = {
          admissionNo: at(row, 'admissionNo'),
          name: at(row, 'name'),
          guardianName: at(row, 'guardianName'),
          className: normClass(row[mapping.className] ?? ''),
          combination: at(row, 'combination'),
          language: at(row, 'language'),
          phone: at(row, 'phone'),
          email: at(row, 'email'),
          address: at(row, 'address'),
          dob: at(row, 'dob'),
          actualAmount: money(row[mapping.actualAmount] ?? ''),
          agreedAmount: money(row[mapping.agreedAmount] ?? ''),
          remarks: at(row, 'remarks'),
        };
        const payments = {};
        for (const s of ['admission', 'inst1', 'inst2', 'inst3']) {
          const p = stage(row, s);
          if (p) payments[s] = p;
        }
        if (Object.keys(payments).length) rec.payments = payments;
        return rec;
      })
      .filter((r) => r.name && !/^total/i.test(r.name));
  }

  // staff
  return rows
    .map((row) => {
      const statusRaw = at(row, 'status').toLowerCase();
      const daysRaw = at(row, 'workingDays');
      const workingDays = daysRaw
        ? daysRaw
            .split(/[\s,;/]+/)
            .map((d) => d.slice(0, 3))
            .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
            .filter((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(d))
        : [];
      const ttRaw = at(row, 'timeTable');
      const timeTable = {};
      if (ttRaw) {
        for (const part of ttRaw.split('|')) {
          const m = part.split(':');
          if (m.length >= 2) {
            const day = m[0].trim().slice(0, 3);
            const key = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            timeTable[key] = m.slice(1).join(':').trim();
          }
        }
      }
      return {
        employeeId: at(row, 'employeeId'),
        name: at(row, 'name'),
        jobType: at(row, 'jobType'),
        designation: at(row, 'designation'),
        subject: at(row, 'subject'),
        qualification: at(row, 'qualification'),
        dob: at(row, 'dob'),
        bloodGroup: at(row, 'bloodGroup'),
        aadhar: at(row, 'aadhar'),
        phone: at(row, 'phone'),
        email: at(row, 'email'),
        address: at(row, 'address'),
        joinDate: at(row, 'joinDate'),
        salary: money(row[mapping.salary] ?? ''),
        status: statusRaw.startsWith('left') || statusRaw === 'inactive' || statusRaw === 'false' ? 'left' : 'active',
        exitDate: at(row, 'exitDate'),
        workingHours: at(row, 'workingHours'),
        workingDays,
        timeTable,
      };
    })
    .filter((r) => r.name && !/^total/i.test(r.name));
}

// Suggest which record type a sheet is, from its headers.
export function suggestType(headers) {
  const h = headers.map(norm);
  const has = (...names) => names.some((n) => h.some((x) => x.includes(n)));
  if (has('designation', 'salary', 'employee', 'qualification', 'jobtype')) return 'staff';
  return 'students';
}
