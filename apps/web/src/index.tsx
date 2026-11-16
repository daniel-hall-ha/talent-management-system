import { useEffect, useState } from 'react';
import { api } from './lib/api';
import type { Me } from './types';
import { Login } from './auth/Login';
import { Routes } from './routes';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<Me>('/me').then(setMe).catch(() => {}).finally(() => setReady(true));
  }, []);

  async function logout() {
    await api('/logout', { method: 'POST' });
    setMe(null);
  }

  if (!ready) return <div className="loading">Loading…</div>;
  if (!me) return <Login onLogin={setMe} />;
  return <Routes me={me} onLogout={logout} />;
}
