// CSV import engine: parses a file, detects which domain it belongs to
// (fee register / students / teachers & staff / expenses / balance sheet)
// by inspecting its headers, and maps every column onto the app's fields.

// ---- Parsing ----
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

const norm = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const MONTH_INDEX = {
  jun: 0, jul: 1, aug: 2, sep: 3, oct: 4, nov: 5,
  dec: 6, jan: 7, feb: 8, mar: 9, apr: 10, may: 11,
};

function monthOf(header) {
  const n = norm(header);
  for (const [m, idx] of Object.entries(MONTH_INDEX)) {
    if (n.startsWith(m)) return idx;
  }
  return null;
}

// ---- Detection ----
// Returns { type, label, headerRowIndex } or null when nothing matches.
export function detectDomain(rows) {
  // The header may not be the first row (e.g. a grouped title row above it) —
  // scan the first few rows for the best match.
  for (let hi = 0; hi < Math.min(rows.length, 4); hi++) {
    const headers = rows[hi].map(norm);
    const has = (...names) => names.some((n) => headers.includes(n));
    const monthCols = rows[hi].filter((h) => monthOf(h) !== null).length;

    if (has('description', 'category') && monthCols >= 3) {
      return { type: 'expenses', label: 'Monthly Expenses', headerRowIndex: hi };
    }
    if (has('class') && has('actualamount') && has('amountreceived')) {
      return { type: 'balance', label: 'Balance Sheet', headerRowIndex: hi };
    }
    if (has('agreedamount', '1stinstalment', 'feepaidatthetimeofadmission', 'grandtotal')) {
      return { type: 'feeRegister', label: 'Student Fee Register', headerRowIndex: hi };
    }
    if (has('name') && has('designation', 'salary', 'monthlysalary', 'qualification')) {
      return { type: 'staff', label: 'Teachers & Staff', headerRowIndex: hi };
    }
    if (
      has('name', 'studentname') &&
      has('class', 'guardian', 'guardianname', 'admissionno', 'admno', 'combination', 'feeassigned', 'feepaid')
    ) {
      return { type: 'students', label: 'Students', headerRowIndex: hi };
    }
  }
  return null;
}

function normClass(v) {
  const n = norm(v);
  if (n.startsWith('ii') || n.startsWith('2')) return 'II PUC';
  if (n.startsWith('i') || n.startsWith('1')) return 'I PUC';
  return String(v || '').trim();
}

// ---- Row mapping ----
// Maps data rows onto app-shaped records for the detected domain.
export function mapRows(rows, detection) {
  const header = rows[detection.headerRowIndex];
  const body = rows.slice(detection.headerRowIndex + 1);
  const keys = header.map(norm);
  const idx = (...names) => keys.findIndex((k) => names.includes(k));
  const val = (row, i) => (i >= 0 ? String(row[i] ?? '').trim() : '');

  if (detection.type === 'expenses') {
    const descI = idx('description', 'category');
    const monthCols = header
      .map((h, i) => ({ i, m: monthOf(h) }))
      .filter((c) => c.m !== null);
    return body
      .map((row) => ({
        category: val(row, descI),
        months: Object.fromEntries(
          monthCols
            .filter((c) => val(row, c.i) !== '')
            .map((c) => [c.m, Number(val(row, c.i).replace(/[^0-9.-]/g, '')) || 0])
        ),
      }))
      .filter(
        (r) =>
          r.category &&
          !/^(monthly\s*total|total|grand\s*total)/i.test(r.category)
      );
  }

  if (detection.type === 'balance') {
    const clsI = idx('class');
    const actI = idx('actualamount');
    const recI = idx('amountreceived');
    const sheet = {};
    for (const row of body) {
      const cls = normClass(val(row, clsI));
      const actual = Number(val(row, actI).replace(/[^0-9.-]/g, '')) || 0;
      const received = Number(val(row, recI).replace(/[^0-9.-]/g, '')) || 0;
      if (cls === 'I PUC') Object.assign(sheet, { iPucActual: actual, iPucReceived: received });
      if (cls === 'II PUC') Object.assign(sheet, { iiPucActual: actual, iiPucReceived: received });
    }
    return sheet;
  }

  if (detection.type === 'staff') {
    return body
      .map((row) => {
        const statusRaw = val(row, idx('status')).toLowerCase();
        return {
          name: val(row, idx('name', 'staffname', 'teachername')),
          designation: val(row, idx('designation')),
          subject: val(row, idx('subject')),
          qualification: val(row, idx('qualification')),
          phone: val(row, idx('phone', 'mobile', 'contact', 'phoneno')),
          email: val(row, idx('email')),
          address: val(row, idx('address')),
          salary: val(row, idx('salary', 'monthlysalary')).replace(/[^0-9.]/g, ''),
          joinDate: val(row, idx('joindate', 'joiningdate', 'joined')),
          status: statusRaw.startsWith('left') || statusRaw === 'inactive' ? 'left' : 'active',
          exitDate: val(row, idx('dateofleaving', 'exitdate', 'leavingdate', 'dateofexit')),
        };
      })
      .filter((r) => r.name);
  }

  // Students and the full fee register share the basic fields.
  const base = (row) => ({
    admissionNo: val(row, idx('admissionno', 'admno')),
    name: val(row, idx('name', 'studentname')),
    guardianName: val(row, idx('guardian', 'guardianname', 'fathername')),
    className: normClass(val(row, idx('class'))),
    combination: val(row, idx('combination')),
    language: val(row, idx('language')),
    phone: val(row, idx('phone', 'mobile', 'contact', 'phoneno')),
    email: val(row, idx('email')),
    address: val(row, idx('address')),
    dob: val(row, idx('dob', 'dateofbirth')),
    remarks: val(row, idx('remarks', 'remark')),
  });
  const money = (row, i) => val(row, i).replace(/[^0-9.]/g, '');

  if (detection.type === 'students') {
    const assignedI = idx('feeassigned', 'agreedamount');
    const paidI = idx('feepaid', 'totalpaid');
    return body
      .map((row) => {
        const s = base(row);
        s.actualAmount = money(row, idx('actualamount')) || money(row, assignedI);
        s.agreedAmount = money(row, assignedI);
        const paid = money(row, paidI);
        if (paid) {
          s.payments = {
            admission: { amount: paid, date: '', receipt: '', mode: '' },
          };
        }
        return s;
      })
      .filter((r) => r.name && !/^total/i.test(r.name));
  }

  // feeRegister: repeated Date / Receipt / Mode columns belong to the
  // admission payment and the three instalments in encounter order.
  const stageOrder = ['admission', 'inst1', 'inst2', 'inst3'];
  const dates = [];
  const receipts = [];
  const modes = [];
  keys.forEach((k, i) => {
    if (k === 'feepaymentdate' || k === 'paymentdate' || k === 'date') dates.push(i);
    else if (k === 'receipt' || k === 'receiptno') receipts.push(i);
    else if (k === 'modeofpayment' || k === 'mode') modes.push(i);
  });
  const amountIdx = {
    admission: idx('feepaidatthetimeofadmission', 'admissionpayment'),
    inst1: idx('1stinstalment', 'firstinstalment', '1stinstallment'),
    inst2: idx('2ndinstalment', 'secondinstalment', '2ndinstallment'),
    inst3: idx('3rdinstalment', 'thirdinstalment', '3rdinstallment'),
  };
  return body
    .map((row) => {
      const s = base(row);
      s.actualAmount = money(row, idx('actualamount'));
      s.agreedAmount = money(row, idx('agreedamount'));
      s.payments = {};
      stageOrder.forEach((stage, si) => {
        s.payments[stage] = {
          amount: money(row, amountIdx[stage]),
          date: val(row, dates[si] ?? -1),
          receipt: val(row, receipts[si] ?? -1),
          mode: val(row, modes[si] ?? -1),
        };
      });
      return s;
    })
    .filter((r) => r.name && !/^total/i.test(r.name));
}
