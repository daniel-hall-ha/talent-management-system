import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { api } from '../lib/api';
import type { Me } from '../types';

export function Login({ onLogin, ready }: { onLogin: (me: Me) => void; ready: boolean }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      await api('/login', { method: 'POST', body: JSON.stringify({ loginId, password }) });
      onLogin(await api<Me>('/me'));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="login-page"><div className="login-card">
    <div className="login-brand"><div className="brand-icon"><CalendarDays size={24} /></div><h1>Talent Management</h1></div>
    <p>Sign in to your workspace</p>
    <form onSubmit={submit}>
      <label>Login ID<input type="text" required autoComplete="username" value={loginId} onChange={event => setLoginId(event.target.value)} placeholder="Enter your login ID" /></label>
      <label>Password<input type="password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary full" disabled={busy || !ready}>{!ready ? 'Connecting…' : busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </div></div>;
}
