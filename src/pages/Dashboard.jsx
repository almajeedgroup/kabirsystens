import {
  getData, expensesAnnualTotal, getBalanceSheet, paidTotal, dueAmount,
  isEmpty, loadSampleData, firebaseAvailable,
} from '../store.js';
import { formatINR, MONTHS, monthLabel } from '../constants.js';
import { collectionStatus, dueStatus, figClass } from '../utils/status.js';
import { buildSampleData } from '../utils/sampleData.js';
import LineChart from '../components/LineChart.jsx';
import Avatar from '../components/Avatar.jsx';
import CardActions from '../components/CardActions.jsx';
import { useToast } from '../components/Toast.jsx';
import { exportCSV } from '../utils/export.js';
import {
  StudentsIcon, TeachersIcon, RupeeIcon, WalletIcon, ScaleIcon, PlusIcon,
} from '../components/Icons.jsx';

export default function Dashboard({ year, navigate }) {
  const { students, staff, expenses } = getData();
  const toast = useToast();
  // First-run onboarding: only in the local preview, only when truly empty.
  const showOnboarding = !firebaseAvailable && isEmpty();
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

  const kpis = [
    { icon: StudentsIcon, tone: 'purple', label: `Students · ${year}`, value: yearStudents.length, hint: `${yearStudents.filter((s) => s.className === 'I PUC').length} I PUC · ${yearStudents.filter((s) => s.className === 'II PUC').length} II PUC` },
    { icon: RupeeIcon, tone: 'pink', label: 'Fees Received', value: `₹ ${formatINR(totalReceived)}`, hint: `of ₹ ${formatINR(totalActual)} assigned` },
    { icon: TeachersIcon, tone: 'indigo', label: 'Teachers & Staff', value: staff.length, hint: 'Across the college' },
    { icon: WalletIcon, tone: 'orange', label: 'Total Expenses', value: `₹ ${formatINR(totalExpenses)}`, hint: `Academic year ${year}` },
  ];

  if (showOnboarding) {
    return (
      <>
        <div className="page-head">
          <div>
            <h2>Welcome</h2>
            <p>Your administration system is ready. Explore it with sample data, or start entering real records.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body onboarding">
            <span className="onboarding-icon"><StudentsIcon size={30} /></span>
            <h3>Get started</h3>
            <p>
              Load a realistic sample college — students with fee registers, staff, monthly
              expenses and a balance sheet — to see every feature in action. You can clear it
              anytime from <strong>Settings → Data</strong>.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={() => {
                  loadSampleData(buildSampleData());
                  toast('Sample data loaded — explore away');
                }}
              >
                <WalletIcon size={16} /> Load Sample Data
              </button>
              <button className="btn ghost" onClick={() => navigate('students')}>
                <PlusIcon size={16} /> Start Entering Records
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Welcome back</h2>
          <p>College overview for academic year {year}.</p>
        </div>
      </div>

      <div className="bento">
        {/* Highlight: expense trend (2×2) */}
        <div className="card col2 row2">
          <div className="card-head">
            <div>
              <h3>Expense Overview</h3>
              <div className="sub">Total spend per month, June {year.slice(0, 4)} – May {String(Number(year.slice(0, 4)) + 1).slice(2)}.</div>
            </div>
            <CardActions
              onRefresh={() => toast('Dashboard refreshed')}
              onDownload={() =>
                exportCSV(`monthly-expense-trend-${year}.csv`, [
                  ['Month', 'Total (₹)'],
                  ...MONTHS.map((_, mi) => [monthLabel(year, mi), monthTotals[mi]]),
                ])
              }
            />
          </div>
          <div className="card-body">
            <LineChart
              labels={MONTHS.map((_, mi) => monthLabel(year, mi))}
              series={[{ name: 'Expenses', color: '#4f46e5', values: monthTotals }]}
            />
          </div>
        </div>

        {/* KPI tiles (1×1 each) */}
        {kpis.map(({ icon: KpiIcon, tone, label, value, hint }) => (
          <div className={`kpi-card ${tone}`} key={label}>
            <span className="kpi-icon"><KpiIcon size={24} /></span>
            <div>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value">{value}</div>
              <div className="kpi-hint">{hint}</div>
            </div>
          </div>
        ))}

        {/* Outstanding dues (2×2) */}
        <div className="card col2 row2">
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

        {/* Expenses by category (2×2) */}
        <div className="card col2 row2">
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
                {categoryTotals.slice(0, 6).map(([cat, total]) => (
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

        {/* Fee position (2×2) */}
        <div className="card col2 row2">
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
                <div key={cls} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span>{cls}</span>
                    <span>₹ {formatINR(received)} / ₹ {formatINR(actual)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
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

        {/* Recently added students (2×2) */}
        <div className="card col2 row2">
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
                    <tr key={s.id} className="clickable" onClick={() => navigate('studentProfile', { id: s.id })}>
                      <td>
                        <div className="person-cell">
                          <Avatar name={s.name} photo={s.photo} size={34} />
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
      </div>
    </>
  );
}
