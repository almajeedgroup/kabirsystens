import { useEffect, useState } from 'react';
import { getData, expensesAnnualTotal, getBalanceSheet, paidTotal, dueAmount } from '../store.js';
import { formatINR, MONTHS, monthLabel } from '../constants.js';
import BarChart from '../components/BarChart.jsx';
import Expenses from './Expenses.jsx';
import BalanceSheet from './BalanceSheet.jsx';
import ImportExport from './ImportExport.jsx';
import { RupeeIcon, WalletIcon, ScaleIcon, TeachersIcon } from '../components/Icons.jsx';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'expenses', label: 'Monthly Expenses' },
  { id: 'balance', label: 'Balance Sheet' },
  { id: 'importexport', label: 'Import & Export' },
];

function Overview({ year, setTab }) {
  const { students, staff, expenses } = getData();
  const yearStudents = students.filter((s) => s.year === year);
  const sheet = getBalanceSheet(year);

  const agreed = yearStudents.reduce((a, s) => a + Number(s.agreedAmount || 0), 0);
  const collected = yearStudents.reduce((a, s) => a + paidTotal(s), 0);
  const due = yearStudents.reduce((a, s) => a + dueAmount(s), 0);
  const totalExpenses = expensesAnnualTotal(year);
  const salaryOutgo = staff.reduce((a, s) => a + Number(s.salary || 0), 0);
  const net = collected - totalExpenses;

  const yearExpenses = expenses[year] || {};
  const monthTotals = MONTHS.map((_, mi) =>
    Object.values(yearExpenses).reduce((a, months) => a + Number(months[mi] || 0), 0)
  );

  const sheetActual = Number(sheet.iPucActual) + Number(sheet.iiPucActual);
  const sheetReceived = Number(sheet.iPucReceived) + Number(sheet.iiPucReceived);

  const tiles = [
    { icon: RupeeIcon, label: `Fees Collected · ${year}`, value: `₹ ${formatINR(collected)}`, hint: `of ₹ ${formatINR(agreed)} agreed`, tone: '' },
    { icon: ScaleIcon, label: 'Fees Due', value: `₹ ${formatINR(due)}`, hint: `${yearStudents.filter((s) => dueAmount(s) > 0).length} students pending`, tone: '' },
    { icon: WalletIcon, label: `Expenses · ${year}`, value: `₹ ${formatINR(totalExpenses)}`, hint: 'All categories', tone: 'gold' },
    { icon: TeachersIcon, label: 'Monthly Salary Outgo', value: `₹ ${formatINR(salaryOutgo)}`, hint: `${staff.length} teachers & staff`, tone: 'gold' },
    { icon: ScaleIcon, label: 'Net Position', value: `₹ ${formatINR(net)}`, hint: 'Collected − expenses', tone: 'deep' },
  ];

  return (
    <>
      <div className="stat-grid">
        {tiles.map(({ icon: TileIcon, label, value, hint, tone }) => (
          <div className="stat-card" key={label}>
            <span className={`stat-icon ${tone}`}><TileIcon /></span>
            <div>
              <div className="label">{label}</div>
              <div className="value" style={{ fontSize: '1.25rem' }}>{value}</div>
              <div className="hint">{hint}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Expense Trend — {year}</h3>
            <div className="sub">Total spend per month across every category.</div>
          </div>
          <button className="btn ghost small" onClick={() => setTab('expenses')}>
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
            <h3>Fee Register Position — {year}</h3>
            <button className="btn ghost small" onClick={() => setTab('balance')}>Balance sheet</button>
          </div>
          <div className="card-body">
            {['I PUC', 'II PUC'].map((cls) => {
              const clsStudents = yearStudents.filter((s) => s.className === cls);
              const clsAgreed = clsStudents.reduce((a, s) => a + Number(s.agreedAmount || 0), 0);
              const clsPaid = clsStudents.reduce((a, s) => a + paidTotal(s), 0);
              const pct = clsAgreed > 0 ? Math.min(100, (clsPaid / clsAgreed) * 100) : 0;
              return (
                <div key={cls} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 600 }}>
                    <span>{cls} · {clsStudents.length} students</span>
                    <span>₹ {formatINR(clsPaid)} / ₹ {formatINR(clsAgreed)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-50)', marginBottom: 0 }}>
              Figures come from each student's fee register (admission payment + instalments).
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Balance Sheet Snapshot — {year}</h3></div>
          <div className="card-body flush" style={{ paddingBottom: 0 }}>
            <table>
              <tbody>
                <tr>
                  <td>Actual Amount</td>
                  <td className="num">₹ {formatINR(sheetActual)}</td>
                </tr>
                <tr>
                  <td>Amount Received</td>
                  <td className="num">₹ {formatINR(sheetReceived)}</td>
                </tr>
                <tr>
                  <td>Expenses</td>
                  <td className="num">₹ {formatINR(totalExpenses)}</td>
                </tr>
                <tr className="total-row">
                  <td>DEFICIT ANNUAL</td>
                  <td className="num">₹ {formatINR(sheetActual - sheetReceived)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Finance({ year, view }) {
  const [tab, setTab] = useState(view.tab || 'overview');

  useEffect(() => {
    if (view.tab) setTab(view.tab);
  }, [view.tab]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Finance</h2>
          <p>Every financial record in one place — overview, expenses, balance sheet, import and export.</p>
        </div>
      </div>

      <div className="tabs no-print" role="tablist" aria-label="Finance sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview year={year} setTab={setTab} />}
      {tab === 'expenses' && <Expenses year={year} embedded />}
      {tab === 'balance' && <BalanceSheet year={year} embedded />}
      {tab === 'importexport' && <ImportExport year={year} />}
    </>
  );
}
