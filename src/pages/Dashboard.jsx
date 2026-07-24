import { getData, expensesAnnualTotal, getBalanceSheet } from '../store.js';
import { formatINR, MONTHS, monthLabel } from '../constants.js';

export default function Dashboard({ year }) {
  const { students, staff, expenses } = getData();
  const yearStudents = students.filter((s) => s.year === year);
  const sheet = getBalanceSheet(year);

  const totalExpenses = expensesAnnualTotal(year);
  const totalReceived = Number(sheet.iPucReceived) + Number(sheet.iiPucReceived);
  const totalActual = Number(sheet.iPucActual) + Number(sheet.iiPucActual);
  const annualDeficit = totalActual - totalReceived;

  const yearExpenses = expenses[year] || {};
  const monthTotals = MONTHS.map((_, mi) =>
    Object.values(yearExpenses).reduce((a, months) => a + Number(months[mi] || 0), 0)
  );

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Students ({year})</div>
          <div className="value">{yearStudents.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Staff Members</div>
          <div className="value">{staff.length}</div>
        </div>
        <div className="stat-card gold">
          <div className="label">Fees Received ({year})</div>
          <div className="value">₹ {formatINR(totalReceived)}</div>
        </div>
        <div className="stat-card gold">
          <div className="label">Total Expenses ({year})</div>
          <div className="value">₹ {formatINR(totalExpenses)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Annual Fee Deficit ({year})</div>
          <div className="value">₹ {formatINR(annualDeficit)}</div>
        </div>
      </div>

      <div className="card">
        <h2>Month-wise Expense Summary — {year}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Month</th>
                {MONTHS.map((_, mi) => (
                  <th scope="col" className="num" key={mi}>{monthLabel(year, mi)}</th>
                ))}
                <th scope="col" className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="total-row">
                <td>Expenses (₹)</td>
                {monthTotals.map((t, mi) => (
                  <td className="num" key={mi}>{t ? formatINR(t) : '—'}</td>
                ))}
                <td className="num">{formatINR(totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Class Strength — {year}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col" className="num">Students</th>
                <th scope="col" className="num">Fee Assigned (₹)</th>
                <th scope="col" className="num">Fee Received (₹)</th>
              </tr>
            </thead>
            <tbody>
              {['I PUC', 'II PUC'].map((cls) => {
                const list = yearStudents.filter((s) => s.className === cls);
                const assigned = list.reduce((a, s) => a + Number(s.feeAssigned || 0), 0);
                const paid = list.reduce((a, s) => a + Number(s.feePaid || 0), 0);
                return (
                  <tr key={cls}>
                    <td><span className="badge">{cls}</span></td>
                    <td className="num">{list.length}</td>
                    <td className="num">{formatINR(assigned)}</td>
                    <td className="num">{formatINR(paid)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
