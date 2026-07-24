import {
  getBalanceSheet,
  setBalanceSheet,
  syncBalanceSheetFromStudents,
  expensesAnnualTotal,
} from '../store.js';
import { formatINR } from '../constants.js';

export default function BalanceSheet({ year }) {
  const sheet = getBalanceSheet(year);
  const expenses = expensesAnnualTotal(year);

  const iPucDeficit = Number(sheet.iPucActual) - Number(sheet.iPucReceived);
  const iiPucDeficit = Number(sheet.iiPucActual) - Number(sheet.iiPucReceived);
  const totalActual = Number(sheet.iPucActual) + Number(sheet.iiPucActual);
  const totalReceived = Number(sheet.iPucReceived) + Number(sheet.iiPucReceived);
  const annualDeficit = totalActual - totalReceived;

  const numInput = (field, label) => (
    <input
      type="number"
      min="0"
      className="cell-input"
      style={{ width: 130 }}
      aria-label={label}
      value={sheet[field] || ''}
      onChange={(e) => setBalanceSheet(year, { [field]: e.target.value === '' ? 0 : Number(e.target.value) })}
    />
  );

  return (
    <>
      <div className="card">
        <h2>Balance Sheet {year}</h2>
        <div className="btn-row no-print" style={{ marginBottom: 14 }}>
          <button
            className="btn secondary"
            onClick={() => {
              if (window.confirm(`Fill amounts from the ${year} student fee records? Manually entered values will be replaced.`)) {
                syncBalanceSheetFromStudents(year);
              }
            }}
          >
            ⟳ Fill from Student Records
          </button>
        </div>
        <div className="table-wrap">
          <table style={{ maxWidth: 720 }}>
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col" className="num">Actual Amount (₹)</th>
                <th scope="col" className="num">Amount Received (₹)</th>
                <th scope="col" className="num">Deficit (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" style={{ background: 'var(--primary-light)', color: 'var(--text-dark)', textAlign: 'left' }}>I PUC</th>
                <td className="num">{numInput('iPucActual', 'I PUC actual amount')}</td>
                <td className="num">{numInput('iPucReceived', 'I PUC amount received')}</td>
                <td className="num deficit-pos">{formatINR(iPucDeficit)}</td>
              </tr>
              <tr>
                <th scope="row" style={{ background: 'var(--primary-light)', color: 'var(--text-dark)', textAlign: 'left' }}>II PUC</th>
                <td className="num">{numInput('iiPucActual', 'II PUC actual amount')}</td>
                <td className="num">{numInput('iiPucReceived', 'II PUC amount received')}</td>
                <td className="num deficit-pos">{formatINR(iiPucDeficit)}</td>
              </tr>
              <tr className="total-row">
                <td>TOTAL</td>
                <td className="num">{formatINR(totalActual)}</td>
                <td className="num">{formatINR(totalReceived)}</td>
                <td className="num">{formatINR(annualDeficit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Annual Summary — {year}</h2>
        <div className="table-wrap">
          <table style={{ maxWidth: 560 }}>
            <thead>
              <tr>
                <th scope="col">Particulars</th>
                <th scope="col" className="num">Rs./-</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Actual Amount</td>
                <td className="num">{formatINR(totalActual)}</td>
              </tr>
              <tr>
                <td>Amount Received</td>
                <td className="num">{formatINR(totalReceived)}</td>
              </tr>
              <tr>
                <td>Expenses <span style={{ fontSize: '0.78rem' }}>(from Monthly Expenses)</span></td>
                <td className="num">{formatINR(expenses)}</td>
              </tr>
              <tr className="total-row">
                <td>DEFICIT ANNUAL</td>
                <td className="num">{formatINR(annualDeficit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
