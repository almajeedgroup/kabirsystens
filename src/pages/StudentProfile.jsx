import { useState } from 'react';
import {
  getData, deleteStudent, updatePayment, updateStudent,
  paidTotal, dueAmount, feeDeficit,
} from '../store.js';
import { formatINR, PAYMENT_STAGES, PAYMENT_MODES } from '../constants.js';
import Avatar from '../components/Avatar.jsx';
import StudentForm from '../components/StudentForm.jsx';
import BarChart from '../components/BarChart.jsx';
import {
  BackIcon, EditIcon, TrashIcon, PhoneIcon, MailIcon, PinIcon, UserIcon, CalendarIcon, ReportIcon,
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

  const actual = Number(student.actualAmount || 0);
  const agreed = Number(student.agreedAmount || 0);
  const paid = paidTotal(student);
  const due = dueAmount(student);
  const deficit = feeDeficit(student);
  const pct = agreed > 0 ? Math.min(100, (paid / agreed) * 100) : 0;

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

  const summary = [
    ['Actual Amount', actual],
    ['Agreed Amount', agreed],
    ['Deficit', deficit],
    ['Grand Total Paid', paid],
    ['Due Amount', due],
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
            {student.combination && <span className="badge solid">{student.combination}</span>}
            {student.language && <span className="badge solid">{student.language}</span>}
            <span className="badge hero-badge">{student.year}</span>
            {student.admissionNo && <span className="badge hero-badge">Adm. No. {student.admissionNo}</span>}
          </div>
        </div>
        <div className="actions no-print">
          <button className="btn gold hero-btn" onClick={() => setEditing(true)}>
            <EditIcon size={16} /> Edit Profile
          </button>
          <button className="btn hero-btn" onClick={remove}>
            <TrashIcon size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {summary.map(([k, v]) => (
          <div className="stat-card" key={k}>
            <div>
              <div className="label">{k}</div>
              <div className="value" style={{ fontSize: '1.15rem' }}>₹ {formatINR(v)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Fee Register</h3>
            <div className="sub">
              Record the admission payment and each instalment — amount, date, receipt number and mode of payment.
            </div>
          </div>
        </div>
        <div className="card-body flush" style={{ paddingBottom: 0 }}>
          <div className="table-wrap">
            <table className="pay-table">
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col" className="num">Amount (₹)</th>
                  <th scope="col">Fee Payment Date</th>
                  <th scope="col">Receipt #</th>
                  <th scope="col">Mode of Payment</th>
                </tr>
              </thead>
              <tbody>
                {PAYMENT_STAGES.map(({ key, label }) => {
                  const p = student.payments?.[key] || {};
                  const setP = (field) => (e) =>
                    updatePayment(student.id, key, { [field]: e.target.value });
                  return (
                    <tr key={key}>
                      <td className="cell-strong" style={{ whiteSpace: 'nowrap' }}>{label}</td>
                      <td className="num">
                        <input type="number" min="0" value={p.amount ?? ''} onChange={setP('amount')}
                          aria-label={`${label} amount`} />
                      </td>
                      <td>
                        <input type="date" value={p.date ?? ''} onChange={setP('date')}
                          aria-label={`${label} payment date`} />
                      </td>
                      <td>
                        <input value={p.receipt ?? ''} onChange={setP('receipt')} placeholder="Receipt no."
                          aria-label={`${label} receipt number`} />
                      </td>
                      <td>
                        <select value={p.mode ?? ''} onChange={setP('mode')} aria-label={`${label} mode of payment`}>
                          <option value="">—</option>
                          {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td>GRAND TOTAL</td>
                  <td className="num">₹ {formatINR(paid)}</td>
                  <td colSpan={2}>Due Amount</td>
                  <td className="num" style={{ textAlign: 'right' }}>₹ {formatINR(due)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Payment Analytics</h3></div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Collected against agreed amount</span>
              <span>{agreed > 0 ? `${pct.toFixed(0)}%` : '—'}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-50)', marginBottom: 14 }}>
              ₹ {formatINR(paid)} received · ₹ {formatINR(Math.max(due, 0))} due
              {deficit > 0 && <> · concession of ₹ {formatINR(deficit)} on the actual fee</>}
            </div>
            <BarChart
              labels={PAYMENT_STAGES.map((s) => s.short)}
              values={PAYMENT_STAGES.map((s) => Number(student.payments?.[s.key]?.amount || 0))}
              height={190}
            />
          </div>
        </div>

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
              <div className="info-row">
                <span className="ic"><ReportIcon size={17} /></span>
                <div style={{ flex: 1 }}>
                  <div className="k">Remarks</div>
                  <input
                    value={student.remarks || ''}
                    onChange={(e) => updateStudent(student.id, { remarks: e.target.value })}
                    placeholder="Add a remark"
                    aria-label="Remarks"
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <StudentForm student={student} year={student.year} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
