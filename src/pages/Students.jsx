import { useState } from 'react';
import { getData, deleteStudent } from '../store.js';
import { CLASSES, formatINR } from '../constants.js';
import Avatar from '../components/Avatar.jsx';
import StudentForm from '../components/StudentForm.jsx';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, StudentsIcon } from '../components/Icons.jsx';

export default function Students({ year, navigate }) {
  const { students } = getData();
  const [modal, setModal] = useState(null); // null | 'new' | student object
  const [filterClass, setFilterClass] = useState('All');
  const [search, setSearch] = useState('');

  const list = students
    .filter((s) => s.year === year)
    .filter((s) => filterClass === 'All' || s.className === filterClass)
    .filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.admissionNo || '').toLowerCase().includes(search.toLowerCase())
    );

  const totalAssigned = list.reduce((a, s) => a + Number(s.feeAssigned || 0), 0);
  const totalPaid = list.reduce((a, s) => a + Number(s.feePaid || 0), 0);

  const remove = (e, s) => {
    e.stopPropagation();
    if (window.confirm(`Delete student "${s.name}"? This cannot be undone.`)) {
      deleteStudent(s.id);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Students</h2>
          <p>Admission register for {year}. Click a student to open their profile.</p>
        </div>
        <button className="btn" onClick={() => setModal('new')}>
          <PlusIcon size={17} /> Admit Student
        </button>
      </div>

      <div className="card">
        <div className="toolbar no-print">
          <div className="search-box">
            <SearchIcon size={17} />
            <input
              placeholder="Search by name or admission no."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} aria-label="Filter by class">
            <option>All</option>
            {CLASSES.map((c) => <option key={c}>{c}</option>)}
          </select>
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
                  <th scope="col">Student</th>
                  <th scope="col">Class</th>
                  <th scope="col">Guardian</th>
                  <th scope="col">Phone</th>
                  <th scope="col" className="num">Fee Assigned</th>
                  <th scope="col" className="num">Fee Paid</th>
                  <th scope="col" className="num">Balance</th>
                  <th scope="col" className="no-print" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr
                    key={s.id}
                    className="clickable"
                    onClick={() => navigate('studentProfile', { id: s.id })}
                  >
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
                    <td>{s.guardianName || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td className="num">₹ {formatINR(s.feeAssigned)}</td>
                    <td className="num">₹ {formatINR(s.feePaid)}</td>
                    <td className="num cell-strong">
                      ₹ {formatINR(Number(s.feeAssigned || 0) - Number(s.feePaid || 0))}
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
                  <td colSpan={4}>Total · {list.length} students</td>
                  <td className="num">₹ {formatINR(totalAssigned)}</td>
                  <td className="num">₹ {formatINR(totalPaid)}</td>
                  <td className="num">₹ {formatINR(totalAssigned - totalPaid)}</td>
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
