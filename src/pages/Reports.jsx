import {
  getData, getBalanceSheet, expensesAnnualTotal, paidTotal, dueAmount, feeDeficit,
} from '../store.js';
import {
  EXPENSE_CATEGORIES, MONTHS, monthLabel, formatINR, PAYMENT_STAGES,
} from '../constants.js';
import { exportCSV, exportWord } from '../utils/export.js';
import {
  DownloadIcon, PrintIcon, StudentsIcon, TeachersIcon, WalletIcon, ScaleIcon, ReportIcon, RupeeIcon,
} from '../components/Icons.jsx';

function studentRows(students, year) {
  const list = students.filter((s) => s.year === year);
  return [
    ['Adm. No.', 'Name', 'Guardian', 'Class', 'Combination', 'Language', 'Phone', 'Email', 'Address', 'Agreed Amount', 'Total Paid', 'Due Amount'],
    ...list.map((s) => [
      s.admissionNo,
      s.name,
      s.guardianName,
      s.className,
      s.combination,
      s.language,
      s.phone,
      s.email,
      s.address,
      s.agreedAmount,
      paidTotal(s),
      dueAmount(s),
    ]),
  ];
}

// Column-for-column reproduction of the college's fee register sheet.
function feeRegisterRows(students, year) {
  const list = students.filter((s) => s.year === year);
  const header = [
    'Sl.#', 'Name', 'Class', 'Combination', 'Language',
    'Actual Amount', 'Agreed Amount', 'Deficit',
    'Fee Payment Date', 'Receipt #', 'Mode of Payment', 'Fee Paid at the Time of Admission',
    '1st Instalment', 'Fee Payment Date', 'Receipt #', 'Mode of Payment',
    '2nd Instalment', 'Fee Payment Date', 'Receipt #', 'Mode of Payment',
    '3rd Instalment', 'Fee Payment Date', 'Receipt #', 'Mode of Payment',
    'Grand Total', 'Due Amount', 'Remarks',
  ];
  const rows = list.map((s, i) => {
    const p = (k) => s.payments?.[k] || {};
    const adm = p('admission');
    const insts = ['inst1', 'inst2', 'inst3'].flatMap((k) => {
      const inst = p(k);
      return [inst.amount, inst.date, inst.receipt, inst.mode];
    });
    return [
      i + 1, s.name, s.className, s.combination, s.language,
      s.actualAmount, s.agreedAmount, feeDeficit(s),
      adm.date, adm.receipt, adm.mode, adm.amount,
      ...insts,
      paidTotal(s), dueAmount(s), s.remarks,
    ];
  });
  return [header, ...rows];
}

function staffRows(staff) {
  return [
    ['Name', 'Designation', 'Subject', 'Qualification', 'Phone', 'Email', 'Joining Date', 'Monthly Salary'],
    ...staff.map((s) => [
      s.name, s.designation, s.subject, s.qualification, s.phone, s.email, s.joinDate, s.salary,
    ]),
  ];
}

function expenseRows(expenses, categories, year) {
  const yearData = expenses[year] || {};
  const header = ['Description', ...MONTHS.map((_, mi) => monthLabel(year, mi)), 'Total'];
  const rows = categories.map((cat) => {
    const months = MONTHS.map((_, mi) => Number(yearData[cat]?.[mi] || 0));
    return [cat, ...months, months.reduce((a, b) => a + b, 0)];
  });
  const totals = MONTHS.map((_, mi) =>
    categories.reduce((a, cat) => a + Number(yearData[cat]?.[mi] || 0), 0)
  );
  rows.push(['MONTHLY TOTAL', ...totals, totals.reduce((a, b) => a + b, 0)]);
  return [header, ...rows];
}

function balanceRows(sheet, expensesTotal) {
  const iDef = Number(sheet.iPucActual) - Number(sheet.iPucReceived);
  const iiDef = Number(sheet.iiPucActual) - Number(sheet.iiPucReceived);
  return [
    ['Class', 'Actual Amount', 'Amount Received', 'Deficit'],
    ['I PUC', sheet.iPucActual, sheet.iPucReceived, iDef],
    ['II PUC', sheet.iiPucActual, sheet.iiPucReceived, iiDef],
    [
      'TOTAL',
      Number(sheet.iPucActual) + Number(sheet.iiPucActual),
      Number(sheet.iPucReceived) + Number(sheet.iiPucReceived),
      iDef + iiDef,
    ],
    ['EXPENSES', expensesTotal, '', ''],
  ];
}

export default function Reports({ year }) {
  const { students, staff, expenses, customCategories } = getData();
  const categories = [...EXPENSE_CATEGORIES, ...customCategories];
  const sheet = getBalanceSheet(year);
  const expensesTotal = expensesAnnualTotal(year);

  const items = [
    {
      icon: StudentsIcon,
      title: `Student Register — ${year}`,
      desc: 'Every student admitted for the year, with contact and fee details.',
      csv: () => exportCSV(`students-${year}.csv`, studentRows(students, year)),
      word: () =>
        exportWord(`students-${year}.doc`, `Student Register ${year}`, [
          { rows: studentRows(students, year) },
        ]),
    },
    {
      icon: RupeeIcon,
      title: `Fee Register — ${year}`,
      desc: 'The full fee register: actual/agreed/deficit, admission payment and all three instalments with dates, receipts and payment modes, grand total, due and remarks.',
      csv: () => exportCSV(`fee-register-${year}.csv`, feeRegisterRows(students, year)),
      word: () =>
        exportWord(`fee-register-${year}.doc`, `Fee Register ${year}`, [
          { rows: feeRegisterRows(students, year) },
        ]),
    },
    {
      icon: TeachersIcon,
      title: 'Teachers & Staff Register',
      desc: 'All members with designation, subject, qualification and salary.',
      csv: () => exportCSV('teachers-staff.csv', staffRows(staff)),
      word: () => exportWord('teachers-staff.doc', 'Teachers & Staff Register', [{ rows: staffRows(staff) }]),
    },
    {
      icon: WalletIcon,
      title: `Monthly Expenses — ${year}`,
      desc: 'Category-wise expenses for every month, including custom categories.',
      csv: () => exportCSV(`expenses-${year}.csv`, expenseRows(expenses, categories, year)),
      word: () =>
        exportWord(`expenses-${year}.doc`, `Monthly Expenses ${year}`, [
          { rows: expenseRows(expenses, categories, year) },
        ]),
    },
    {
      icon: ScaleIcon,
      title: `Balance Sheet — ${year}`,
      desc: 'I PUC / II PUC actual, received and deficit, with annual expenses.',
      csv: () => exportCSV(`balance-sheet-${year}.csv`, balanceRows(sheet, expensesTotal)),
      word: () =>
        exportWord(`balance-sheet-${year}.doc`, `Balance Sheet ${year}`, [
          { rows: balanceRows(sheet, expensesTotal) },
        ]),
    },
    {
      icon: ReportIcon,
      title: `Complete Annual Report — ${year}`,
      desc: 'One Word document: balance sheet, expenses, students, teachers & staff.',
      word: () =>
        exportWord(`annual-report-${year}.doc`, `Annual Report ${year}`, [
          { title: 'Balance Sheet', rows: balanceRows(sheet, expensesTotal) },
          { title: 'Monthly Expenses', rows: expenseRows(expenses, categories, year) },
          { title: 'Fee Register', rows: feeRegisterRows(students, year) },
          { title: 'Student Register', rows: studentRows(students, year) },
          { title: 'Teachers & Staff Register', rows: staffRows(staff) },
        ]),
    },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Reports &amp; Export</h2>
          <p>
            Download registers as CSV (opens in Excel) or as Word reports on the college letterhead.
          </p>
        </div>
        <button className="btn ghost" onClick={() => window.print()}>
          <PrintIcon size={16} /> Print this page
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 260px))' }}>
        <div className="stat-card">
          <span className="stat-icon"><StudentsIcon /></span>
          <div>
            <div className="label">Students · {year}</div>
            <div className="value">{students.filter((s) => s.year === year).length}</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><TeachersIcon /></span>
          <div>
            <div className="label">Teachers &amp; Staff</div>
            <div className="value">{staff.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon gold"><WalletIcon /></span>
          <div>
            <div className="label">Annual Expenses</div>
            <div className="value">₹ {formatINR(expensesTotal)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Contents</th>
                <th scope="col">Download</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ icon: ItemIcon, title, desc, csv, word }) => (
                <tr key={title}>
                  <td>
                    <div className="person-cell">
                      <span className="stat-icon" style={{ width: 36, height: 36 }}>
                        <ItemIcon size={17} />
                      </span>
                      <span className="cell-strong">{title}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-70)' }}>{desc}</td>
                  <td>
                    <div className="btn-row">
                      {csv && (
                        <button className="btn subtle small" onClick={csv}>
                          <DownloadIcon size={15} /> CSV
                        </button>
                      )}
                      <button className="btn gold small" onClick={word}>
                        <DownloadIcon size={15} /> Word
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
