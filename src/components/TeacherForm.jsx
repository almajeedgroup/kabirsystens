import { useState } from 'react';
import Modal from './Modal.jsx';
import { readPhoto } from '../constants.js';
import { addStaff, updateStaff } from '../store.js';

const EMPTY = {
  name: '',
  designation: '',
  subject: '',
  qualification: '',
  phone: '',
  email: '',
  address: '',
  salary: '',
  joinDate: '',
  photo: '',
};

export default function TeacherForm({ teacher, onClose }) {
  const [form, setForm] = useState(teacher ? { ...EMPTY, ...teacher } : EMPTY);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (file) setForm({ ...form, photo: await readPhoto(file) });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (teacher) {
      updateStaff(teacher.id, form);
    } else {
      addStaff(form);
    }
    onClose();
  };

  return (
    <Modal title={teacher ? 'Edit Teacher / Staff' : 'Add Teacher / Staff'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field">
            Name <span className="req">*</span>
            <input value={form.name} onChange={set('name')} required placeholder="Full name" autoFocus />
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
            Monthly Salary (₹)
            <input type="number" min="0" value={form.salary} onChange={set('salary')} />
          </label>
          <label className="field">
            Joining Date
            <input type="date" value={form.joinDate} onChange={set('joinDate')} />
          </label>
          <label className="field">
            Photo
            <input type="file" accept="image/*" onChange={onPhoto} />
          </label>
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn" type="submit">{teacher ? 'Save Changes' : 'Add Member'}</button>
        </div>
      </form>
    </Modal>
  );
}
