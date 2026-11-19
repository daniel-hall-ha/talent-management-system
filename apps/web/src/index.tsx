import { useEffect, useState } from 'react';
import { api, ApiError } from './lib/api';
import type { Me } from './types';
import { Login } from './auth/Login';
import { Routes } from './routes';
import { ServiceStatus } from './components/ServiceStatus';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stopped = false;
    let retry: number | undefined;
    let controller: AbortController;
    async function connect() {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20_000);
      try {
        const user = await api<Me>('/me', { signal: controller.signal, cache: 'no-store' });
        if (!stopped) { setMe(user); setReady(true); }
      } catch (error) {
        if (stopped) return;
        // A JSON 401 means the API is awake and the visitor needs to sign in.
        if (error instanceof ApiError && error.status === 401) setReady(true);
        else retry = window.setTimeout(connect, 3000);
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void connect();
    return () => { stopped = true; controller?.abort(); window.clearTimeout(retry); };
  }, []);

  async function logout() {
    await api('/logout', { method: 'POST' });
    setMe(null);
  }

  if (!me) return <>
    <header className="topbar"><div className="crumb">Talent Management</div></header>
    <ServiceStatus ready={ready} />
    <Login onLogin={setMe} ready={ready} />
  </>;
  return <Routes me={me} onLogout={logout} />;
}
