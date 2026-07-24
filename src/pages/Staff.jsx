import { useState } from 'react';
import { getData, addStaff, updateStaff, deleteStaff } from '../store.js';
import { formatINR } from '../constants.js';

const EMPTY = { name: '', designation: '', phone: '', salary: '', joinDate: '' };

export default function Staff() {
  const { staff } = getData();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateStaff(editingId, form);
      setEditingId(null);
    } else {
      addStaff(form);
    }
    setForm(EMPTY);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({ ...EMPTY, ...s });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = (s) => {
    if (window.confirm(`Delete staff member "${s.name}"? This cannot be undone.`)) {
      deleteStaff(s.id);
    }
  };

  const totalSalary = staff.reduce((a, s) => a + Number(s.salary || 0), 0);

  return (
    <>
      <div className="card no-print">
        <h2>{editingId ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
        <form onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              Name *
              <input value={form.name} onChange={set('name')} required placeholder="Full name" />
            </label>
            <label className="field">
              Designation
              <input value={form.designation} onChange={set('designation')} placeholder="e.g. Lecturer" />
            </label>
            <label className="field">
              Phone
              <input value={form.phone} onChange={set('phone')} placeholder="Contact number" />
            </label>
            <label className="field">
              Monthly Salary (₹)
              <input type="number" min="0" value={form.salary} onChange={set('salary')} />
            </label>
            <label className="field">
              Joining Date
              <input type="date" value={form.joinDate} onChange={set('joinDate')} />
            </label>
          </div>
          <div className="btn-row">
            <button className="btn" type="submit">
              {editingId ? 'Save Changes' : 'Add Staff'}
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
        <h2>Staff Register</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Name</th>
                <th scope="col">Designation</th>
                <th scope="col">Phone</th>
                <th scope="col">Joining Date</th>
                <th scope="col" className="num">Monthly Salary (₹)</th>
                <th scope="col" className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No staff members recorded yet.</td>
                </tr>
              )}
              {staff.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.designation || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.joinDate || '—'}</td>
                  <td className="num">{formatINR(s.salary)}</td>
                  <td className="no-print">
                    <div className="btn-row">
                      <button className="btn small outline" onClick={() => startEdit(s)}>Edit</button>
                      <button className="btn small danger-outline" onClick={() => remove(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length > 0 && (
                <tr className="total-row">
                  <td colSpan={5}>Total Monthly Salary ({staff.length} staff)</td>
                  <td className="num">{formatINR(totalSalary)}</td>
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
