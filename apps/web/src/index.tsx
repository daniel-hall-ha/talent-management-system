import { useEffect, useState } from 'react';
import { api } from './lib/api';
import type { Me } from './types';
import { Login } from './auth/Login';
import { Routes } from './routes';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 3000);
    api<Me>('/me').then(setMe).catch(() => {}).finally(() => { window.clearTimeout(timer); setReady(true); });
    return () => window.clearTimeout(timer);
  }, []);

  async function logout() {
    await api('/logout', { method: 'POST' });
    setMe(null);
  }

  if (!ready) return <div className="loading">{slow ? 'Connecting to the server… The first request may take about a minute after inactivity.' : 'Loading…'}</div>;
  if (!me) return <Login onLogin={setMe} />;
  return <Routes me={me} onLogout={logout} />;
}
