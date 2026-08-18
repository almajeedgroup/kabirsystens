import { useEffect, useState, useSyncExternalStore } from 'react';
import { COLLEGE, academicYearOptions, currentAcademicYear } from './constants.js';
import {
  subscribe, getData, getSettings, firebaseAvailable,
  activateFirebaseData, deactivateFirebaseData, onSyncError,
} from './store.js';
import { watchAuth, signOutUser } from './firebase.js';
import Logo from './components/Logo.jsx';
import Login from './components/Login.jsx';
import Avatar from './components/Avatar.jsx';
import { useToast } from './components/Toast.jsx';
import {
  HomeIcon, StudentsIcon, TeachersIcon, WalletIcon, CalendarIcon, SettingsIcon, LogoutIcon,
  SearchIcon, DownloadIcon,
} from './components/Icons.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import Teachers from './pages/Teachers.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import Finance from './pages/Finance.jsx';
import Settings from './pages/Settings.jsx';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'students', label: 'Students', icon: StudentsIcon },
  { id: 'teachers', label: 'Teachers & Staff', icon: TeachersIcon },
  { id: 'finance', label: 'Finance', icon: WalletIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

// Profile pages highlight their parent entry in the nav.
const NAV_PARENT = { studentProfile: 'students', teacherProfile: 'teachers' };

export default function App() {
  const [view, setView] = useState({ page: 'dashboard' });
  const [year, setYear] = useState(currentAcademicYear());
  // Auth phase (Firebase mode only): 'loading' | 'out' | 'in'.
  const [authPhase, setAuthPhase] = useState(firebaseAvailable ? 'loading' : 'in');
  const [query, setQuery] = useState('');
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
    setQuery('');
    window.scrollTo({ top: 0 });
  };

  const q = query.trim().toLowerCase();
  const results = q
    ? [
        ...getData().students
          .filter((s) => s.name.toLowerCase().includes(q) || (s.admissionNo || '').toLowerCase().includes(q))
          .slice(0, 6)
          .map((s) => ({ type: 'student', id: s.id, name: s.name, meta: `${s.className}${s.admissionNo ? ` · ${s.admissionNo}` : ''}`, photo: s.photo })),
        ...getData().staff
          .filter((s) => s.name.toLowerCase().includes(q) || (s.designation || '').toLowerCase().includes(q))
          .slice(0, 4)
          .map((s) => ({ type: 'teacher', id: s.id, name: s.name, meta: s.designation || 'Staff', photo: s.photo })),
      ]
    : [];

  const settings = getSettings();
  const collegeName = settings.collegeName || COLLEGE.name;
  const collegeUnit = settings.unit || COLLEGE.unit;

  if (authPhase === 'loading') {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <Logo size={72} src={settings.logo || undefined} />
          <p style={{ marginTop: 16, color: 'var(--ink-50)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (authPhase === 'out') return <Login />;

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

  return (
    <div className="app">
      <header className="masthead no-print">
        <div className="masthead-top">
          <button className="brand" onClick={() => navigate('dashboard')} aria-label="Home">
            <span className="brand-crest">
              <Logo size={46} src={settings.logo || undefined} />
            </span>
            <span className="brand-text">
              <span className="brand-name">{collegeName}</span>
              <span className="brand-unit">{collegeUnit}</span>
            </span>
          </button>

          <div className="masthead-tools">
            <div className="search-box">
              <SearchIcon size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students or staff…"
                aria-label="Global search"
              />
              {query && (
                <div className="gs-results">
                  {results.length === 0 ? (
                    <div className="gs-empty">No matches for “{query}”.</div>
                  ) : (
                    results.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        className="gs-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          navigate(r.type === 'student' ? 'studentProfile' : 'teacherProfile', { id: r.id })
                        }
                      >
                        <Avatar name={r.name} photo={r.photo} size={30} />
                        <span>
                          <span className="cell-strong">{r.name}</span>
                          <span className="meta"> · {r.meta}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="year-picker">
              <CalendarIcon size={15} />
              <label htmlFor="year-select">Year</label>
              <select id="year-select" value={year} onChange={(e) => setYear(e.target.value)}>
                {academicYearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              className="top-icon"
              onClick={() => navigate('finance', { tab: 'importexport' })}
              aria-label="Import & Export"
              title="Import & Export"
            >
              <DownloadIcon size={17} />
            </button>

            {firebaseAvailable && (
              <button className="top-icon" onClick={signOut} aria-label="Sign out" title="Sign out">
                <LogoutIcon size={17} />
              </button>
            )}
          </div>
        </div>

        <nav className="mainnav" aria-label="Main navigation">
          {NAV.map(({ id, label, icon: NavIcon }) => (
            <button
              key={id}
              className={`navtab${id === activeNav ? ' active' : ''}`}
              onClick={() => navigate(id)}
              aria-current={id === activeNav ? 'page' : undefined}
            >
              <NavIcon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        <div className="print-letterhead">
          <span className="print-logo">
            <Logo size={68} src={settings.logo || undefined} />
          </span>
          <h2 style={{ margin: 0 }}>{collegeName.toUpperCase()}</h2>
          <div>{collegeUnit.toUpperCase()}</div>
        </div>
        {PAGE}
      </main>
    </div>
  );
}
