import { getData, expensesAnnualTotal, getBalanceSheet, paidTotal, dueAmount } from '../store.js';
import { formatINR, MONTHS, monthLabel } from '../constants.js';
import { collectionStatus, dueStatus, figClass } from '../utils/status.js';
import BarChart from '../components/BarChart.jsx';
import Avatar from '../components/Avatar.jsx';
import {
  StudentsIcon, TeachersIcon, RupeeIcon, WalletIcon, ScaleIcon,
} from '../components/Icons.jsx';

export default function Dashboard({ year, navigate }) {
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

  const recentStudents = [...yearStudents].slice(-5).reverse();

  // Students with outstanding dues, largest first.
  const defaulters = yearStudents
    .filter((s) => dueAmount(s) > 0)
    .sort((a, b) => dueAmount(b) - dueAmount(a))
    .slice(0, 6);

  // Expense totals by category for the year, largest first.
  const categoryTotals = Object.entries(yearExpenses)
    .map(([cat, months]) => [cat, Object.values(months).reduce((a, b) => a + Number(b || 0), 0)])
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryTotals[0]?.[1] || 1;

  const stats = [
    { icon: StudentsIcon, label: `Students · ${year}`, value: yearStudents.length, hint: `${yearStudents.filter((s) => s.className === 'I PUC').length} I PUC · ${yearStudents.filter((s) => s.className === 'II PUC').length} II PUC`, tone: '', status: '' },
    { icon: TeachersIcon, label: 'Teachers & Staff', value: staff.length, hint: 'Across the college', tone: '', status: '' },
    { icon: RupeeIcon, label: 'Fees Received', value: `₹ ${formatINR(totalReceived)}`, hint: `of ₹ ${formatINR(totalActual)} assigned`, tone: 'gold', status: collectionStatus(totalReceived, totalActual) },
    { icon: WalletIcon, label: 'Total Expenses', value: `₹ ${formatINR(totalExpenses)}`, hint: `Academic year ${year}`, tone: 'gold', status: '' },
    { icon: ScaleIcon, label: 'Annual Fee Deficit', value: `₹ ${formatINR(annualDeficit)}`, hint: 'Assigned − received', tone: 'deep', status: collectionStatus(totalReceived, totalActual) },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Welcome back</h2>
          <p>College overview for academic year {year}.</p>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map(({ icon: StatIcon, label, value, hint, tone, status }) => (
          <div className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}><StatIcon /></span>
            <div>
              <div className="label">{label}</div>
              <div className={`value ${figClass(status)}`}>{value}</div>
              <div className="hint">{hint}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Monthly Expenses</h3>
            <div className="sub">Total spend per month, June {year.slice(0, 4)} – May. Full breakdown in Monthly Expenses.</div>
          </div>
          <button className="btn ghost small" onClick={() => navigate('finance', { tab: 'expenses' })}>
            Open expense sheet
          </button>
        </div>
        <div className="card-body">
          <BarChart
            labels={MONTHS.map((_, mi) => monthLabel(year, mi))}
            values={monthTotals}
          />
        </div>
      </div>

      <div className="profile-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <h3>Recently Added Students</h3>
            <button className="btn ghost small" onClick={() => navigate('students')}>View all</button>
          </div>
          <div className="card-body flush">
            {recentStudents.length === 0 ? (
              <div className="empty-state">
                <span className="icon"><StudentsIcon /></span>
                <strong>No students yet</strong>
                <p>Admit students for {year} from the Students page.</p>
              </div>
            ) : (
              <table>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="clickable"
                      onClick={() => navigate('studentProfile', { id: s.id })}
                    >
                      <td>
                        <div className="person-cell">
                          <Avatar name={s.name} photo={s.photo} size={36} />
                          <div>
                            <div className="cell-strong">{s.name}</div>
                            <div className="meta">{s.admissionNo || 'No admission no.'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge">{s.className}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <h3>Fee Position — {year}</h3>
            <button className="btn ghost small" onClick={() => navigate('finance', { tab: 'balance' })}>Balance sheet</button>
          </div>
          <div className="card-body">
            {['I PUC', 'II PUC'].map((cls) => {
              const actual = Number(cls === 'I PUC' ? sheet.iPucActual : sheet.iiPucActual);
              const received = Number(cls === 'I PUC' ? sheet.iPucReceived : sheet.iiPucReceived);
              const pct = actual > 0 ? Math.min(100, (received / actual) * 100) : 0;
              return (
                <div key={cls} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>{cls}</span>
                    <span>₹ {formatINR(received)} / ₹ {formatINR(actual)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--ink-50)' }}>
                    {actual > 0 ? `${pct.toFixed(0)}% received · ₹ ${formatINR(actual - received)} pending` : 'No amounts recorded yet'}
                  </div>
                </div>
              );
            })}
            <div className="fee-figures">
              <div>
                <div className="k">Assigned</div>
                <div className="v">₹ {formatINR(totalActual)}</div>
              </div>
              <div>
                <div className="k">Received</div>
                <div className="v">₹ {formatINR(totalReceived)}</div>
              </div>
              <div>
                <div className="k">Deficit</div>
                <div className={`v ${figClass(collectionStatus(totalReceived, totalActual))}`}>₹ {formatINR(annualDeficit)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <h3>Outstanding Dues — {year}</h3>
            <button className="btn ghost small" onClick={() => navigate('students')}>All students</button>
          </div>
          <div className="card-body flush">
            {defaulters.length === 0 ? (
              <div className="empty-state">
                <span className="icon"><RupeeIcon /></span>
                <strong>No pending dues</strong>
                <p>Every student for {year} is fully paid, or no fees are recorded yet.</p>
              </div>
            ) : (
              <table>
                <tbody>
                  {defaulters.map((s) => (
                    <tr key={s.id} className="clickable" onClick={() => navigate('studentProfile', { id: s.id })}>
                      <td>
                        <div className="person-cell">
                          <Avatar name={s.name} photo={s.photo} size={34} />
                          <div>
                            <div className="cell-strong">{s.name}</div>
                            <div className="meta">{s.className}{s.combination ? ` · ${s.combination}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`num ${figClass(dueStatus(paidTotal(s), s.agreedAmount))}`} style={{ textAlign: 'right' }}>
                        ₹ {formatINR(dueAmount(s))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head">
            <h3>Expenses by Category — {year}</h3>
            <button className="btn ghost small" onClick={() => navigate('finance', { tab: 'expenses' })}>Expense sheet</button>
          </div>
          <div className="card-body">
            {categoryTotals.length === 0 ? (
              <div className="empty-state">
                <span className="icon"><WalletIcon /></span>
                <strong>No expenses yet</strong>
                <p>Record spending on the Finance → Monthly Expenses tab.</p>
              </div>
            ) : (
              <div className="cat-bars">
                {categoryTotals.slice(0, 8).map(([cat, total]) => (
                  <div className="cat-bar" key={cat}>
                    <div className="cat-bar-head">
                      <span>{cat}</span>
                      <span className="cell-strong">₹ {formatINR(total)}</span>
                    </div>
                    <div className="cat-bar-track">
                      <div className="cat-bar-fill" style={{ width: `${(total / maxCategory) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
