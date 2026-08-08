import { useEffect, useState, useSyncExternalStore } from 'react';
import { COLLEGE, academicYearOptions, currentAcademicYear } from './constants.js';
import {
  subscribe, getData, getSettings, firebaseAvailable,
  activateFirebaseData, deactivateFirebaseData, onSyncError,
} from './store.js';
import { watchAuth, signOutUser } from './firebase.js';
import Logo from './components/Logo.jsx';
import Login from './components/Login.jsx';
import { useToast } from './components/Toast.jsx';
import {
  HomeIcon, StudentsIcon, TeachersIcon, WalletIcon, CalendarIcon, SettingsIcon, LogoutIcon,
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
  // Auth phase (Firebase mode only): 'loading' | 'out' | 'in'.
  const [authPhase, setAuthPhase] = useState(firebaseAvailable ? 'loading' : 'in');
  const toast = useToast();

  useSyncExternalStore(subscribe, getData);

  useEffect(() => {
    document.title = `${COLLEGE.name} — Administration`;
  }, []);

  // Surface cloud sync failures to the admin.
  useEffect(() => {
    onSyncError(() => toast('Could not save to the cloud — check your connection', 'error'));
  }, [toast]);

  // Watch Firebase auth and load cloud data once signed in.
  useEffect(() => {
    if (!firebaseAvailable) return undefined;
    return watchAuth(async (user) => {
      if (user) {
        try {
          await activateFirebaseData();
          setAuthPhase('in');
        } catch {
          toast('Could not load data from the cloud', 'error');
          setAuthPhase('in');
        }
      } else {
        deactivateFirebaseData();
        setAuthPhase('out');
      }
    });
  }, [toast]);

  const signOut = async () => {
    await signOutUser();
    setView({ page: 'dashboard' });
  };

  const navigate = (page, params = {}) => {
    setView({ page, ...params });
    window.scrollTo({ top: 0 });
  };

  if (authPhase === 'loading') {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <Logo size={56} />
          <p style={{ marginTop: 16, color: 'var(--ink-50)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (authPhase === 'out') {
    return <Login />;
  }

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
            {firebaseAvailable && (
              <button className="btn ghost small" onClick={signOut} title="Sign out">
                <LogoutIcon size={16} /> Sign out
              </button>
            )}
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
