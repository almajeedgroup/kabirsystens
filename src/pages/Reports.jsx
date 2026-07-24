import {
  getData,
  getBalanceSheet,
  expensesAnnualTotal,
} from '../store.js';
import { EXPENSE_CATEGORIES, MONTHS, monthLabel, formatINR } from '../constants.js';
import { exportCSV, exportWord } from '../utils/export.js';

function studentRows(students, year) {
  const list = students.filter((s) => s.year === year);
  return [
    ['Adm. No.', 'Name', 'Guardian', 'Class', 'Phone', 'Address', 'Fee Assigned', 'Fee Paid', 'Balance'],
    ...list.map((s) => [
      s.admissionNo,
      s.name,
      s.guardianName,
      s.className,
      s.phone,
      s.address,
      s.feeAssigned,
      s.feePaid,
      Number(s.feeAssigned || 0) - Number(s.feePaid || 0),
    ]),
  ];
}

function staffRows(staff) {
  return [
    ['Name', 'Designation', 'Phone', 'Joining Date', 'Monthly Salary'],
    ...staff.map((s) => [s.name, s.designation, s.phone, s.joinDate, s.salary]),
  ];
}

function expenseRows(expenses, year) {
  const yearData = expenses[year] || {};
  const header = ['Description', ...MONTHS.map((_, mi) => monthLabel(year, mi)), 'Total'];
  const rows = EXPENSE_CATEGORIES.map((cat) => {
    const months = MONTHS.map((_, mi) => Number(yearData[cat]?.[mi] || 0));
    return [cat, ...months, months.reduce((a, b) => a + b, 0)];
  });
  const totals = MONTHS.map((_, mi) =>
    EXPENSE_CATEGORIES.reduce((a, cat) => a + Number(yearData[cat]?.[mi] || 0), 0)
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
  const { students, staff, expenses } = getData();
  const sheet = getBalanceSheet(year);
  const expensesTotal = expensesAnnualTotal(year);

  const items = [
    {
      title: `Student Register — ${year}`,
      desc: 'All students admitted for the selected academic year, with fee details.',
      csv: () => exportCSV(`students-${year}.csv`, studentRows(students, year)),
      word: () =>
        exportWord(`students-${year}.doc`, `Student Register ${year}`, [
          { rows: studentRows(students, year) },
        ]),
    },
    {
      title: 'Staff Register',
      desc: 'All staff members with designation and monthly salary.',
      csv: () => exportCSV('staff.csv', staffRows(staff)),
      word: () => exportWord('staff.doc', 'Staff Register', [{ rows: staffRows(staff) }]),
    },
    {
      title: `Monthly Expenses — ${year}`,
      desc: 'Category-wise expenses for every month of the academic year.',
      csv: () => exportCSV(`expenses-${year}.csv`, expenseRows(expenses, year)),
      word: () =>
        exportWord(`expenses-${year}.doc`, `Monthly Expenses ${year}`, [
          { rows: expenseRows(expenses, year) },
        ]),
    },
    {
      title: `Balance Sheet — ${year}`,
      desc: 'I PUC / II PUC actual, received and deficit amounts with annual expenses.',
      csv: () => exportCSV(`balance-sheet-${year}.csv`, balanceRows(sheet, expensesTotal)),
      word: () =>
        exportWord(`balance-sheet-${year}.doc`, `Balance Sheet ${year}`, [
          { rows: balanceRows(sheet, expensesTotal) },
        ]),
    },
    {
      title: `Complete Annual Report — ${year}`,
      desc: 'One Word document containing balance sheet, expenses, students and staff.',
      word: () =>
        exportWord(`annual-report-${year}.doc`, `Annual Report ${year}`, [
          { title: 'Balance Sheet', rows: balanceRows(sheet, expensesTotal) },
          { title: 'Monthly Expenses', rows: expenseRows(expenses, year) },
          { title: 'Student Register', rows: studentRows(students, year) },
          { title: 'Staff Register', rows: staffRows(staff) },
        ]),
    },
  ];

  return (
    <>
      <div className="card">
        <h2>Export Data — {year}</h2>
        <p style={{ marginTop: 0, fontSize: '0.85rem' }}>
          Download any register as a CSV file (opens in Excel) or a formatted Word
          report on the college letterhead. Use <strong>Print</strong> on any page
          (Ctrl&nbsp;+&nbsp;P) for a print/PDF copy.
        </p>
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
              {items.map((item) => (
                <tr key={item.title}>
                  <td><strong>{item.title}</strong></td>
                  <td>{item.desc}</td>
                  <td>
                    <div className="btn-row">
                      {item.csv && (
                        <button className="btn small" onClick={item.csv}>⇩ CSV</button>
                      )}
                      <button className="btn small secondary" onClick={item.word}>⇩ Word</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Quick Figures — {year}</h2>
        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="label">Students</div>
            <div className="value">{students.filter((s) => s.year === year).length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Staff</div>
            <div className="value">{staff.length}</div>
          </div>
          <div className="stat-card gold">
            <div className="label">Annual Expenses</div>
            <div className="value">₹ {formatINR(expensesTotal)}</div>
          </div>
        </div>
      </div>
    </>
  );
}
