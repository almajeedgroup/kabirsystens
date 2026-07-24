import { useState } from 'react';
import Modal from './Modal.jsx';
import { CLASSES, readPhoto } from '../constants.js';
import { addStudent, updateStudent } from '../store.js';

const EMPTY = {
  admissionNo: '',
  name: '',
  guardianName: '',
  className: 'I PUC',
  dob: '',
  phone: '',
  email: '',
  address: '',
  feeAssigned: '',
  feePaid: '',
  photo: '',
};

export default function StudentForm({ student, year, onClose }) {
  const [form, setForm] = useState(student ? { ...EMPTY, ...student } : EMPTY);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (file) setForm({ ...form, photo: await readPhoto(file) });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (student) {
      updateStudent(student.id, form);
    } else {
      addStudent({ ...form, year });
    }
    onClose();
  };

  return (
    <Modal title={student ? 'Edit Student' : `Admit Student — ${year}`} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            Student Name <span className="req">*</span>
            <input value={form.name} onChange={set('name')} required placeholder="Full name" autoFocus />
          </label>
          <label className="field">
            Admission No.
            <input value={form.admissionNo} onChange={set('admissionNo')} placeholder="e.g. 2025/001" />
          </label>
          <label className="field">
            Class
            <select value={form.className} onChange={set('className')}>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            Guardian Name
            <input value={form.guardianName} onChange={set('guardianName')} placeholder="Father / guardian" />
          </label>
          <label className="field">
            Date of Birth
            <input type="date" value={form.dob} onChange={set('dob')} />
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
          <label className="field">
            Fee Assigned (₹)
            <input type="number" min="0" value={form.feeAssigned} onChange={set('feeAssigned')} />
          </label>
          <label className="field">
            Fee Paid (₹)
            <input type="number" min="0" value={form.feePaid} onChange={set('feePaid')} />
          </label>
          <label className="field">
            Photo
            <input type="file" accept="image/*" onChange={onPhoto} />
          </label>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn" type="submit">{student ? 'Save Changes' : 'Admit Student'}</button>
        </div>
      </form>
    </Modal>
  );
}
