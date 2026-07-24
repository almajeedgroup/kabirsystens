import { useState } from 'react';
import { getData, deleteStudent } from '../store.js';
import { formatINR } from '../constants.js';
import Avatar from '../components/Avatar.jsx';
import StudentForm from '../components/StudentForm.jsx';
import {
  BackIcon, EditIcon, TrashIcon, PhoneIcon, MailIcon, PinIcon, UserIcon, CalendarIcon,
} from '../components/Icons.jsx';

export default function StudentProfile({ view, navigate }) {
  const { students } = getData();
  const student = students.find((s) => s.id === view.id);
  const [editing, setEditing] = useState(false);

  if (!student) {
    return (
      <div className="empty-state card">
        <strong>Student not found</strong>
        <p>This record may have been deleted.</p>
        <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => navigate('students')}>
          <BackIcon size={16} /> Back to Students
        </button>
      </div>
    );
  }

  const assigned = Number(student.feeAssigned || 0);
  const paid = Number(student.feePaid || 0);
  const balance = assigned - paid;
  const pct = assigned > 0 ? Math.min(100, (paid / assigned) * 100) : 0;

  const remove = () => {
    if (window.confirm(`Delete student "${student.name}"? This cannot be undone.`)) {
      deleteStudent(student.id);
      navigate('students');
    }
  };

  const info = [
    { icon: UserIcon, k: 'Guardian', v: student.guardianName },
    { icon: CalendarIcon, k: 'Date of Birth', v: student.dob },
    { icon: PhoneIcon, k: 'Phone', v: student.phone },
    { icon: MailIcon, k: 'Email', v: student.email },
    { icon: PinIcon, k: 'Address', v: student.address },
  ];

  return (
    <>
      <button className="btn ghost small no-print" style={{ marginBottom: 16 }} onClick={() => navigate('students')}>
        <BackIcon size={15} /> All Students
      </button>

      <div className="profile-hero">
        <Avatar name={student.name} photo={student.photo} size={92} />
        <div>
          <h2>{student.name}</h2>
          <div className="tags">
            <span className="badge gold">{student.className}</span>
            <span className="badge solid">{student.year}</span>
            {student.admissionNo && <span className="badge" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>Adm. No. {student.admissionNo}</span>}
          </div>
        </div>
        <div className="actions no-print">
          <button className="btn gold" onClick={() => setEditing(true)}>
            <EditIcon size={16} /> Edit Profile
          </button>
          <button className="btn ghost" onClick={remove}>
            <TrashIcon size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Personal Details</h3></div>
          <div className="card-body">
            <div className="info-list">
              {info.map(({ icon: InfoIcon, k, v }) => (
                <div className="info-row" key={k}>
                  <span className="ic"><InfoIcon size={17} /></span>
                  <div>
                    <div className="k">{k}</div>
                    <div className="v">{v || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Fee Summary — {student.year}</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Paid</span>
              <span>{assigned > 0 ? `${pct.toFixed(0)}%` : '—'}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="fee-figures">
              <div>
                <div className="k">Assigned</div>
                <div className="v">₹ {formatINR(assigned)}</div>
              </div>
              <div>
                <div className="k">Paid</div>
                <div className="v">₹ {formatINR(paid)}</div>
              </div>
              <div>
                <div className="k">Balance</div>
                <div className="v">₹ {formatINR(balance)}</div>
              </div>
            </div>
            {balance > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-50)', marginBottom: 0 }}>
                ₹ {formatINR(balance)} is still pending for this student.
              </p>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <StudentForm student={student} year={student.year} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
