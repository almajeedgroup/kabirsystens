import { useState } from 'react';
import { getData, deleteStudent, paidTotal, dueAmount } from '../store.js';
import { CLASSES, formatINR } from '../constants.js';
import Avatar from '../components/Avatar.jsx';
import StudentForm from '../components/StudentForm.jsx';
import StatusLegend from '../components/StatusLegend.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { dueStatus, collectionStatus, figClass } from '../utils/status.js';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, StudentsIcon } from '../components/Icons.jsx';

// Fee status buckets for the filter.
function feeBucket(s) {
  const paid = paidTotal(s);
  const agreed = Number(s.agreedAmount || 0);
  if (agreed > 0 && paid >= agreed) return 'cleared';
  if (paid <= 0) return 'unpaid';
  return 'partial';
}

const SORTS = {
  sl: null,
  name: (a, b) => a.name.localeCompare(b.name),
  className: (a, b) => a.className.localeCompare(b.className),
  agreed: (a, b) => Number(a.agreedAmount || 0) - Number(b.agreedAmount || 0),
  paid: (a, b) => paidTotal(a) - paidTotal(b),
  due: (a, b) => dueAmount(a) - dueAmount(b),
};

export default function Students({ year, navigate }) {
  const { students } = getData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modal, setModal] = useState(null); // null | 'new' | student object
  const [filterClass, setFilterClass] = useState('All');
  const [filterFee, setFilterFee] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'sl', dir: 1 });

  const yearList = students.filter((s) => s.year === year);
  let list = yearList
    .filter((s) => filterClass === 'All' || s.className === filterClass)
    .filter((s) => filterFee === 'All' || feeBucket(s) === filterFee)
    .filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.admissionNo || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.combination || '').toLowerCase().includes(search.toLowerCase())
    );

  if (SORTS[sort.key]) {
    list = [...list].sort((a, b) => SORTS[sort.key](a, b) * sort.dir);
  }

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }));
  const sortMark = (key) => (sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : '');

  const totalAgreed = list.reduce((a, s) => a + Number(s.agreedAmount || 0), 0);
  const totalPaid = list.reduce((a, s) => a + paidTotal(s), 0);
  const totalDue = list.reduce((a, s) => a + dueAmount(s), 0);
  const pctCollected = totalAgreed > 0 ? Math.min(100, (totalPaid / totalAgreed) * 100) : 0;

  const remove = async (e, s) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete student?',
      message: `Delete "${s.name}" and their fee register? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) {
      deleteStudent(s.id);
      toast(`Deleted ${s.name}`);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Students</h2>
          <p>Admission register for {year}. Click a student to open their profile and fee register.</p>
        </div>
        <button className="btn" onClick={() => setModal('new')}>
          <PlusIcon size={17} /> Admit Student
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <div className="stat-card">
          <div>
            <div className="label">Agreed Amount</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>₹ {formatINR(totalAgreed)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Collected</div>
            <div className={`value ${figClass(collectionStatus(totalPaid, totalAgreed))}`} style={{ fontSize: '1.2rem' }}>₹ {formatINR(totalPaid)}</div>
            <div className="hint">{totalAgreed > 0 ? `${pctCollected.toFixed(0)}% of agreed` : '—'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Due Amount</div>
            <div className={`value ${figClass(dueStatus(totalPaid, totalAgreed))}`} style={{ fontSize: '1.2rem' }}>₹ {formatINR(totalDue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Students</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>{list.length}</div>
            <div className="hint">
              {list.filter((s) => dueAmount(s) > 0).length} with dues pending
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar no-print">
          <div className="search-box">
            <SearchIcon size={17} />
            <input
              placeholder="Search name, admission no. or combination"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} aria-label="Filter by class">
            <option value="All">All classes</option>
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={filterFee} onChange={(e) => setFilterFee(e.target.value)} aria-label="Filter by fee status">
            <option value="All">All fees</option>
            <option value="cleared">Cleared</option>
            <option value="partial">Partly paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <StatusLegend />
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--ink-50)' }}>
            {list.length} student{list.length === 1 ? '' : 's'}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="empty-state">
            <span className="icon"><StudentsIcon /></span>
            <strong>No students found</strong>
            <p>Admit a student for {year} or adjust your search.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Sl.#</th>
                  <th scope="col"><button className="th-sort" onClick={() => toggleSort('name')}>Student{sortMark('name')}</button></th>
                  <th scope="col"><button className="th-sort" onClick={() => toggleSort('className')}>Class{sortMark('className')}</button></th>
                  <th scope="col">Combination</th>
                  <th scope="col">Language</th>
                  <th scope="col" className="num"><button className="th-sort" onClick={() => toggleSort('agreed')}>Agreed (₹){sortMark('agreed')}</button></th>
                  <th scope="col" className="num"><button className="th-sort" onClick={() => toggleSort('paid')}>Paid (₹){sortMark('paid')}</button></th>
                  <th scope="col" className="num"><button className="th-sort" onClick={() => toggleSort('due')}>Due (₹){sortMark('due')}</button></th>
                  <th scope="col" className="no-print" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr
                    key={s.id}
                    className="clickable"
                    onClick={() => navigate('studentProfile', { id: s.id })}
                  >
                    <td>{i + 1}</td>
                    <td>
                      <div className="person-cell">
                        <Avatar name={s.name} photo={s.photo} size={38} />
                        <div>
                          <div className="cell-strong">{s.name}</div>
                          <div className="meta">{s.admissionNo || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge">{s.className}</span></td>
                    <td>{s.combination || '—'}</td>
                    <td>{s.language || '—'}</td>
                    <td className="num">{formatINR(s.agreedAmount)}</td>
                    <td className="num">{formatINR(paidTotal(s))}</td>
                    <td className={`num ${figClass(dueStatus(paidTotal(s), s.agreedAmount))}`}>
                      {formatINR(dueAmount(s))}
                    </td>
                    <td className="no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="btn-row" style={{ flexWrap: 'nowrap' }}>
                        <button className="icon-btn" onClick={() => setModal(s)} aria-label={`Edit ${s.name}`}>
                          <EditIcon size={17} />
                        </button>
                        <button className="icon-btn danger" onClick={(e) => remove(e, s)} aria-label={`Delete ${s.name}`}>
                          <TrashIcon size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={5}>Total · {list.length} students</td>
                  <td className="num">{formatINR(totalAgreed)}</td>
                  <td className="num">{formatINR(totalPaid)}</td>
                  <td className={`num ${figClass(dueStatus(totalPaid, totalAgreed))}`}>
                    {formatINR(totalDue)}
                  </td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <StudentForm
          student={modal === 'new' ? null : modal}
          year={year}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
