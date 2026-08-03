import { useEffect, useState, useSyncExternalStore } from 'react';
import { COLLEGE, academicYearOptions, currentAcademicYear } from './constants.js';
import { subscribe, getData, getSettings } from './store.js';
import Logo from './components/Logo.jsx';
import {
  HomeIcon, StudentsIcon, TeachersIcon, WalletIcon, CalendarIcon, SettingsIcon,
} from './components/Icons.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import Teachers from './pages/Teachers.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import Finance from './pages/Finance.jsx';
import Settings from './pages/Settings.jsx';

const NAV = [
  {
    title: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: HomeIcon }],
  },
  {
    title: 'People',
    items: [
      { id: 'students', label: 'Students', icon: StudentsIcon },
      { id: 'teachers', label: 'Teachers & Staff', icon: TeachersIcon },
    ],
  },
  {
    title: 'Finance',
    items: [{ id: 'finance', label: 'Finance', icon: WalletIcon }],
  },
  {
    title: 'System',
    items: [{ id: 'settings', label: 'Settings', icon: SettingsIcon }],
  },
];

const TITLES = {
  dashboard: 'Dashboard',
  students: 'Students',
  studentProfile: 'Student Profile',
  teachers: 'Teachers & Staff',
  teacherProfile: 'Teacher Profile',
  finance: 'Finance',
  settings: 'Settings',
};

// Profile pages highlight their parent list in the nav.
const NAV_PARENT = { studentProfile: 'students', teacherProfile: 'teachers' };

export default function App() {
  const [view, setView] = useState({ page: 'dashboard' });
  const [year, setYear] = useState(currentAcademicYear());

  useSyncExternalStore(subscribe, getData);

  useEffect(() => {
    document.title = `${COLLEGE.name} — Administration`;
  }, []);

  const navigate = (page, params = {}) => {
    setView({ page, ...params });
    window.scrollTo({ top: 0 });
  };

  const activeNav = NAV_PARENT[view.page] || view.page;

  const pageProps = { year, navigate, view };
  const PAGE = {
    dashboard: <Dashboard {...pageProps} />,
    students: <Students {...pageProps} />,
    studentProfile: <StudentProfile {...pageProps} />,
    teachers: <Teachers {...pageProps} />,
    teacherProfile: <TeacherProfile {...pageProps} />,
    finance: <Finance {...pageProps} />,
    settings: <Settings {...pageProps} />,
  }[view.page];

  const settings = getSettings();
  const collegeName = settings.collegeName || COLLEGE.name;
  const collegeUnit = settings.unit || COLLEGE.unit;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          {settings.logo ? (
            <img src={settings.logo} alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          ) : (
            <Logo size={44} dark />
          )}
          <div className="brand-text">
            <strong>{collegeName}</strong>
            <small>{collegeUnit}</small>
          </div>
        </div>
        <div className="brand-rule" />
        {NAV.map((section) => (
          <div className="nav-section" key={section.title}>
            <div className="nav-section-title">{section.title}</div>
            {section.items.map(({ id, label, icon: NavIcon }) => (
              <button
                key={id}
                className={`nav-btn${id === activeNav ? ' active' : ''}`}
                onClick={() => navigate(id)}
                aria-current={id === activeNav ? 'page' : undefined}
              >
                <NavIcon size={19} />
                {label}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-footer">
          <strong>{collegeName}</strong>
          <br />
          Software by {COLLEGE.developer}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="crumb">{collegeName}</div>
            <h1>{TITLES[view.page]}</h1>
          </div>
          <div className="topbar-right">
            <div className="year-picker">
              <CalendarIcon size={16} />
              <label htmlFor="year-select">Academic Year</label>
              <select id="year-select" value={year} onChange={(e) => setYear(e.target.value)}>
                {academicYearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="print-letterhead">
            <h2 style={{ margin: 0 }}>{collegeName.toUpperCase()}</h2>
            <div>{collegeUnit.toUpperCase()}</div>
          </div>
          {PAGE}
        </main>
      </div>
    </div>
  );
}
