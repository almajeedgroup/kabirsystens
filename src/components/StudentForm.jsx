import { useState } from 'react';
import Modal from './Modal.jsx';
import { CLASSES, readPhoto, formatINR } from '../constants.js';
import { addStudent, updateStudent } from '../store.js';
import { useToast } from './Toast.jsx';

const EMPTY = {
  admissionNo: '',
  name: '',
  guardianName: '',
  className: 'I PUC',
  combination: '',
  language: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  actualAmount: '',
  agreedAmount: '',
  remarks: '',
  photo: '',
};

export default function StudentForm({ student, year, onClose }) {
  const toast = useToast();
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
      toast(`Saved ${form.name}`);
    } else {
      addStudent({ ...form, year });
      toast(`Admitted ${form.name}`);
    }
    onClose();
  };

  const deficit = Number(form.actualAmount || 0) - Number(form.agreedAmount || 0);

  return (
    <Modal title={student ? 'Edit Student' : `Admit Student — ${year}`} onClose={onClose} wide>
      <form onSubmit={submit}>
        <h3 className="form-section">Basic Details</h3>
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
            Combination
            <input value={form.combination} onChange={set('combination')} placeholder="e.g. PCMB, CEBA" />
          </label>
          <label className="field">
            Language
            <input value={form.language} onChange={set('language')} placeholder="e.g. Urdu, Kannada, Hindi" />
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
            Photo
            <input type="file" accept="image/*" onChange={onPhoto} />
          </label>
        </div>

        <h3 className="form-section">Financial Summary</h3>
        <div className="form-grid">
          <label className="field">
            Actual Amount (₹)
            <input type="number" min="0" value={form.actualAmount} onChange={set('actualAmount')} />
          </label>
          <label className="field">
            Agreed Amount (₹)
            <input type="number" min="0" value={form.agreedAmount} onChange={set('agreedAmount')} />
          </label>
          <label className="field">
            Deficit (₹)
            <input value={formatINR(deficit)} readOnly aria-label="Deficit, calculated automatically" style={{ background: 'var(--azure-50)' }} />
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            Remarks
            <input value={form.remarks} onChange={set('remarks')} placeholder="Any note about this student's fees" />
          </label>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-50)', marginTop: 0 }}>
          Admission payment and instalments are recorded on the student's profile page.
        </p>

        <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn" type="submit">{student ? 'Save Changes' : 'Admit Student'}</button>
        </div>
      </form>
    </Modal>
  );
}
