import { useState } from 'react';
import { signIn, authErrorMessage } from '../firebase.js';
import { getSettings } from '../store.js';
import { COLLEGE } from '../constants.js';
import Logo from './Logo.jsx';

export default function Login() {
  const settings = getSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // On success the auth listener in App swaps in the app.
    } catch (err) {
      setError(authErrorMessage(err.code));
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          {settings.logo ? (
            <img src={settings.logo} alt="" style={{ width: 60, height: 60, objectFit: 'contain' }} />
          ) : (
            <Logo size={60} />
          )}
          <div>
            <strong>{settings.collegeName || COLLEGE.name}</strong>
            <small>{settings.unit || COLLEGE.unit}</small>
          </div>
        </div>

        <h1>Administrator Sign In</h1>
        <p className="login-sub">Sign in to manage students, staff and finance.</p>

        {error && <div className="notice error" style={{ marginBottom: 14 }}>{error}</div>}

        <label className="field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="username"
            required
            autoFocus
          />
        </label>
        <label className="field" style={{ marginTop: 14 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn login-btn" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="login-foot">Software by {COLLEGE.developer}</div>
      </form>
    </div>
  );
}
