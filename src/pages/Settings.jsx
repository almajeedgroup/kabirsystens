import { useState } from 'react';
import { getSettings, updateSettings, clearAllData } from '../store.js';
import { readPhoto } from '../constants.js';
import { useToast } from '../components/Toast.jsx';
import { useConfirm } from '../components/Confirm.jsx';
import Logo from '../components/Logo.jsx';
import { PhoneIcon, MailIcon, PinIcon, TrashIcon } from '../components/Icons.jsx';

export default function Settings() {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(getSettings());
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const eraseAll = async () => {
    const ok = await confirm({
      title: 'Clear all data?',
      message: 'This permanently deletes every student, teacher, expense and balance sheet. Download a backup first if you might need it. This cannot be undone.',
      confirmLabel: 'Clear everything',
      danger: true,
    });
    if (ok) {
      clearAllData();
      toast('All data cleared');
    }
  };

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (file) setForm({ ...form, logo: await readPhoto(file) });
  };

  const save = (e) => {
    e.preventDefault();
    updateSettings(form);
    toast('College details saved');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>College identity used across the app header and on every exported report.</p>
        </div>
      </div>

      <div className="profile-grid">
        <form className="card" style={{ marginBottom: 0 }} onSubmit={save}>
          <div className="card-head"><h3>College Details</h3></div>
          <div className="card-body">
            <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label className="field">
                College Name
                <input value={form.collegeName} onChange={set('collegeName')} placeholder="College name" />
              </label>
              <label className="field">
                Unit / Sub-heading
                <input value={form.unit} onChange={set('unit')} placeholder="e.g. A Unit of Islamic Information Centre" />
              </label>
              <label className="field">
                Address
                <input value={form.address} onChange={set('address')} placeholder="Full address" />
              </label>
            </div>
            <div className="form-grid">
              <label className="field">
                Phone
                <input value={form.phone} onChange={set('phone')} placeholder="Contact number" />
              </label>
              <label className="field">
                Email
                <input type="email" value={form.email} onChange={set('email')} placeholder="Email address" />
              </label>
              <label className="field">
                Logo
                <input type="file" accept="image/*" onChange={onLogo} />
              </label>
            </div>
            <div className="btn-row" style={{ justifyContent: 'flex-end' }}>
              {form.logo && (
                <button type="button" className="btn ghost" onClick={() => setForm({ ...form, logo: '' })}>
                  Remove Logo
                </button>
              )}
              <button className="btn" type="submit">Save Details</button>
            </div>
          </div>
        </form>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-head"><h3>Preview</h3></div>
          <div className="card-body">
            <div className="settings-preview">
              {form.logo ? (
                <img src={form.logo} alt="College logo" className="settings-logo" />
              ) : (
                <Logo size={64} />
              )}
              <div>
                <div className="settings-name">{form.collegeName || 'College Name'}</div>
                <div className="settings-unit">{(form.unit || '').toUpperCase()}</div>
              </div>
            </div>
            <div className="info-list" style={{ marginTop: 8 }}>
              <div className="info-row">
                <span className="ic"><PinIcon size={17} /></span>
                <div><div className="k">Address</div><div className="v">{form.address || '—'}</div></div>
              </div>
              <div className="info-row">
                <span className="ic"><PhoneIcon size={17} /></span>
                <div><div className="k">Phone</div><div className="v">{form.phone || '—'}</div></div>
              </div>
              <div className="info-row">
                <span className="ic"><MailIcon size={17} /></span>
                <div><div className="k">Email</div><div className="v">{form.email || '—'}</div></div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-50)', marginBottom: 0 }}>
              This identity appears on the sidebar and as the letterhead on Word and printed reports.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Data</h3>
            <div className="sub">Back up or move data from Finance → Import &amp; Export. Clearing is permanent.</div>
          </div>
          <button className="btn ghost" onClick={eraseAll}>
            <TrashIcon size={16} /> Clear All Data
          </button>
        </div>
        <div className="card-body">
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-50)' }}>
            Removes every student, teacher, expense and balance sheet from this system. Your college
            details above are kept. Download a backup first if you might need the data again.
          </p>
        </div>
      </div>
    </>
  );
}
