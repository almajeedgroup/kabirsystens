import { useState } from 'react';
import { getData, deleteStaff } from '../store.js';
import { formatINR } from '../constants.js';
import Avatar from '../components/Avatar.jsx';
import TeacherForm from '../components/TeacherForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { WEEK_DAYS } from '../constants.js';
import {
  BackIcon, EditIcon, TrashIcon, PhoneIcon, MailIcon, PinIcon, CalendarIcon, ReportIcon,
  UserIcon,
} from '../components/Icons.jsx';

export default function TeacherProfile({ view, navigate }) {
  const { staff } = getData();
  const toast = useToast();
  const confirm = useConfirm();
  const teacher = staff.find((s) => s.id === view.id);
  const [editing, setEditing] = useState(false);

  if (!teacher) {
    return (
      <div className="empty-state card">
        <strong>Member not found</strong>
        <p>This record may have been deleted.</p>
        <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => navigate('teachers')}>
          <BackIcon size={16} /> Back to Teachers &amp; Staff
        </button>
      </div>
    );
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete member?',
      message: `Delete "${teacher.name}" from the register? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) {
      deleteStaff(teacher.id);
      toast(`Deleted ${teacher.name}`);
      navigate('teachers');
    }
  };

  const salary = Number(teacher.salary || 0);

  const info = [
    { icon: UserIcon, k: 'Employee ID', v: teacher.employeeId },
    { icon: ReportIcon, k: 'Job Type', v: teacher.jobType },
    { icon: ReportIcon, k: 'Qualification', v: teacher.qualification },
    { icon: CalendarIcon, k: 'Date of Birth', v: teacher.dob },
    { icon: ReportIcon, k: 'Blood Group', v: teacher.bloodGroup },
    { icon: ReportIcon, k: 'Aadhar No.', v: teacher.aadhar },
    { icon: CalendarIcon, k: 'Joining Date', v: teacher.joinDate },
    { icon: PhoneIcon, k: 'Phone', v: teacher.phone },
    { icon: MailIcon, k: 'Email', v: teacher.email },
    { icon: PinIcon, k: 'Address', v: teacher.address },
  ];

  const workingDays = teacher.workingDays || [];
  const timeTable = teacher.timeTable || {};
  const hasSchedule = workingDays.length > 0 || Object.values(timeTable).some(Boolean) || teacher.workingHours;

  return (
    <>
      <button className="btn ghost small no-print" style={{ marginBottom: 16 }} onClick={() => navigate('teachers')}>
        <BackIcon size={15} /> All Teachers &amp; Staff
      </button>

      <div className="profile-hero">
        <Avatar name={teacher.name} photo={teacher.photo} size={92} />
        <div>
          <h2>{teacher.name}</h2>
          <div className="tags">
            {teacher.designation && <span className="badge gold">{teacher.designation}</span>}
            {teacher.subject && <span className="badge solid">{teacher.subject}</span>}
            {(teacher.status || 'active') === 'left' && (
              <span className="badge hero-badge">Left{teacher.exitDate ? ` · ${teacher.exitDate}` : ''}</span>
            )}
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

      <div className="profile-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Details</h3></div>
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
          <div className="card-head"><h3>Salary</h3></div>
          <div className="card-body">
            <div className="fee-figures" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div className="k">Monthly Salary</div>
                <div className="v">₹ {formatINR(salary)}</div>
              </div>
              <div>
                <div className="k">Annual (×12)</div>
                <div className="v">₹ {formatINR(salary * 12)}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-50)', marginBottom: 0 }}>
              Salaries are recorded month-by-month under Monthly Expenses → Salaries.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Working Schedule &amp; Time Table</h3>
            <div className="sub">
              {teacher.workingHours ? `Working hours: ${teacher.workingHours} · ` : ''}
              {workingDays.length ? `${workingDays.length} working day${workingDays.length === 1 ? '' : 's'} a week` : 'No schedule recorded'}
            </div>
          </div>
        </div>
        <div className="card-body flush" style={{ paddingBottom: 0 }}>
          {!hasSchedule ? (
            <div className="empty-state" style={{ padding: '28px 24px' }}>
              <strong>No schedule yet</strong>
              <p>Add working days and the lecture time table from Edit Profile.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Working</th>
                    <th scope="col">Lecture Time Table</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEK_DAYS.map((day) => {
                    const on = workingDays.includes(day);
                    return (
                      <tr key={day}>
                        <td className="cell-strong">{day}</td>
                        <td>
                          {on ? <span className="badge solid">Working</span> : <span className="badge badge-muted">Off</span>}
                        </td>
                        <td>{on ? (timeTable[day] || '—') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && <TeacherForm teacher={teacher} onClose={() => setEditing(false)} />}
    </>
  );
}
