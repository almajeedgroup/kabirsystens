import { useState } from 'react';
import { getData, deleteStaff } from '../store.js';
import { formatINR } from '../constants.js';
import Avatar from '../components/Avatar.jsx';
import TeacherForm from '../components/TeacherForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import { isActive, attritionStats } from '../utils/attrition.js';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, TeachersIcon } from '../components/Icons.jsx';

export default function Teachers({ year, navigate }) {
  const { staff } = getData();
  const toast = useToast();
  const confirm = useConfirm();
  const [modal, setModal] = useState(null); // null | 'new' | teacher object
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const stats = attritionStats(staff, year);

  const list = staff
    .filter((s) =>
      statusFilter === 'all' ? true : statusFilter === 'active' ? isActive(s) : !isActive(s)
    )
    .filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.designation || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.subject || '').toLowerCase().includes(search.toLowerCase())
    );

  // Salary outgo counts active members only.
  const totalSalary = list.filter(isActive).reduce((a, s) => a + Number(s.salary || 0), 0);

  const remove = async (e, s) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete member?',
      message: `Delete "${s.name}" from the register? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) {
      deleteStaff(s.id);
      toast(`Deleted ${s.name}`);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Teachers &amp; Staff</h2>
          <p>Faculty and staff register. Click a member to open their profile.</p>
        </div>
        <button className="btn" onClick={() => setModal('new')}>
          <PlusIcon size={17} /> Add Member
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card">
          <div>
            <div className="label">On Roll (Active)</div>
            <div className="value" style={{ fontSize: '1.3rem' }}>{stats.active}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Left (All-time)</div>
            <div className="value" style={{ fontSize: '1.3rem' }}>{stats.left}</div>
            <div className="hint">{stats.leftThisYear} in {year}</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Attrition Rate</div>
            <div className="value" style={{ fontSize: '1.3rem' }}>{stats.rate.toFixed(1)}%</div>
            <div className="hint">of {stats.total} ever on roll</div>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <div className="label">Monthly Salary (Active)</div>
            <div className="value" style={{ fontSize: '1.3rem' }}>₹ {formatINR(staff.filter(isActive).reduce((a, s) => a + Number(s.salary || 0), 0))}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar no-print">
          <div className="search-box">
            <SearchIcon size={17} />
            <input
              placeholder="Search by name, designation or subject"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search teachers and staff"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="active">Active</option>
            <option value="left">Left</option>
            <option value="all">All</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--ink-50)' }}>
            {list.length} member{list.length === 1 ? '' : 's'}
          </span>
        </div>

        {list.length === 0 ? (
          <div className="empty-state">
            <span className="icon"><TeachersIcon /></span>
            <strong>No teachers or staff found</strong>
            <p>Add your first member or adjust the search.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Designation</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Joined</th>
                  <th scope="col" className="num">Monthly Salary</th>
                  <th scope="col" className="no-print" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr
                    key={s.id}
                    className="clickable"
                    onClick={() => navigate('teacherProfile', { id: s.id })}
                  >
                    <td>
                      <div className="person-cell">
                        <Avatar name={s.name} photo={s.photo} size={38} />
                        <div>
                          <div className="cell-strong">
                            {s.name}
                            {!isActive(s) && <span className="badge badge-muted" style={{ marginLeft: 8 }}>Left</span>}
                          </div>
                          <div className="meta">{s.qualification || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.designation || '—'}</td>
                    <td>{s.subject ? <span className="badge">{s.subject}</span> : '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{isActive(s) ? (s.joinDate || '—') : `Left ${s.exitDate || ''}`.trim()}</td>
                    <td className="num">₹ {formatINR(s.salary)}</td>
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
                  <td colSpan={5}>Total Monthly Salary · {list.length} members</td>
                  <td className="num">₹ {formatINR(totalSalary)}</td>
                  <td className="no-print" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <TeacherForm teacher={modal === 'new' ? null : modal} onClose={() => setModal(null)} />
      )}
    </>
  );
}
