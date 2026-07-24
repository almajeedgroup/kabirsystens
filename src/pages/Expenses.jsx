import { getData, setExpense, getExpense } from '../store.js';
import { EXPENSE_CATEGORIES, MONTHS, monthLabel, formatINR } from '../constants.js';

export default function Expenses({ year }) {
  const { expenses } = getData();
  const yearData = expenses[year] || {};

  const rowTotal = (cat) =>
    Object.values(yearData[cat] || {}).reduce((a, b) => a + Number(b || 0), 0);
  const colTotal = (mi) =>
    EXPENSE_CATEGORIES.reduce((a, cat) => a + Number(yearData[cat]?.[mi] || 0), 0);
  const grandTotal = EXPENSE_CATEGORIES.reduce((a, cat) => a + rowTotal(cat), 0);

  return (
    <div className="card">
      <h2>Monthly Expenses — {year}</h2>
      <p className="no-print" style={{ marginTop: 0, fontSize: '0.85rem' }}>
        Enter the amount spent for each category and month. Totals update automatically.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Description</th>
              {MONTHS.map((_, mi) => (
                <th scope="col" className="num" key={mi}>{monthLabel(year, mi)}</th>
              ))}
              <th scope="col" className="num">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {EXPENSE_CATEGORIES.map((cat) => (
              <tr key={cat}>
                <th scope="row" style={{ background: 'var(--primary-light)', color: 'var(--text-dark)', textAlign: 'left' }}>
                  {cat}
                </th>
                {MONTHS.map((_, mi) => (
                  <td className="num" key={mi}>
                    <input
                      className="cell-input"
                      type="number"
                      min="0"
                      aria-label={`${cat} for ${monthLabel(year, mi)}`}
                      value={getExpense(year, cat, mi)}
                      onChange={(e) => setExpense(year, cat, mi, e.target.value)}
                    />
                  </td>
                ))}
                <td className="num deficit-pos">{formatINR(rowTotal(cat))}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Monthly Total (₹)</td>
              {MONTHS.map((_, mi) => (
                <td className="num" key={mi}>{formatINR(colTotal(mi))}</td>
              ))}
              <td className="num">{formatINR(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
