import { useState } from 'react';
import { getData, addStudent, updateStudent, deleteStudent } from '../store.js';
import { CLASSES, formatINR } from '../constants.js';

const EMPTY = {
  admissionNo: '',
  name: '',
  guardianName: '',
  className: 'I PUC',
  phone: '',
  address: '',
  feeAssigned: '',
  feePaid: '',
};

export default function Students({ year }) {
  const { students } = getData();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
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

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateStudent(editingId, form);
      setEditingId(null);
    } else {
      addStudent({ ...form, year });
    }
    setForm(EMPTY);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({ ...EMPTY, ...s });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = (s) => {
    if (window.confirm(`Delete student "${s.name}"? This cannot be undone.`)) {
      deleteStudent(s.id);
    }
  };

  const totalAssigned = list.reduce((a, s) => a + Number(s.feeAssigned || 0), 0);
  const totalPaid = list.reduce((a, s) => a + Number(s.feePaid || 0), 0);

  return (
    <>
      <div className="card no-print">
        <h2>{editingId ? 'Edit Student' : `Admit Student — ${year}`}</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              Admission No.
              <input value={form.admissionNo} onChange={set('admissionNo')} placeholder="e.g. 2025/001" />
            </label>
            <label className="field">
              Student Name *
              <input value={form.name} onChange={set('name')} required placeholder="Full name" />
            </label>
            <label className="field">
              Guardian Name
              <input value={form.guardianName} onChange={set('guardianName')} placeholder="Father / guardian" />
            </label>
            <label className="field">
              Class
              <select value={form.className} onChange={set('className')}>
                {CLASSES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Phone
              <input value={form.phone} onChange={set('phone')} placeholder="Contact number" />
            </label>
            <label className="field">
              Address
              <input value={form.address} onChange={set('address')} placeholder="Address" />
            </label>
            <label className="field">
              Fee Assigned (₹)
              <input type="number" min="0" value={form.feeAssigned} onChange={set('feeAssigned')} />
            </label>
            <label className="field">
              Fee Paid (₹)
              <input type="number" min="0" value={form.feePaid} onChange={set('feePaid')} />
            </label>
          </div>
          <div className="btn-row">
            <button className="btn" type="submit">
              {editingId ? 'Save Changes' : 'Add Student'}
            </button>
            {editingId && (
              <button
                className="btn outline"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Student Register — {year}</h2>
        <div className="btn-row no-print" style={{ marginBottom: 14 }}>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} aria-label="Filter by class">
            <option>All</option>
            {CLASSES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            placeholder="Search name or admission no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search students"
            style={{ flex: 1, minWidth: 180 }}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Adm. No.</th>
                <th scope="col">Name</th>
                <th scope="col">Guardian</th>
                <th scope="col">Class</th>
                <th scope="col">Phone</th>
                <th scope="col" className="num">Fee Assigned</th>
                <th scope="col" className="num">Fee Paid</th>
                <th scope="col" className="num">Balance</th>
                <th scope="col" className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">No students recorded for {year} yet.</td>
                </tr>
              )}
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{s.admissionNo || '—'}</td>
                  <td>{s.name}</td>
                  <td>{s.guardianName || '—'}</td>
                  <td><span className="badge">{s.className}</span></td>
                  <td>{s.phone || '—'}</td>
                  <td className="num">{formatINR(s.feeAssigned)}</td>
                  <td className="num">{formatINR(s.feePaid)}</td>
                  <td className="num deficit-pos">
                    {formatINR(Number(s.feeAssigned || 0) - Number(s.feePaid || 0))}
                  </td>
                  <td className="no-print">
                    <div className="btn-row">
                      <button className="btn small outline" onClick={() => startEdit(s)}>Edit</button>
                      <button className="btn small danger-outline" onClick={() => remove(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length > 0 && (
                <tr className="total-row">
                  <td colSpan={5}>Total ({list.length} students)</td>
                  <td className="num">{formatINR(totalAssigned)}</td>
                  <td className="num">{formatINR(totalPaid)}</td>
                  <td className="num">{formatINR(totalAssigned - totalPaid)}</td>
                  <td className="no-print" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
