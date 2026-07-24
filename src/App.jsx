import { useEffect, useState, useSyncExternalStore } from 'react';
import { COLLEGE, academicYearOptions, currentAcademicYear } from './constants.js';
import { subscribe, getData } from './store.js';
import Logo from './components/Logo.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Staff from './pages/Staff.jsx';
import Expenses from './pages/Expenses.jsx';
import BalanceSheet from './pages/BalanceSheet.jsx';
import Reports from './pages/Reports.jsx';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂', component: Dashboard },
  { id: 'students', label: 'Students', icon: '🎓', component: Students },
  { id: 'staff', label: 'Staff', icon: '👥', component: Staff },
  { id: 'expenses', label: 'Monthly Expenses', icon: '₹', component: Expenses },
  { id: 'balance', label: 'Balance Sheet', icon: '⚖', component: BalanceSheet },
  { id: 'reports', label: 'Reports & Export', icon: '⇩', component: Reports },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [year, setYear] = useState(currentAcademicYear());

  // Re-render whenever the data store changes.
  useSyncExternalStore(subscribe, getData);

  useEffect(() => {
    document.title = `${COLLEGE.name} — Administration`;
  }, []);

  const active = PAGES.find((p) => p.id === page);
  const Page = active.component;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={46} dark />
          <div>
            <strong>{COLLEGE.name}</strong>
            <small>{COLLEGE.unit}</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {PAGES.map((p) => (
            <button
              key={p.id}
              className={`nav-btn${p.id === page ? ' active' : ''}`}
              onClick={() => setPage(p.id)}
              aria-current={p.id === page ? 'page' : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          Software by {COLLEGE.developer}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{active.label}</h1>
          <div className="year-picker">
            <label htmlFor="year-select"><strong>Academic Year</strong></label>
            <select
              id="year-select"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {academicYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="content">
          <div className="print-letterhead">
            <h2 style={{ margin: 0 }}>{COLLEGE.name.toUpperCase()}</h2>
            <div>{COLLEGE.unit.toUpperCase()}</div>
          </div>
          <Page year={year} />
        </main>
      </div>
    </div>
  );
}
