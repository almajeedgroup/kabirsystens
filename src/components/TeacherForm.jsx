import { useState } from 'react';
import Modal from './Modal.jsx';
import { readPhoto, JOB_TYPES, BLOOD_GROUPS, WEEK_DAYS } from '../constants.js';
import { addStaff, updateStaff } from '../store.js';
import { useToast } from './Toast.jsx';

const EMPTY = {
  name: '',
  employeeId: '',
  jobType: 'Teaching (Full-time)',
  designation: '',
  subject: '',
  qualification: '',
  phone: '',
  email: '',
  address: '',
  dob: '',
  bloodGroup: '',
  aadhar: '',
  salary: '',
  joinDate: '',
  status: 'active', // 'active' | 'left'
  exitDate: '',
  workingHours: '',
  workingDays: [], // subset of WEEK_DAYS
  timeTable: {}, // { Mon: '...', Tue: '...' }
  photo: '',
};

export default function TeacherForm({ teacher, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(
    teacher ? { ...EMPTY, ...teacher, workingDays: teacher.workingDays || [], timeTable: teacher.timeTable || {} } : EMPTY
  );
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (file) setForm({ ...form, photo: await readPhoto(file) });
  };

  const toggleDay = (day) =>
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day],
    }));

  const setPeriod = (day) => (e) =>
    setForm((f) => ({ ...f, timeTable: { ...f.timeTable, [day]: e.target.value } }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (teacher) {
      updateStaff(teacher.id, form);
      toast(`Saved ${form.name}`);
    } else {
      addStaff(form);
      toast(`Added ${form.name}`);
    }
    onClose();
  };

  return (
    <Modal title={teacher ? 'Edit Teacher / Staff' : 'Add Teacher / Staff'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <h3 className="form-section">Identity</h3>
        <div className="form-grid">
          <label className="field">
            Name <span className="req">*</span>
            <input value={form.name} onChange={set('name')} required placeholder="Full name" autoFocus />
          </label>
          <label className="field">
            Employee ID
            <input value={form.employeeId} onChange={set('employeeId')} placeholder="e.g. EMP-014" />
          </label>
          <label className="field">
            Job Type
            <select value={form.jobType} onChange={set('jobType')}>
              {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            Designation
            <input value={form.designation} onChange={set('designation')} placeholder="e.g. Lecturer, Principal" />
          </label>
          <label className="field">
            Subject
            <input value={form.subject} onChange={set('subject')} placeholder="e.g. Physics" />
          </label>
          <label className="field">
            Qualification
            <input value={form.qualification} onChange={set('qualification')} placeholder="e.g. M.Sc, B.Ed" />
          </label>
        </div>

        <h3 className="form-section">Personal &amp; Contact</h3>
        <div className="form-grid">
          <label className="field">
            Date of Birth
            <input type="date" value={form.dob} onChange={set('dob')} />
          </label>
          <label className="field">
            Blood Group
            <select value={form.bloodGroup} onChange={set('bloodGroup')}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </label>
          <label className="field">
            Aadhar No.
            <input value={form.aadhar} onChange={set('aadhar')} placeholder="12-digit number" inputMode="numeric" />
          </label>
          <label className="field">
            Phone
            <input value={form.phone} onChange={set('phone')} placeholder="Contact number" />
          </label>
          <label className="field">
            Email
            <input type="email" value={form.email} onChange={set('email')} placeholder="Email address" />
          </label>
          <label className="field">
            Address
            <input value={form.address} onChange={set('address')} placeholder="Residential address" />
          </label>
        </div>

        <h3 className="form-section">Employment</h3>
        <div className="form-grid">
          <label className="field">
            Monthly Salary (₹)
            <input type="number" min="0" value={form.salary} onChange={set('salary')} />
          </label>
          <label className="field">
            Joining Date
            <input type="date" value={form.joinDate} onChange={set('joinDate')} />
          </label>
          <label className="field">
            Status
            <select value={form.status || 'active'} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="left">Left</option>
            </select>
          </label>
          {form.status === 'left' && (
            <label className="field">
              Date of Leaving
              <input type="date" value={form.exitDate} onChange={set('exitDate')} />
            </label>
          )}
          <label className="field">
            Photo
            <input type="file" accept="image/*" onChange={onPhoto} />
          </label>
        </div>

        <h3 className="form-section">Working Schedule &amp; Time Table</h3>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="field">
            Working Hours
            <input value={form.workingHours} onChange={set('workingHours')} placeholder="e.g. 9:00 AM – 4:00 PM" />
          </label>
        </div>
        <p style={{ fontSize: '0.76rem', color: 'var(--ink-50)', margin: '0 0 8px' }}>
          Tick the days she comes to work and note that day's lecture time table.
        </p>
        <div className="table-wrap" style={{ border: 'var(--hairline)', borderRadius: 10 }}>
          <table className="pay-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: 64 }}>Day</th>
                <th scope="col" style={{ width: 80 }}>Working</th>
                <th scope="col">Lecture Time Table</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map((day) => {
                const on = form.workingDays.includes(day);
                return (
                  <tr key={day}>
                    <td className="cell-strong">{day}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={on} onChange={() => toggleDay(day)} aria-label={`${day} working`} style={{ width: 18, height: 18 }} />
                    </td>
                    <td>
                      <input
                        value={form.timeTable[day] || ''}
                        onChange={setPeriod(day)}
                        disabled={!on}
                        placeholder={on ? 'e.g. P1 Physics · P3 Physics Lab' : 'Off'}
                        style={{ width: '100%' }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="btn-row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn" type="submit">{teacher ? 'Save Changes' : 'Add Member'}</button>
        </div>
      </form>
    </Modal>
  );
}
