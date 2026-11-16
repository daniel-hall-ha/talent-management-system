import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { api } from '../lib/api';
import type { Me } from '../types';

export function Login({ onLogin }: { onLogin: (me: Me) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
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
      <label>Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label>
      <label>Password<input type="password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </div></div>;
}
