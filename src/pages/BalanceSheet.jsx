import {
  getBalanceSheet,
  setBalanceSheet,
  syncBalanceSheetFromStudents,
  expensesAnnualTotal,
} from '../store.js';
import { formatINR } from '../constants.js';
import { collectionStatus, figClass } from '../utils/status.js';
import { SyncIcon } from '../components/Icons.jsx';

export default function BalanceSheet({ year, embedded = false }) {
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
      style={{ width: 140 }}
      aria-label={label}
      value={sheet[field] || ''}
      onChange={(e) =>
        setBalanceSheet(year, { [field]: e.target.value === '' ? 0 : Number(e.target.value) })
      }
    />
  );

  return (
    <>
      <div className={embedded ? 'section-head' : 'page-head'}>
        <div>
          {!embedded && <h2>Balance Sheet {year}</h2>}
          <p style={embedded ? { marginTop: 0 } : undefined}>Class-wise fee position and the annual summary for the academic year.</p>
        </div>
        <button
          className="btn gold no-print"
          onClick={() => {
            if (
              window.confirm(
                `Fill amounts from the ${year} student fee records? Manually entered values will be replaced.`
              )
            ) {
              syncBalanceSheetFromStudents(year);
            }
          }}
        >
          <SyncIcon size={16} /> Fill from Student Records
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Class-wise Position</h3>
        </div>
        <div className="card-body flush" style={{ paddingBottom: 0 }}>
          <div className="table-wrap">
            <table>
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
                  <td className="cell-strong">I PUC</td>
                  <td className="num">{numInput('iPucActual', 'I PUC actual amount')}</td>
                  <td className="num">{numInput('iPucReceived', 'I PUC amount received')}</td>
                  <td className={`num ${figClass(collectionStatus(sheet.iPucReceived, sheet.iPucActual))}`}>{formatINR(iPucDeficit)}</td>
                </tr>
                <tr>
                  <td className="cell-strong">II PUC</td>
                  <td className="num">{numInput('iiPucActual', 'II PUC actual amount')}</td>
                  <td className="num">{numInput('iiPucReceived', 'II PUC amount received')}</td>
                  <td className={`num ${figClass(collectionStatus(sheet.iiPucReceived, sheet.iiPucActual))}`}>{formatINR(iiPucDeficit)}</td>
                </tr>
                <tr className="total-row">
                  <td>TOTAL</td>
                  <td className="num">₹ {formatINR(totalActual)}</td>
                  <td className="num">₹ {formatINR(totalReceived)}</td>
                  <td className={`num ${figClass(collectionStatus(totalReceived, totalActual))}`}>₹ {formatINR(annualDeficit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <h3>Annual Summary — {year}</h3>
          </div>
          <div className="card-body flush" style={{ paddingBottom: 0 }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Particulars</th>
                  <th scope="col" className="num">Rs./-</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Actual Amount</td>
                  <td className="num">₹ {formatINR(totalActual)}</td>
                </tr>
                <tr>
                  <td>Amount Received</td>
                  <td className="num">₹ {formatINR(totalReceived)}</td>
                </tr>
                <tr>
                  <td>
                    Expenses{' '}
                    <span style={{ fontSize: '0.76rem', color: 'var(--ink-50)' }}>
                      (from Monthly Expenses)
                    </span>
                  </td>
                  <td className="num">₹ {formatINR(expenses)}</td>
                </tr>
                <tr className="total-row">
                  <td>DEFICIT ANNUAL</td>
                  <td className={`num ${figClass(collectionStatus(totalReceived, totalActual))}`}>₹ {formatINR(annualDeficit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <h3>Fee Collection Progress</h3>
          </div>
          <div className="card-body">
            {[
              ['I PUC', Number(sheet.iPucActual), Number(sheet.iPucReceived)],
              ['II PUC', Number(sheet.iiPucActual), Number(sheet.iiPucReceived)],
            ].map(([cls, actual, received]) => {
              const pct = actual > 0 ? Math.min(100, (received / actual) * 100) : 0;
              return (
                <div key={cls} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{cls}</span>
                    <span>{actual > 0 ? `${pct.toFixed(0)}% received` : 'No data'}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-50)', marginBottom: 0 }}>
              Deficit is the assigned amount minus what has been received.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
